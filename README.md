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
        ┌───────────────┐               ┌───────────────┐
        │   apps/web    │               │  3rd parties  │
        │  (CF Pages)   │               │  (HTTP)       │
        └───────────────┘               └───────────────┘
                │                               │
                ▼                               ▼
        ┌────────────────────────────────────────────────┐
        │       apps/api  (CF Worker, Hono)              │
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
│   ├── api/          # Cloudflare Worker (Hono) — the manager
│   └── web/          # Cloudflare Pages (Vite + React 19 + TanStack Router)
├── packages/
│   ├── client/       # OpenAPI-typed client + auth-injecting fetch
│   ├── commands/     # CQRS write side
│   ├── queries/      # CQRS read side
│   ├── domain/       # Pure domain types / zod schemas
│   ├── db/           # Drizzle schema + migrations (D1)
│   └── logger/       # Structured logger
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
pnpm db:migrate

# API on http://localhost:8830 (inspector :8833), web on http://localhost:8836
pnpm dev:api
pnpm dev:web
# or together:
pnpm dev
```

The API binds to **8830** and the web to **8836** locally — keep these stable so `apps/web/.env.development` (`VITE_API_URL=http://localhost:8830`) keeps working.

## Deploy

`ship` is the deploy verb. Cloudflare resources live in the **Pah Venture** account.

```bash
pnpm ship          # Worker + Pages
pnpm ship:api      # just the Worker
pnpm ship:web      # just the Pages site
```

Production deploy targets:

- Worker: `ripscloud-api` (route TBD — see `apps/api/wrangler.jsonc` `env.production.routes`)
- Pages project: `ripscloud-web`
- D1: `ripscloud-db`
- KV: `TOKENS` (id placeholder until provisioned)
- R2: `ripscloud-files`

## Where to look for what

| Question | Read |
|---|---|
| How do I get started? | The Local dev section above |
| What conventions do I have to follow? | [`CLAUDE.md`](./CLAUDE.md) |
| How do the auth / token flows work? | `apps/api/src/routes/tenant.ts` and `packages/client/src/middleware/auth.ts` |
| How do I add a route? | Hono pattern in `apps/api/src/routes/tenant.ts` |
| How do I add a table? | `packages/db/src/schema.ts` then `pnpm --filter @ripscloud/db generate` |
