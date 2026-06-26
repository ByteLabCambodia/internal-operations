-- 017 — Sequential PO number for human-readable references
-- Adds a short auto-incrementing label (PO-0001, PO-0002, …) to purchase_orders
-- and updates the payment journal trigger to use it in the memo.

create sequence if not exists po_number_seq start 1;

alter table purchase_orders
  add column if not exists po_number text
    default 'PO-' || lpad(nextval('po_number_seq')::text, 4, '0');

-- Back-fill existing rows (order by created_at to keep numbers logical)
do $$
declare
  r record;
begin
  for r in
    select id from purchase_orders order by created_at
  loop
    update purchase_orders
       set po_number = 'PO-' || lpad(nextval('po_number_seq')::text, 4, '0')
     where id = r.id and po_number is null;
  end loop;
end;
$$;

alter table purchase_orders
  alter column po_number set not null;

-- Update payment trigger to use po_number instead of UUID
create or replace function on_payment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry    uuid;
  v_expense  uuid;
  v_cash     uuid;
  v_dept     uuid;
  v_proj     uuid;
  v_total    numeric(18, 4);
  v_paid     numeric(18, 4);
  v_po_label text;
begin
  select id into v_expense from accounts where code = '6100';
  select id into v_cash    from accounts where code = '1000';

  if new.po_id is not null then
    select department_id, project_id, po_number
      into v_dept, v_proj, v_po_label
      from purchase_orders where id = new.po_id;
  end if;

  insert into journal_entries
    (entry_date, memo, currency, exchange_rate, source, source_ref, created_by)
  values
    (coalesce(new.paid_at::date, current_date),
     'Payment' || coalesce(' for ' || v_po_label, ' (direct expense)'),
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
             when v_paid <= 0       then 'unpaid'::payment_status
             when v_paid >= v_total then 'paid'::payment_status
             else                        'partial'::payment_status end
     where id = new.po_id;
  end if;

  return new;
end;
$$;
