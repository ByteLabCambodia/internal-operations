# Build Brief — Procurement, Inventory & Accounting Platform (Web + Telegram Mini App)

You are building a multi-currency **procurement → inventory → accounting** platform for a small robotics/STEM team that buys components from online stores (Taobao, Pinduoduo — CNY) and local Phnom Penh shops (KHR/USD). The system has a **web app** and a **Telegram bot + Mini App**. Build it incrementally in the phases at the bottom. Ask me before making schema changes that diverge from this spec.

---

## 1. Tech stack (fixed)

- **Framework:** Next.js (App Router, TypeScript, Server Actions + Route Handlers).
- **DB / Auth:** Supabase (Postgres + Row-Level Security + Supabase Auth).
- **File storage:** Cloudflare R2 (S3-compatible) for receipt/image uploads, via presigned URLs.
- **Telegram:** Bot API via webhook (use **grammY**) + a **Telegram Mini App** (web app launched inside Telegram).
- **Deployment:** Vercel, auto-deploy from GitHub `main`. Preview deploys on PRs.
- **Styling:** Tailwind CSS + a small component set (shadcn/ui). Keep it clean, dense, table-friendly.
- **Money:** Postgres `numeric(18,4)` everywhere — never floats. Base reporting currency is **USD**.

Set up the repo so `git push` → Vercel build. Include `.env.example`, README with setup steps, and SQL migrations (Supabase CLI `supabase/migrations/`).

---

## 2. Core domain rules (read carefully — these drive the schema)

1. **Multi-currency with rate locking.** Every money record stores: `amount_original`, `currency`, `exchange_rate` (units of currency per 1 USD), and a derived `amount_usd`. The **exchange rate is locked at the moment of submission** (PR submission) and copied onto the record — later daily-rate changes must NOT retroactively alter it.
2. **USD is the base.** `exchange_rates` are stored daily as `rate_to_usd`. USD itself always = 1.0. Conversion: `amount_usd = amount_original / exchange_rate` (rate = currency-per-USD, e.g. 7.24 CNY/USD → ¥500 = $69.06).
3. **Double-entry accounting.** Every PO payment auto-creates a balanced journal entry (sum of debits = sum of credits, in USD). A journal entry has a header + ≥2 lines.
4. **Partial fulfilment is first-class.** Inventory claims can be partial; a PO is only `complete` when total claimed qty == ordered qty across all its line items.
5. **Auto-reorder.** When a stock level drops at/below its reorder point, the system auto-creates a draft Purchase Request and notifies Manager + Admin.
6. **Department & Project dimensions.** PRs/POs carry optional `department` and `project` tags so accounting reports can slice by them. (Assumption — include these; they power two of the reports.)

---

## 3. Roles & permissions

Roles: `employee`, `manager`, `finance`, `admin`. Stored on `profiles.role`. Enforce in **both** Supabase RLS (DB layer) and server actions (app layer).

| Action | employee | manager | finance | admin |
|---|---|---|---|---|
| Create PR | ✅ | ✅ | ✅ | ✅ |
| Approve / Reject PR | ❌ | ✅ | ❌ | ✅ |
| Create PO | ❌ | ✅ | ✅ | ✅ |
| Record Payment | ❌ | ❌ | ✅ | ✅ |
| Submit Inventory Claim | ✅ | ✅ | ✅ | ✅ |
| Confirm Inventory Claim | ❌ | ✅ | ❌ | ✅ |
| Request Stock | ✅ | ✅ | ✅ | ✅ |
| Fulfil Stock Request | ❌ | ✅ | ❌ | ✅ |
| View Accounting | ❌ | ✅ | ✅ | ✅ |
| Add Income Entry | ❌ | ❌ | ✅ | ✅ |
| Override Exchange Rate | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |

---

## 4. Data model (Supabase / Postgres)

Use `gen_random_uuid()` PKs, `created_at`/`updated_at timestamptz`, and these enums:
`currency` (`USD`,`KHR`,`CNY`), `user_role`, `pr_status` (`draft`,`pending`,`approved`,`rejected`,`cancelled`), `po_type` (`online`,`physical`), `po_status` (`open`,`partial`,`complete`,`cancelled`), `payment_status` (`unpaid`,`partial`,`paid`), `claim_status` (`pending`,`confirmed`,`rejected`), `stock_request_status` (`pending`,`fulfilled`,`rejected`), `account_type` (`asset`,`liability`,`equity`,`income`,`expense`), `movement_reason` (`claim`,`stock_request`,`adjustment`).

**Identity & org**
- `profiles` — `id (=auth.users.id)`, `full_name`, `role`, `telegram_id bigint unique`, `telegram_username`, `department`, `active bool`.
- `departments`, `projects` — `id`, `name`, `active`.

**Procurement**
- `purchase_requests` — `id`, `requester_id`, `status pr_status`, `currency`, `exchange_rate numeric`, `total_original numeric`, `total_usd numeric`, `department_id`, `project_id`, `note`, `approver_id`, `decided_at`, `telegram_message_id`, `telegram_chat_id`, `auto_generated bool`.
- `purchase_request_items` — `id`, `pr_id`, `name`, `qty`, `unit_price_original numeric`, `inventory_item_id (nullable)`, `category`.
- `purchase_orders` — `id`, `pr_id (nullable)`, `type po_type`, `supplier`, `currency`, `exchange_rate`, `status po_status`, `payment_status`, `total_original`, `total_usd`, `department_id`, `project_id`, `created_by`.
- `purchase_order_items` — `id`, `po_id`, `inventory_item_id`, `name`, `qty_ordered`, `qty_claimed numeric default 0`, `unit_price_original`.
- `payments` — `id`, `po_id`, `amount_original`, `currency`, `exchange_rate`, `amount_usd`, `paid_at`, `receipt_object_key` (R2), `recorded_by`, `journal_entry_id`.
  - For **physical** purchases there may be no PO; allow `payments.po_id` nullable and attach the expense/receipt directly. Still create a journal entry.

**Inventory**
- `inventory_items` — `id`, `sku`, `name`, `category`, `unit`, `stock_qty numeric default 0`, `reorder_point numeric default 0`, `reorder_qty numeric`, `active`.
- `inventory_claims` — `id`, `po_id`, `po_item_id`, `inventory_item_id`, `qty_claimed`, `status claim_status`, `claimed_by`, `confirmed_by`, `confirmed_at`.
- `stock_requests` — `id`, `requester_id`, `inventory_item_id`, `qty`, `status stock_request_status`, `fulfilled_by`, `fulfilled_at`, `note`.
- `stock_movements` — append-only ledger: `id`, `inventory_item_id`, `delta numeric` (+in/−out), `reason movement_reason`, `ref_table`, `ref_id`, `balance_after`, `created_by`.

**Accounting**
- `accounts` — chart of accounts: `id`, `code`, `name`, `type account_type`, `active`. Seed a starter chart (Cash/Bank, AP, Office Supplies Expense, IT/Components Expense, Misc Expense, Sales/Service Income, Owner Equity).
- `journal_entries` — `id`, `entry_date`, `memo`, `currency`, `exchange_rate`, `source` (`po_payment`,`manual_income`,`manual`), `source_ref`, `created_by`.
- `journal_lines` — `id`, `entry_id`, `account_id`, `debit_usd numeric default 0`, `credit_usd numeric default 0`, `dimension_department_id`, `dimension_project_id`. Enforce per-entry balance via trigger/check.
- `exchange_rates` — `id`, `rate_date date`, `currency`, `rate_to_usd numeric`, `source` (`api`,`manual`), unique `(rate_date, currency)`.
- `notifications` — `id`, `user_id`, `event`, `payload jsonb`, `telegram_sent bool`, `read bool`.

**Critical invariants — implement as Postgres functions/triggers (so the rules hold no matter which client writes):**
- `amount_usd = round(amount_original / exchange_rate, 4)` on insert.
- On `inventory_claims` → `confirmed`: increment `inventory_items.stock_qty`, write a `+` `stock_movements` row, bump `purchase_order_items.qty_claimed`, and set PO `status=complete` when all items fully claimed (else `partial`).
- On `stock_requests` → `fulfilled`: decrement stock (guard against negative), write a `−` `stock_movements` row; if `stock_qty <= reorder_point`, insert a draft auto-PR for `reorder_qty` and flag `auto_generated`.
- On `payments` insert: create the balanced `journal_entries` + `journal_lines` (DR expense / CR cash-bank), set `payments.journal_entry_id`, and roll up PO `payment_status`.

---

## 5. Row-Level Security

Enable RLS on every table. Helper: `auth.uid()` → join `profiles`. Pattern:
- Employees can read/insert their **own** PRs, claims, stock requests; read inventory catalog.
- Managers/Admins can approve/reject/fulfil/confirm (write to status columns).
- Finance/Admin can write `payments`, manual `journal_entries`, `exchange_rates`.
- Only Admin can write `profiles.role` / manage users.
- Accounting tables readable only by manager/finance/admin.
Write the policies explicitly per role in migrations; don't rely on app checks alone.

---

## 6. Telegram bot + Mini App

**Bot (webhook at `/api/telegram/webhook`, grammY):**
- Routes notifications per the table below. Group notifications post to a **forum topic** (`message_thread_id`); personal ones are DMs (require the user to have `/start`ed the bot — map `telegram_id`).
- **Approval cards:** PR-created card posts to the manager group topic with inline `✅ Approve` / `❌ Reject` buttons. On `callback_query`: verify the presser is manager/admin (look up `telegram_id`→role), update the PR, **edit the original message** to show the decision + who decided, then DM the requester.
- Same inline-action pattern for **inventory claim confirm** and **stock request fulfil**.

| Event | Destination |
|---|---|
| PR created | Manager group topic |
| PR approved / rejected | Employee DM |
| PO created | Finance group topic |
| Payment recorded | Manager DM |
| Inventory claim submitted | Manager group topic |
| Claim confirmed | Employee DM |
| Stock request submitted | Manager DM |
| Stock below reorder point | Manager + Admin DM |
| Exchange rate updated | Finance DM (daily summary) |

**Mini App (the Next.js app rendered inside Telegram):**
- Launched via bot menu button / inline `web_app` button.
- **Auth:** on load, send Telegram `initData` to a server route; validate the HMAC signature using the bot token (reject if invalid/stale). Map `telegram_id` → `profiles`. Then mint a Supabase session for that user (sign a Supabase-compatible JWT server-side with the project JWT secret, or use Supabase admin to issue a session) so RLS applies normally.
- For browser (non-Telegram) access, use standard **Supabase Auth** (email magic link / OTP). A single `profiles` row backs both entry points; `telegram_id` links them.
- Use Telegram theme params + `BackButton`/`MainButton`; keep the Mini App mobile-first.

Abstract all sends behind a `notify(event, payload)` service so DB triggers/server actions just enqueue notifications and a sender dispatches them.

---

## 7. Cloudflare R2 (receipts/images)

- S3-compatible via `@aws-sdk/client-s3`. Server route issues a **presigned PUT URL**; client uploads the file directly to R2 (don't stream large files through serverless). Store only the `object_key` in DB.
- Serve images via presigned GET URLs (short TTL) or a public/custom-domain bucket. Validate content-type & size server-side before signing.
- Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.

---

## 8. App surface (pages / routes)

Web + Mini App share components:
- **Dashboard** — my pending items, low-stock alerts, quick PR.
- **Purchase Requests** — list/filter by status; create (multi-line items, currency picker showing locked rate + live USD total); detail with approve/reject (manager/admin).
- **Purchase Orders** — create from approved PR (online) or skip-to-pay (physical); record payment (finance) with receipt upload; payment status.
- **Inventory** — catalog (stock, reorder point), claims (submit partial / confirm), stock movements ledger.
- **Stock Requests** — submit / fulfil; shows resulting movement.
- **Accounting** (manager/finance/admin) — journal entries, manual income entry, chart of accounts, exchange-rate admin (override + daily list).
- **Reports** — see §9.
- **Admin** — user & role management, departments, projects.

Server Actions for mutations; Route Handlers for Telegram webhook, R2 presign, initData auth, cron (rate refresh).

---

## 9. Reports (accounting module)

Each filterable by date range; export CSV.
- **P&L** — income vs expense by month.
- **Cash Flow** — money in vs out over time.
- **Expense by Department** / **Expense by Category**.
- **Budget vs Actual** — needs a `budgets` table (`department_id`/`project_id`/`category`, `period`, `amount_usd`); compare to actual journal lines.
- **Transaction History** — all journal lines, filterable.
- **Currency Summary** — spend by original currency, totaled in USD.
- **PO Summary** — all POs + payment/fulfilment status.
All figures in USD using the locked per-record rate (not today's rate).

---

## 10. Exchange-rate refresh

- A Vercel Cron route (`/api/cron/rates`) pulls daily USD-base rates for KHR & CNY from a free FX API, upserts into `exchange_rates`, and DMs a daily summary to Finance. Finance/Admin can manually override a day's rate. Make the FX provider a single swappable module.

---

## 11. Env vars (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_MANAGER_GROUP_CHAT_ID=
TELEGRAM_MANAGER_GROUP_TOPIC_ID=
TELEGRAM_FINANCE_GROUP_CHAT_ID=
TELEGRAM_FINANCE_GROUP_TOPIC_ID=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
FX_API_KEY=
CRON_SECRET=
```

---

## 12. Build phases (do these in order; pause for my review after each)

**Phase 0 — Scaffold.** Next.js + TS + Tailwind + shadcn, Supabase client (server/browser), folder structure, `.env.example`, GitHub repo, Vercel link, CI/preview deploys.

**Phase 1 — Schema & RLS.** All migrations: enums, tables, triggers/functions (rate→USD, claim→stock, request→stock + auto-reorder, payment→journal), seed chart of accounts, RLS policies. Seed script with sample users per role.

**Phase 2 — Auth.** Supabase email/OTP for web + Telegram `initData` validation → session bridge. `profiles` + role gating.

**Phase 3 — Procurement.** PR create (multi-currency, rate lock, USD totals) → approve/reject → PO → payment + R2 receipt → auto journal entry.

**Phase 4 — Inventory & stock.** Catalog, partial claims + confirm (stock up, PO completion), stock requests + fulfil (stock down, auto-reorder), movements ledger.

**Phase 5 — Telegram.** Webhook, notification router, approval/confirm/fulfil inline-button flows, DMs, group topics, Mini App shell.

**Phase 6 — Accounting & reports.** Manual income, exchange-rate admin, cron rate refresh, all reports + CSV export, Budget vs Actual.

**Phase 7 — Admin & polish.** User/role/department/project management, dashboards, low-stock alerts, empty/loading/error states, mobile Mini App polish.

---

## 13. Conventions

- TypeScript strict; shared Zod schemas for validation on client + server.
- Centralize money math in one `money.ts` (convert, format per currency, round to 4dp, display 2dp).
- All money in `numeric`, never JS floats; format with `Intl.NumberFormat`.
- Every mutation goes through a server action / route handler that re-checks role (defense in depth on top of RLS).
- `notify()` service abstracts Telegram so business logic never calls the Bot API directly.
- Keep secrets server-side only; never expose service role key or bot token to the client.
- Write idempotent webhook handling (Telegram retries) keyed on `update_id`.

Start with **Phase 0** and show me the repo structure + schema plan before writing Phase 1 migrations.
