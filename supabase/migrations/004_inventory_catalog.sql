-- 004 — Inventory catalog
-- The item master. Transactional inventory tables (claims, stock requests,
-- movements) live in 006 because they reference purchase orders.

create table inventory_items (
  id            uuid primary key default gen_random_uuid(),
  sku           text not null unique,
  name          text not null,
  category      text,
  unit          text not null default 'pcs',
  stock_qty     numeric(18, 4) not null default 0,
  reorder_point numeric(18, 4) not null default 0,
  reorder_qty   numeric(18, 4) not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger inventory_items_updated_at before update on inventory_items
  for each row execute function set_updated_at();
