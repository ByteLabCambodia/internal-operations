-- 008 — Row-Level Security
-- RLS enabled on every table with explicit per-role policies matching the
-- brief's permission matrix. The service role bypasses RLS (used by trusted
-- server flows: webhook, init-data bridge, cron, seed).

-- Helpers -------------------------------------------------------------------
create or replace function has_role(roles user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = any(roles) and active
  );
$$;

-- =================== profiles ===================
alter table profiles enable row level security;

create policy profiles_select_all on profiles
  for select to authenticated using (true);
create policy profiles_insert_self on profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all to authenticated using (has_role('{admin}')) with check (has_role('{admin}'));

-- =================== departments / projects ===================
alter table departments enable row level security;
create policy departments_select on departments
  for select to authenticated using (true);
create policy departments_admin on departments
  for all to authenticated using (has_role('{admin}')) with check (has_role('{admin}'));

alter table projects enable row level security;
create policy projects_select on projects
  for select to authenticated using (true);
create policy projects_admin on projects
  for all to authenticated using (has_role('{admin}')) with check (has_role('{admin}'));

-- =================== purchase_requests ===================
alter table purchase_requests enable row level security;
create policy pr_select on purchase_requests
  for select to authenticated
  using (requester_id = auth.uid() or has_role('{manager,finance,admin}'));
create policy pr_insert_own on purchase_requests
  for insert to authenticated with check (requester_id = auth.uid());
-- requester edits own while still a draft
create policy pr_update_own_draft on purchase_requests
  for update to authenticated
  using (requester_id = auth.uid() and status in ('draft', 'pending'))
  with check (requester_id = auth.uid());
-- managers/admins approve / reject (pr.decide)
create policy pr_update_decide on purchase_requests
  for update to authenticated
  using (has_role('{manager,admin}')) with check (has_role('{manager,admin}'));

-- =================== purchase_request_items ===================
alter table purchase_request_items enable row level security;
create policy pri_select on purchase_request_items
  for select to authenticated using (
    exists (select 1 from purchase_requests pr where pr.id = pr_id
      and (pr.requester_id = auth.uid() or has_role('{manager,finance,admin}'))));
create policy pri_write_owner on purchase_request_items
  for all to authenticated using (
    exists (select 1 from purchase_requests pr where pr.id = pr_id
      and pr.requester_id = auth.uid() and pr.status in ('draft', 'pending')))
  with check (
    exists (select 1 from purchase_requests pr where pr.id = pr_id
      and pr.requester_id = auth.uid() and pr.status in ('draft', 'pending')));

-- =================== purchase_orders ===================
alter table purchase_orders enable row level security;
create policy po_select on purchase_orders
  for select to authenticated
  using (created_by = auth.uid() or has_role('{manager,finance,admin}'));
create policy po_write on purchase_orders
  for all to authenticated
  using (has_role('{manager,finance,admin}')) with check (has_role('{manager,finance,admin}'));

-- =================== purchase_order_items ===================
alter table purchase_order_items enable row level security;
create policy poi_select on purchase_order_items
  for select to authenticated using (
    exists (select 1 from purchase_orders po where po.id = po_id
      and (po.created_by = auth.uid() or has_role('{manager,finance,admin}'))));
create policy poi_write on purchase_order_items
  for all to authenticated
  using (has_role('{manager,finance,admin}')) with check (has_role('{manager,finance,admin}'));

-- =================== payments ===================
alter table payments enable row level security;
create policy payments_select on payments
  for select to authenticated using (has_role('{manager,finance,admin}'));
create policy payments_write on payments
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

-- =================== inventory_items (catalog) ===================
alter table inventory_items enable row level security;
create policy inv_select on inventory_items
  for select to authenticated using (true);
create policy inv_write on inventory_items
  for all to authenticated
  using (has_role('{manager,admin}')) with check (has_role('{manager,admin}'));

-- =================== inventory_claims ===================
alter table inventory_claims enable row level security;
create policy claims_select on inventory_claims
  for select to authenticated
  using (claimed_by = auth.uid() or has_role('{manager,finance,admin}'));
create policy claims_insert_own on inventory_claims
  for insert to authenticated with check (claimed_by = auth.uid());
-- managers/admins confirm/reject (claim.confirm)
create policy claims_update_confirm on inventory_claims
  for update to authenticated
  using (has_role('{manager,admin}')) with check (has_role('{manager,admin}'));

-- =================== stock_requests ===================
alter table stock_requests enable row level security;
create policy sr_select on stock_requests
  for select to authenticated
  using (requester_id = auth.uid() or has_role('{manager,finance,admin}'));
create policy sr_insert_own on stock_requests
  for insert to authenticated with check (requester_id = auth.uid());
-- managers/admins fulfil/reject (stock.fulfil)
create policy sr_update_fulfil on stock_requests
  for update to authenticated
  using (has_role('{manager,admin}')) with check (has_role('{manager,admin}'));

-- =================== stock_movements (ledger, append-only) ===================
alter table stock_movements enable row level security;
create policy sm_select on stock_movements
  for select to authenticated using (true);
-- inserts happen only via SECURITY DEFINER triggers; no direct insert policy.

-- =================== accounting (manager/finance/admin only) ===================
alter table accounts enable row level security;
create policy accounts_select on accounts
  for select to authenticated using (has_role('{manager,finance,admin}'));
create policy accounts_write on accounts
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

alter table journal_entries enable row level security;
create policy je_select on journal_entries
  for select to authenticated using (has_role('{manager,finance,admin}'));
create policy je_write on journal_entries
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

alter table journal_lines enable row level security;
create policy jl_select on journal_lines
  for select to authenticated using (has_role('{manager,finance,admin}'));
create policy jl_write on journal_lines
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

alter table budgets enable row level security;
create policy budgets_select on budgets
  for select to authenticated using (has_role('{manager,finance,admin}'));
create policy budgets_write on budgets
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

-- =================== exchange_rates ===================
alter table exchange_rates enable row level security;
-- everyone authenticated reads rates (needed to show locked rate on PRs)
create policy rates_select on exchange_rates
  for select to authenticated using (true);
create policy rates_write on exchange_rates
  for all to authenticated
  using (has_role('{finance,admin}')) with check (has_role('{finance,admin}'));

-- =================== notifications ===================
alter table notifications enable row level security;
create policy notif_select_own on notifications
  for select to authenticated using (user_id = auth.uid());
create policy notif_update_own on notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- inserts happen via SECURITY DEFINER triggers / service role.
