-- 005 — Procurement
-- Purchase requests, PR items, purchase orders, PO items, payments.
-- exchange_rate is units of currency per 1 USD; amount_usd is derived and
-- locked at submission time (see triggers in 007).

create table purchase_requests (
  id                  uuid primary key default gen_random_uuid(),
  requester_id        uuid not null references profiles (id),
  status              pr_status not null default 'draft',
  currency            currency not null default 'USD',
  exchange_rate       numeric(18, 6) not null default 1,
  total_original      numeric(18, 4) not null default 0,
  total_usd           numeric(18, 4) not null default 0,
  department_id       uuid references departments (id),
  project_id          uuid references projects (id),
  note                text,
  approver_id         uuid references profiles (id),
  decided_at          timestamptz,
  telegram_message_id bigint,
  telegram_chat_id    bigint,
  auto_generated      boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger purchase_requests_updated_at before update on purchase_requests
  for each row execute function set_updated_at();
create index purchase_requests_requester_idx on purchase_requests (requester_id);
create index purchase_requests_status_idx on purchase_requests (status);

create table purchase_request_items (
  id                  uuid primary key default gen_random_uuid(),
  pr_id               uuid not null references purchase_requests (id) on delete cascade,
  name                text not null,
  qty                 numeric(18, 4) not null default 1,
  unit_price_original numeric(18, 4) not null default 0,
  inventory_item_id   uuid references inventory_items (id),
  category            text,
  created_at          timestamptz not null default now()
);
create index purchase_request_items_pr_idx on purchase_request_items (pr_id);

create table purchase_orders (
  id             uuid primary key default gen_random_uuid(),
  pr_id          uuid references purchase_requests (id),
  type           po_type not null default 'online',
  supplier       text,
  currency       currency not null default 'USD',
  exchange_rate  numeric(18, 6) not null default 1,
  status         po_status not null default 'open',
  payment_status payment_status not null default 'unpaid',
  total_original numeric(18, 4) not null default 0,
  total_usd      numeric(18, 4) not null default 0,
  department_id  uuid references departments (id),
  project_id     uuid references projects (id),
  created_by     uuid references profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger purchase_orders_updated_at before update on purchase_orders
  for each row execute function set_updated_at();
create index purchase_orders_status_idx on purchase_orders (status);

create table purchase_order_items (
  id                  uuid primary key default gen_random_uuid(),
  po_id               uuid not null references purchase_orders (id) on delete cascade,
  inventory_item_id   uuid references inventory_items (id),
  name                text not null,
  qty_ordered         numeric(18, 4) not null default 1,
  qty_claimed         numeric(18, 4) not null default 0,
  unit_price_original numeric(18, 4) not null default 0,
  created_at          timestamptz not null default now()
);
create index purchase_order_items_po_idx on purchase_order_items (po_id);

create table payments (
  id                 uuid primary key default gen_random_uuid(),
  po_id              uuid references purchase_orders (id), -- nullable: physical buys
  amount_original    numeric(18, 4) not null,
  currency           currency not null default 'USD',
  exchange_rate      numeric(18, 6) not null default 1,
  amount_usd         numeric(18, 4) not null default 0, -- derived in trigger
  paid_at            timestamptz not null default now(),
  receipt_object_key text, -- R2 object key
  recorded_by        uuid references profiles (id),
  journal_entry_id   uuid references journal_entries (id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();
create index payments_po_idx on payments (po_id);
