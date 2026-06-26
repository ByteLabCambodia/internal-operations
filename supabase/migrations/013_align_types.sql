-- 013 — Type alignment with the ProcureIQ flow spec
-- Adds new enum values and a stock priority type. Kept type-only and separate
-- from any DML/DDL that USES these values: Postgres forbids using an enum value
-- added via ALTER TYPE ... ADD VALUE in the same transaction it was added.

-- A PR that has been turned into a purchase order is "converted".
alter type pr_status add value if not exists 'converted';

-- Stock requests gain an explicit approval step before fulfilment.
alter type stock_request_status add value if not exists 'approved';

-- Priority levels for stock requests.
create type stock_priority as enum ('low', 'medium', 'high', 'urgent');
