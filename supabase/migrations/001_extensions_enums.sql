-- 001 — Extensions & enums
-- Foundation types used across the schema. Money is numeric (never float).

create extension if not exists pgcrypto; -- gen_random_uuid()

create type currency as enum ('USD', 'KHR', 'CNY');
create type user_role as enum ('employee', 'manager', 'finance', 'admin');
create type pr_status as enum ('draft', 'pending', 'approved', 'rejected', 'cancelled');
create type po_type as enum ('online', 'physical');
create type po_status as enum ('open', 'partial', 'complete', 'cancelled');
create type payment_status as enum ('unpaid', 'partial', 'paid');
create type claim_status as enum ('pending', 'confirmed', 'rejected');
create type stock_request_status as enum ('pending', 'fulfilled', 'rejected');
create type account_type as enum ('asset', 'liability', 'equity', 'income', 'expense');
create type movement_reason as enum ('claim', 'stock_request', 'adjustment');

-- [assumption] enums for the string-valued source columns named in the brief
create type journal_source as enum ('po_payment', 'manual_income', 'manual');
create type rate_source as enum ('api', 'manual');
