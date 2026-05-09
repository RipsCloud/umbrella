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

## Workspace shape

```
ripscloud/
├── apps/
│   ├── ripscloud-api/      # Cloudflare Worker (Hono) — the manager
│   └── ripscloud-web/      # Cloudflare Pages (Vite + React 19 + TanStack Router)
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

The API binds to **8830** and the web to **8836** locally — keep these stable so `apps/ripscloud-web/.env.development` (`VITE_API_URL=http://localhost:8830`) keeps working.

## Deploy

`ship` is the deploy verb. Cloudflare resources live in the **Pah Venture** account.

```bash
pnpm ship:ripscloud          # Worker + Pages
pnpm ship:ripscloud-api      # just the Worker
pnpm ship:ripscloud-web      # just the Pages site
```

Production deploy targets:

- Worker: `ripscloud-api` (route TBD — see `apps/ripscloud-api/wrangler.jsonc` `env.production.routes`)
- Pages project: `ripscloud-web`
- D1: `ripscloud-db`
- KV: `TOKENS` (id placeholder until provisioned)
- R2: `ripscloud-files`

## Where to look for what

| Question | Read |
|---|---|
| How do I get started? | The Local dev section above |
| What conventions do I have to follow? | [`CLAUDE.md`](./CLAUDE.md) |
| How do the auth / token flows work? | `apps/ripscloud-api/src/routes/tenant.ts` and `packages/ripscloud-client/src/middleware/auth.ts` |
| How do I add a route? | Hono pattern in `apps/ripscloud-api/src/routes/tenant.ts` |
| How do I add a table? | `packages/ripscloud-db/src/schema.ts` then `pnpm --filter @ripscloud/ripscloud-db generate` |
