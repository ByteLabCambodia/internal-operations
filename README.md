# ByteLab Operations Platform

Multi-currency **procurement → inventory → accounting** platform for a small robotics/STEM
team, with a Next.js web app and a Telegram bot + Mini App. See
[`CLAUDE_CODE_BRIEF.md`](./CLAUDE_CODE_BRIEF.md) for the full specification.

## Tech stack

- **Next.js** (App Router, TypeScript strict, Server Actions + Route Handlers)
- **Supabase** — Postgres + Row-Level Security + Auth
- **Cloudflare R2** (S3-compatible) for receipt/image uploads via presigned URLs
- **grammY** — Telegram Bot API webhook + Telegram Mini App
- **Tailwind CSS + shadcn/ui**
- **Vercel** deployment (auto-deploy from `main`, preview deploys on PRs)
- Money stored as Postgres `numeric(18,4)`; base reporting currency **USD**

## Project structure

```
src/
  app/
    (auth)/login            Email magic-link / OTP sign-in (Phase 2)
    (main)/                 Authenticated app shell (sidebar + header)
      dashboard
      purchase-requests
      purchase-orders
      inventory
      stock-requests
      accounting
      reports
      admin
    api/
      telegram/webhook      grammY bot webhook (Phase 5)
      telegram/init         Mini App initData auth bridge (Phase 2/5)
      r2/presign            Presigned R2 upload URLs (Phase 3)
      cron/rates            Daily FX refresh (Phase 6)
  components/
    ui/                     shadcn/ui components
    layout/                 sidebar, header, shared page chrome
  features/<domain>/        components / services / schemas per domain
  lib/
    supabase/{client,server,admin}.ts
    money.ts                single source for currency math (convert/format/round)
    r2.ts                   Cloudflare R2 helpers
    telegram.ts             grammY bot + notify() abstraction
    roles.ts                role permission matrix (mirrors RLS intent)
supabase/migrations/        SQL migrations (Phase 1+)
```

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** — copy the example and fill in values:

   ```bash
   cp .env.example .env.local
   ```

   See `.env.example` for the full list (Supabase, Telegram, R2, FX/cron).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> — the root redirects to `/dashboard`.

## Supabase setup

The Supabase CLI scaffolding lives in `supabase/`. Migrations land starting in Phase 1.

```bash
# install the CLI once: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # apply migrations to the linked project
# regenerate DB types after schema changes:
supabase gen types typescript --local > src/types/database.ts
```

## GitHub + Vercel (manual)

This repo is initialized locally. To enable `git push` → Vercel build:

1. **Create a GitHub repo** and push:

   ```bash
   gh repo create bytelab-operations --private --source=. --remote=origin --push
   # or create it in the GitHub UI, then:
   #   git remote add origin git@github.com:<you>/<repo>.git && git push -u origin main
   ```

2. **Import into Vercel** (vercel.com → New Project → import the repo). Add all
   environment variables from `.env.example` in the Vercel project settings.
   Auto-deploys from `main` and preview deploys on PRs are enabled by default.
   The daily FX cron is configured in `vercel.json`.

## Build phases

Built incrementally; each phase is reviewed before the next. **Phase 0 (scaffold)** is
complete. Remaining: 1 Schema & RLS · 2 Auth · 3 Procurement · 4 Inventory & stock ·
5 Telegram · 6 Accounting & reports · 7 Admin & polish.
