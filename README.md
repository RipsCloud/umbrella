# Rips Cloud

A multi-tenant manager over the Colombian Ministry FEV RIPS / SISPRO upstream. Single pnpm + Turborepo workspace. Cloudflare Workers (API) + Cloudflare Pages (web).

## Architecture at a glance

```
                ┌──────────────────────────────┐
                │        Browsers / scripts    │
                └──────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        ┌────────────────────┐          ┌───────────────┐
        │ apps/ripscloud-web │          │  3rd parties  │
        │     (CF Pages)     │          │  (HTTP)       │
        └────────────────────┘          └───────────────┘
                │                               │
                ▼                               ▼
        ┌────────────────────────────────────────────────┐
        │      apps/ripscloud-api (CF Worker, Hono)      │
        │  - login intercept (LoginSISPRO + LoginERP)    │
        │  - token cached per tenant in Durable Object   │
        │  - all other /:tenant/api/* proxied with auto  │
        │    Authorization: Bearer <token>               │
        └────────────────────────────────────────────────┘
              │           │              │
              ▼           ▼              ▼
          ┌──────┐  ┌──────────┐   ┌──────────┐
          │  D1  │  │    KV    │   │ Durable  │
          │      │  │ (TOKENS) │   │  Object  │
          └──────┘  └──────────┘   └──────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  FEV RIPS / SISPRO API   │
                              │     (Colombian Min.)     │
                              └──────────────────────────┘
```

The API never talks to the upstream from the browser — every call is mediated by the worker, which keeps SISPRO credentials and the JWT in a per-tenant Durable Object (one DO instance per `tenantKey`).

## RIPS Admin migration

The legacy RIPS Admin project from `/Users/carlos/source/pahventure/pahventure-rips-admin` is being migrated into this workspace without carrying over the .NET runtime. The Cloudflare target uses the same two-plane storage model as Rips Cloud: global D1 tables control tenants/users/workspaces, and each tenant has an isolated SQLite-backed `TenantDO` for RIPS Admin operational data. Legacy-compatible auth, workspace CRUD, invoice/credit-note draft storage, reports, CSV/XLSX import helpers, Monaros and Ledger provider dispatch, SISPRO/RIPS submission through the DO credential/token store, SMTP resend for legacy ZIP email packages, retry/correction endpoints, provider document downloads from migrated dispatch attempts, and a dry-run-first PostgreSQL migration script now live in the Worker/workspace. See [`docs/rips-admin-migration.md`](./docs/rips-admin-migration.md) for the full route map, per-tenant collections, and migration command.

## Workspace shape

```
ripscloud/
├── apps/
│   ├── ripscloud-api/      # Cloudflare Worker (Hono) — the manager
│   └── ripscloud-web/      # Cloudflare Pages (Vite + React 19 + React Router)
├── packages/
│   ├── ripscloud-client/   # OpenAPI-typed client + auth-injecting fetch
│   ├── ripscloud-commands/ # CQRS write side
│   ├── ripscloud-queries/  # CQRS read side
│   ├── ripscloud-domain/   # Pure domain types / zod schemas
│   ├── ripscloud-db/       # Drizzle schema + migrations (D1)
│   └── ripscloud-logger/   # Structured logger
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Local dev

```bash
# Install everything
pnpm install

# Migrate the local D1 schema (miniflare-backed)
pnpm db:migrate:ripscloud-api

# API on http://localhost:8830 (inspector :8833), web on http://localhost:8836
pnpm dev:ripscloud-api
pnpm dev:ripscloud-web
# or together:
pnpm dev:ripscloud
```

Rips Cloud owns the isolated local port segment **8830–8839**. Within that block the API binds to **8830**, the Worker inspector to **8833**, and the web app to **8836**. Keep these stable so `apps/ripscloud-web/.env.development` (`VITE_API_URL=http://localhost:8830`) keeps working and so the MatrixMD monorepo can keep this block reserved for Rips Cloud.

## Deploy

`ship` is the deploy verb. Cloudflare resources live in the **Pah Venture** account.

```bash
pnpm ship:ripscloud          # Worker + Pages
pnpm ship:ripscloud-api      # just the Worker
pnpm ship:ripscloud-web      # just the Pages site
```

Production deploy targets:

- Worker: `ripscloud-api` (`https://ripscloud-api.pahventure.workers.dev`; intended custom domain `https://api.ripscloud.com` once the zone is onboarded)
- Pages project: `ripscloud-web` (`https://ripscloud-web.pages.dev`, latest deployment `https://62724d9c.ripscloud-web.pages.dev`, production app origin `https://app.ripscloud.com`)
- D1: `ripscloud-db`
- KV: `ripscloud-tokens` bound as `TOKENS`
- R2: `ripscloud-files`

## Where to look for what

| Question | Read |
|---|---|
| How do I get started? | The Local dev section above |
| What conventions do I have to follow? | [`CLAUDE.md`](./CLAUDE.md) |
| How do the auth / token flows work? | `apps/ripscloud-api/src/routes/tenant.ts` and `packages/ripscloud-client/src/middleware/auth.ts` |
| How do I add a route? | Hono pattern in `apps/ripscloud-api/src/routes/tenant.ts` |
| How do I add a table? | `packages/ripscloud-db/src/schema.ts` then `pnpm --filter @ripscloud/ripscloud-db generate` |
| How is RIPS Admin being migrated? | [`docs/rips-admin-migration.md`](./docs/rips-admin-migration.md) |
