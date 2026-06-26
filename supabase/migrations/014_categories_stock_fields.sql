-- 014 — Categories table + stock request fields
-- Runs in its own transaction, so it may safely use the enum values/types added
-- in 013 (stock_priority, stock_request_status 'approved').

-- ---------------------------------------------------------------------------
-- Categories (inventory item grouping). Items keep their existing free-text
-- `category` column; new items pick from this managed list by name.
-- ---------------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_updated_at before update on categories
  for each row execute function set_updated_at();

alter table categories enable row level security;
-- Everyone signed in can read; managers/admins manage (mirrors inventory_items).
create policy categories_select on categories
  for select to authenticated using (true);
create policy categories_write on categories
  for all to authenticated
  using (has_role('{manager,admin}')) with check (has_role('{manager,admin}'));

-- ---------------------------------------------------------------------------
-- Stock request fields from the spec: priority + an explicit approval step.
-- ---------------------------------------------------------------------------
alter table stock_requests
  add column priority    stock_priority not null default 'medium',
  add column department  text,
  add column approved_by uuid references profiles (id),
  add column approved_at timestamptz;

-- ---------------------------------------------------------------------------
-- Seed a few default categories (idempotent).
-- ---------------------------------------------------------------------------
insert into categories (name, description) values
  ('Electronics',    'Components, boards, sensors'),
  ('Office Supplies', 'Stationery and consumables'),
  ('Tools',          'Hand and power tools'),
  ('Materials',      'Raw and bulk materials')
on conflict (name) do nothing;
