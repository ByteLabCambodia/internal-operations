-- 020 — Payment sender/remark fields
-- These columns were added to local dev directly and used by the app
-- (record-payment-form, OCR receipt parsing) but never migrated to prod,
-- causing "Could not find the 'remark' column of 'payments'" in production.

alter table payments
  add column if not exists sender      text,
  add column if not exists transfer_to text,
  add column if not exists trx_id      text,
  add column if not exists remark      text;
