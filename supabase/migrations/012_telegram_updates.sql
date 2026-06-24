-- 012 — Telegram update idempotency
-- Telegram retries webhook deliveries; we key processing on update_id so each
-- update is handled at most once. Written only by the service-role webhook
-- handler. RLS on with no policies => no anon/authenticated access.

create table telegram_updates (
  update_id    bigint primary key,
  processed_at timestamptz not null default now()
);

alter table telegram_updates enable row level security;
