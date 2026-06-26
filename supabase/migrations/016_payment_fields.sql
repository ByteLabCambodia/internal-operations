-- 016 — Payment detail fields
-- Capture how a payment was made for reconciliation: method, the bank/account
-- it came from, and a reference/transaction number. (paid_at already exists.)

create type payment_method as enum ('bank_transfer', 'cash', 'card', 'mobile', 'other');

alter table payments
  add column method       payment_method,
  add column bank_account text,
  add column reference    text;
