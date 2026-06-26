-- 015 — Activity timeline (audit log)
-- Append-only event log powering per-record timelines (who did what, when) for
-- purchase requests, purchase orders, payments, and stock requests. Events are
-- written from server actions via lib/activity.ts; this table is never updated
-- or deleted in normal operation.

create table activity_events (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,          -- 'purchase_request' | 'purchase_order' | 'payment' | 'stock_request'
  entity_id   uuid not null,
  action      text not null,          -- 'created' | 'approved' | 'rejected' | 'converted' | 'payment_recorded' | ...
  actor_id    uuid references profiles (id),
  detail      jsonb,                  -- optional context (e.g. {"note": "...", "amount_usd": 12.3})
  created_at  timestamptz not null default now()
);
create index activity_events_entity_idx
  on activity_events (entity_type, entity_id, created_at);
create index activity_events_actor_idx on activity_events (actor_id);

-- RLS: readable by anyone who can see the underlying entity; insert-only for
-- the acting user (server actions run as the signed-in user). The service role
-- bypasses RLS for trusted server flows (telegram, init-data bridge).
alter table activity_events enable row level security;

create policy ae_select on activity_events
  for select to authenticated using (
    has_role('{manager,finance,admin}')
    or actor_id = auth.uid()
    or (entity_type = 'purchase_request' and exists (
          select 1 from purchase_requests pr
          where pr.id = entity_id and pr.requester_id = auth.uid()))
    or (entity_type = 'purchase_order' and exists (
          select 1 from purchase_orders po
          where po.id = entity_id and po.created_by = auth.uid()))
    or (entity_type = 'stock_request' and exists (
          select 1 from stock_requests sr
          where sr.id = entity_id and sr.requester_id = auth.uid()))
  );

create policy ae_insert_self on activity_events
  for insert to authenticated with check (actor_id = auth.uid());
