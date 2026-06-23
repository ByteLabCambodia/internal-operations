-- 003 — Accounting
-- Chart of accounts (+ starter seed), journal entries/lines, exchange rates,
-- budgets, notifications. Placed before procurement because payments reference
-- journal_entries.

create table accounts (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  type       account_type not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger accounts_updated_at before update on accounts
  for each row execute function set_updated_at();

-- Starter chart of accounts.
insert into accounts (code, name, type) values
  ('1000', 'Cash / Bank',            'asset'),
  ('2000', 'Accounts Payable',       'liability'),
  ('3000', 'Owner Equity',           'equity'),
  ('4000', 'Sales / Service Income', 'income'),
  ('6000', 'Office Supplies Expense','expense'),
  ('6100', 'IT / Components Expense', 'expense'),
  ('6900', 'Misc Expense',           'expense');

create table journal_entries (
  id            uuid primary key default gen_random_uuid(),
  entry_date    date not null default current_date,
  memo          text,
  currency      currency not null default 'USD',
  exchange_rate numeric(18, 6) not null default 1,
  source        journal_source not null,
  source_ref    uuid,
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger journal_entries_updated_at before update on journal_entries
  for each row execute function set_updated_at();

create table journal_lines (
  id                     uuid primary key default gen_random_uuid(),
  entry_id               uuid not null references journal_entries (id) on delete cascade,
  account_id             uuid not null references accounts (id),
  debit_usd              numeric(18, 4) not null default 0,
  credit_usd             numeric(18, 4) not null default 0,
  dimension_department_id uuid references departments (id),
  dimension_project_id    uuid references projects (id),
  created_at             timestamptz not null default now(),
  -- a line is either a debit or a credit, never both, never negative
  constraint journal_line_one_sided check (
    debit_usd >= 0 and credit_usd >= 0 and not (debit_usd > 0 and credit_usd > 0)
  )
);
create index journal_lines_entry_idx on journal_lines (entry_id);
create index journal_lines_account_idx on journal_lines (account_id);

create table exchange_rates (
  id          uuid primary key default gen_random_uuid(),
  rate_date   date not null,
  currency    currency not null,
  rate_to_usd numeric(18, 6) not null,
  source      rate_source not null default 'manual',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (rate_date, currency)
);
create trigger exchange_rates_updated_at before update on exchange_rates
  for each row execute function set_updated_at();

-- Budgets power the Budget vs Actual report.
create table budgets (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references departments (id),
  project_id    uuid references projects (id),
  category      text,
  period        date not null, -- first day of the budget month
  amount_usd    numeric(18, 4) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger budgets_updated_at before update on budgets
  for each row execute function set_updated_at();

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  event         text not null,
  payload       jsonb not null default '{}'::jsonb,
  telegram_sent boolean not null default false,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read);
