# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint (Next.js config)
npm run seed         # populate sample users (one per role) — needs .env.local

# Supabase local stack (Docker required)
supabase start
supabase db reset                              # apply all migrations + seed.sql
supabase gen types typescript --local > src/types/database.ts

# Push migrations to linked remote project
supabase db push
```

## Architecture

**Entry point:** `src/proxy.ts` — this is Next.js 16's renamed middleware. It refreshes the Supabase session and redirects unauthenticated requests to `/login`. Never rely on it alone for security.

**Route groups:**
- `src/app/(auth)/` — unauthenticated pages (login, forgot/reset password)
- `src/app/(main)/` — authenticated app shell; layout calls `requireUser()` which redirects to `/login` if no session
- `src/app/api/` — route handlers: `telegram/webhook`, `telegram/init`, `r2/presign`, `cron/rates`
- `src/app/miniapp/` — Telegram Mini App shell (auth via initData, not cookies)

**Feature slices** (`src/features/<domain>/`): each domain owns its components, Zod schemas, and server actions:
- `procurement` — purchase requests, purchase orders, payments
- `inventory` — catalog items, claims, stock movements
- `stock` — stock requests + fulfil flow
- `accounting` — manual income, exchange rates, reports
- `admin` — user/role management
- `telegram` — initData validation, session bridge

**Shared lib** (`src/lib/`):
- `supabase/{client,server,admin}.ts` — browser client, cookie-bound server client, service-role admin client
- `auth.ts` — `getUser()`, `getProfile()`, `requireUser()`, `requirePermission(permission)` — use these in every server action
- `roles.ts` — `can(role, permission)` permission matrix mirroring RLS intent
- `money.ts` — **all** currency math lives here: `toUsd()`, `round()`, `format()`, `formatUsd()`
- `telegram.ts` — `notify(event, payload)` abstraction; business logic never calls the Bot API directly
- `r2.ts` — presigned PUT/GET URL helpers for Cloudflare R2
- `rates.ts` — `getCurrentRate(supabase, currency)` — fetch the day's locked FX rate

## Key conventions

**Money:** Store as `numeric(18,4)`. Never JS floats. `exchange_rate` = units of currency per 1 USD (e.g. 7.24 CNY/USD). `amount_usd = amount_original / exchange_rate`. The Postgres trigger is authoritative; `money.ts` mirrors it for the UI.

**Server actions pattern:** Every mutation in `features/<domain>/services/actions.ts`:
1. `"use server"` at the top
2. Call `requirePermission(permission)` first — throws if insufficient role
3. Validate input with the domain's Zod schema (`.safeParse`)
4. Perform DB operations via the cookie-bound server client
5. Call `revalidatePath(...)` and return `{ ok: true } | { ok: false; error: string }`

**Auth flow:** Supabase email OTP for web. Telegram Mini App uses initData HMAC validation (`features/telegram/services/init-data.ts`) → server mints a Supabase JWT → RLS applies normally.

**Database invariants** enforced by Postgres triggers (migration `007`): amount_usd derivation, claim→stock increment + PO completion, stock request→decrement + auto-reorder, payment→journal entry creation. Do not duplicate this logic in the app layer.

**RLS + app layer:** Both enforce the same role matrix. `src/lib/roles.ts` is the single source of truth for app-layer checks.

**Supabase client selection:**
- Server Components / Actions / Route Handlers → `createClient()` from `lib/supabase/server.ts` (cookie-bound, runs as signed-in user, RLS applies)
- Admin operations bypassing RLS (e.g. minting sessions) → `lib/supabase/admin.ts`
- Client Components → `lib/supabase/client.ts`

## Build phases

Phase 0 (scaffold) and Phase 1 (schema & RLS) are complete. Remaining: 2 Auth · 3 Procurement · 4 Inventory & stock · 5 Telegram · 6 Accounting & reports · 7 Admin & polish. Full spec in `CLAUDE_CODE_BRIEF.md`.
