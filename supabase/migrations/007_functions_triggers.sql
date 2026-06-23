-- 007 — Critical invariants
-- These enforce the business rules in the DB so they hold for any client.
-- Functions that write to RLS-protected tables are SECURITY DEFINER so the
-- enforced side effects always succeed regardless of the caller's policies.

-- ---------------------------------------------------------------------------
-- 1. Derive amount_usd / total_usd from a locked rate (currency per 1 USD).
-- ---------------------------------------------------------------------------
create or replace function set_amount_usd()
returns trigger
language plpgsql
as $$
begin
  if new.exchange_rate is null or new.exchange_rate <= 0 then
    raise exception 'exchange_rate must be > 0';
  end if;
  new.amount_usd := round(new.amount_original / new.exchange_rate, 4);
  return new;
end;
$$;

create trigger payments_amount_usd
  before insert or update of amount_original, exchange_rate on payments
  for each row execute function set_amount_usd();

create or replace function set_total_usd()
returns trigger
language plpgsql
as $$
begin
  if new.exchange_rate is null or new.exchange_rate <= 0 then
    raise exception 'exchange_rate must be > 0';
  end if;
  new.total_usd := round(coalesce(new.total_original, 0) / new.exchange_rate, 4);
  return new;
end;
$$;

create trigger purchase_requests_total_usd
  before insert or update of total_original, exchange_rate on purchase_requests
  for each row execute function set_total_usd();

create trigger purchase_orders_total_usd
  before insert or update of total_original, exchange_rate on purchase_orders
  for each row execute function set_total_usd();

-- ---------------------------------------------------------------------------
-- 2. Journal entries must balance (sum debit = sum credit), checked at commit.
-- ---------------------------------------------------------------------------
create or replace function assert_journal_balanced()
returns trigger
language plpgsql
as $$
declare
  v_entry  uuid := coalesce(new.entry_id, old.entry_id);
  v_debit  numeric(18, 4);
  v_credit numeric(18, 4);
  v_exists boolean;
begin
  select exists(select 1 from journal_entries where id = v_entry) into v_exists;
  if not v_exists then
    return null; -- entry deleted (cascade); nothing to balance
  end if;

  select coalesce(sum(debit_usd), 0), coalesce(sum(credit_usd), 0)
    into v_debit, v_credit
    from journal_lines where entry_id = v_entry;

  if round(v_debit, 4) <> round(v_credit, 4) then
    raise exception 'journal entry % is unbalanced (debit % <> credit %)',
      v_entry, v_debit, v_credit;
  end if;
  return null;
end;
$$;

create constraint trigger journal_lines_balanced
  after insert or update or delete on journal_lines
  deferrable initially deferred
  for each row execute function assert_journal_balanced();

-- ---------------------------------------------------------------------------
-- 3. Claim confirmed -> stock up, movement, bump PO item, recompute PO status.
-- ---------------------------------------------------------------------------
create or replace function on_claim_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance     numeric(18, 4);
  v_all_claimed boolean;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.confirmed_at := coalesce(new.confirmed_at, now());

    update inventory_items
       set stock_qty = stock_qty + new.qty_claimed
     where id = new.inventory_item_id
     returning stock_qty into v_balance;

    insert into stock_movements
      (inventory_item_id, delta, reason, ref_table, ref_id, balance_after, created_by)
    values
      (new.inventory_item_id, new.qty_claimed, 'claim', 'inventory_claims',
       new.id, v_balance, new.confirmed_by);

    if new.po_item_id is not null then
      update purchase_order_items
         set qty_claimed = qty_claimed + new.qty_claimed
       where id = new.po_item_id;
    end if;

    if new.po_id is not null then
      select bool_and(qty_claimed >= qty_ordered) into v_all_claimed
        from purchase_order_items where po_id = new.po_id;

      update purchase_orders
         set status = case when v_all_claimed then 'complete'::po_status
                           else 'partial'::po_status end
       where id = new.po_id and status <> 'cancelled';
    end if;
  end if;
  return new;
end;
$$;

create trigger inventory_claims_confirm
  before update of status on inventory_claims
  for each row execute function on_claim_confirmed();

-- ---------------------------------------------------------------------------
-- 4. Stock request fulfilled -> stock down (guard >= 0), movement, auto-reorder.
-- ---------------------------------------------------------------------------
create or replace function on_stock_request_fulfilled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item    inventory_items%rowtype;
  v_balance numeric(18, 4);
  v_pr      uuid;
begin
  if new.status = 'fulfilled' and old.status is distinct from 'fulfilled' then
    new.fulfilled_at := coalesce(new.fulfilled_at, now());

    select * into v_item from inventory_items
      where id = new.inventory_item_id for update;

    if v_item.stock_qty < new.qty then
      raise exception 'insufficient stock for % (have %, need %)',
        v_item.sku, v_item.stock_qty, new.qty;
    end if;

    update inventory_items
       set stock_qty = stock_qty - new.qty
     where id = new.inventory_item_id
     returning stock_qty into v_balance;

    insert into stock_movements
      (inventory_item_id, delta, reason, ref_table, ref_id, balance_after, created_by)
    values
      (new.inventory_item_id, -new.qty, 'stock_request', 'stock_requests',
       new.id, v_balance, new.fulfilled_by);

    -- Auto-reorder: at/below reorder point -> draft auto-PR + notify mgrs/admins.
    if v_balance <= v_item.reorder_point and v_item.reorder_qty > 0 then
      insert into purchase_requests
        (requester_id, status, currency, exchange_rate, total_original, total_usd,
         note, auto_generated)
      values
        (new.fulfilled_by, 'draft', 'USD', 1, 0, 0,
         'Auto-reorder: ' || v_item.sku || ' at/below reorder point', true)
      returning id into v_pr;

      insert into purchase_request_items
        (pr_id, name, qty, unit_price_original, inventory_item_id, category)
      values
        (v_pr, v_item.name, v_item.reorder_qty, 0, v_item.id, v_item.category);

      insert into notifications (user_id, event, payload)
      select p.id, 'stock_below_reorder',
             jsonb_build_object(
               'inventory_item_id', v_item.id,
               'sku', v_item.sku,
               'stock_qty', v_balance,
               'reorder_point', v_item.reorder_point,
               'pr_id', v_pr)
        from profiles p
       where p.role in ('manager', 'admin') and p.active;
    end if;
  end if;
  return new;
end;
$$;

create trigger stock_requests_fulfil
  before update of status on stock_requests
  for each row execute function on_stock_request_fulfilled();

-- ---------------------------------------------------------------------------
-- 5. Payment insert -> balanced journal entry (DR expense / CR cash),
--    link the entry, roll up PO payment_status.
-- ---------------------------------------------------------------------------
create or replace function on_payment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry   uuid;
  v_expense uuid;
  v_cash    uuid;
  v_dept    uuid;
  v_proj    uuid;
  v_total   numeric(18, 4);
  v_paid    numeric(18, 4);
begin
  select id into v_expense from accounts where code = '6100'; -- IT/Components Expense
  select id into v_cash    from accounts where code = '1000'; -- Cash / Bank

  if new.po_id is not null then
    select department_id, project_id into v_dept, v_proj
      from purchase_orders where id = new.po_id;
  end if;

  insert into journal_entries
    (entry_date, memo, currency, exchange_rate, source, source_ref, created_by)
  values
    (coalesce(new.paid_at::date, current_date),
     'Payment' || coalesce(' for PO ' || new.po_id::text, ' (direct expense)'),
     new.currency, new.exchange_rate, 'po_payment', new.id, new.recorded_by)
  returning id into v_entry;

  insert into journal_lines
    (entry_id, account_id, debit_usd, credit_usd, dimension_department_id, dimension_project_id)
  values
    (v_entry, v_expense, new.amount_usd, 0, v_dept, v_proj),
    (v_entry, v_cash,    0, new.amount_usd, v_dept, v_proj);

  update payments set journal_entry_id = v_entry where id = new.id;

  if new.po_id is not null then
    select total_usd into v_total from purchase_orders where id = new.po_id;
    select coalesce(sum(amount_usd), 0) into v_paid
      from payments where po_id = new.po_id;

    update purchase_orders
       set payment_status = case
             when v_paid <= 0          then 'unpaid'::payment_status
             when v_paid >= v_total    then 'paid'::payment_status
             else 'partial'::payment_status end
     where id = new.po_id;
  end if;

  return null;
end;
$$;

create trigger payments_journal
  after insert on payments
  for each row execute function on_payment_insert();
