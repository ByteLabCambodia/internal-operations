-- 006 — Inventory transactions
-- Claims (PO -> stock), stock requests (stock -> out), and the append-only
-- movements ledger. Behavior is enforced by triggers in 007.

create table inventory_claims (
  id                uuid primary key default gen_random_uuid(),
  po_id             uuid references purchase_orders (id),
  po_item_id        uuid references purchase_order_items (id),
  inventory_item_id uuid not null references inventory_items (id),
  qty_claimed       numeric(18, 4) not null check (qty_claimed > 0),
  status            claim_status not null default 'pending',
  claimed_by        uuid references profiles (id),
  confirmed_by      uuid references profiles (id),
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger inventory_claims_updated_at before update on inventory_claims
  for each row execute function set_updated_at();
create index inventory_claims_po_idx on inventory_claims (po_id);

create table stock_requests (
  id                uuid primary key default gen_random_uuid(),
  requester_id      uuid not null references profiles (id),
  inventory_item_id uuid not null references inventory_items (id),
  qty               numeric(18, 4) not null check (qty > 0),
  status            stock_request_status not null default 'pending',
  fulfilled_by      uuid references profiles (id),
  fulfilled_at      timestamptz,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger stock_requests_updated_at before update on stock_requests
  for each row execute function set_updated_at();
create index stock_requests_requester_idx on stock_requests (requester_id);

-- Append-only ledger: balance_after snapshots stock after each movement.
create table stock_movements (
  id                uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items (id),
  delta             numeric(18, 4) not null, -- +in / -out
  reason            movement_reason not null,
  ref_table         text,
  ref_id            uuid,
  balance_after     numeric(18, 4) not null,
  created_by        uuid references profiles (id),
  created_at        timestamptz not null default now()
);
create index stock_movements_item_idx on stock_movements (inventory_item_id, created_at);
