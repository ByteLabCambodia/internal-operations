-- 011 — Manual stock adjustment RPC
-- stock_movements is written only by SECURITY DEFINER triggers (no direct
-- insert policy). Manual adjustments (corrections, stock-takes) go through this
-- function, which checks the caller is manager/admin, updates the item, and
-- appends a movement with reason 'adjustment'.

create or replace function adjust_stock(
  p_item uuid,
  p_delta numeric,
  p_note text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(18, 4);
begin
  if auth.uid() is not null and not has_role(array['manager', 'admin']::user_role[]) then
    raise exception 'only a manager or admin may adjust stock';
  end if;

  update inventory_items
     set stock_qty = stock_qty + p_delta
   where id = p_item
   returning stock_qty into v_balance;

  if v_balance is null then
    raise exception 'inventory item % not found', p_item;
  end if;
  if v_balance < 0 then
    raise exception 'adjustment would make stock negative (% )', v_balance;
  end if;

  insert into stock_movements
    (inventory_item_id, delta, reason, ref_table, ref_id, balance_after, created_by)
  values
    (p_item, p_delta, 'adjustment', 'manual', null, v_balance, auth.uid());

  return v_balance;
end;
$$;
