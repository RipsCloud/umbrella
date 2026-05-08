# Rips Cloud

Single-product pnpm + Turborepo workspace. Cloudflare Workers (`apps/api`) + Cloudflare Pages (`apps/web`) + a few shared packages. The product is a multi-tenant manager that sits in front of the Colombian Ministry FEV RIPS / SISPRO upstream — clients log in once via the manager's intercept, the manager caches the JWT in a per-tenant Durable Object, and every subsequent call is auto-authenticated and refreshed on 401.

A high-level overview lives in [`README.md`](./README.md). This file is the contributor handbook.

## Workspace shape

```
ripscloud/
├── apps/
│   ├── api/              # Cloudflare Worker (Hono + zod-openapi)
│   └── web/              # Cloudflare Pages (Vite + React 19 + TanStack Router)
├── packages/
│   ├── client/           # OpenAPI-typed client + auth-injecting fetch (zero workspace deps)
│   ├── domain/           # Pure domain types + zod schemas
│   ├── commands/         # CQRS write side
│   ├── queries/          # CQRS read side
│   ├── db/               # Drizzle schema + migrations (D1)
│   └── logger/           # Structured logger
├── package.json          # name: "ripscloud", pnpm@10.33.4, turbo 2.9.9, typescript 6.0.3
├── pnpm-workspace.yaml   # workspaces + catalog (single source of truth for shared dep versions)
├── turbo.json            # task pipeline
└── tsconfig.base.json
```

Apps publish under `@ripscloud/<surface>` (`@ripscloud/api`, `@ripscloud/web`). Packages publish under `@ripscloud/<thing>` (`@ripscloud/client`, `@ripscloud/db`, etc.). Internal deps are always `"workspace:*"`.

## Versioning policy

- Latest stable of every dependency unless a specific older pin is required (document the why next to the pin).
- Tooling in the root `package.json` is **exact-pinned** (`turbo`, `typescript`) — no carets/tildes — so every contributor uses the same toolchain.
- Inside apps and packages, third-party deps may use `^`. Workspace deps stay `workspace:*`. Anything shared by 2+ packages goes through the catalog.

### Catalog

`pnpm-workspace.yaml` declares one catalog. Reference it with `"<dep>": "catalog:"` in any `package.json`; bump the version once in the workspace file and every package picks it up on the next install.

## Local dev

```bash
pnpm install
pnpm db:migrate         # local D1 (miniflare) — applies all packages/db/drizzle migrations
pnpm dev                # api + web together
pnpm dev:api            # just the worker — http://localhost:8830 (inspector :8833)
pnpm dev:web            # just the web   — http://localhost:8836
```

The API binds **8830/8833** and the web binds **8836** (strict ports, configured in `apps/api/wrangler.jsonc` and `apps/web/vite.config.ts`). Don't put port numbers in `package.json` scripts — keep them in the per-app config so `pnpm dev:*` stays portable.

### Local-first migrations

Each D1-backed app exposes:

| Script | What |
| --- | --- |
| `db:migrate`        | Apply pending Drizzle migrations to **local** D1 (miniflare) |
| `db:migrate:remote` | Apply migrations to the production D1 (CI / deploy step) |
| `db:seed`           | Apply local-only seed file to the **local** D1 (when present) |

Seeds are local-only — never wire `db:seed` to `--remote`. Production data is the real source of truth.

## Deploy convention — `ship`

`ship` is the deploy verb. Each app exposes a single `ship` script:

| App | What `ship` does |
| --- | --- |
| `apps/api` (Worker) | `wrangler deploy --env production` |
| `apps/web` (Pages)  | `pnpm run build && wrangler pages deploy dist --project-name ripscloud-web --branch main` |

Root shortcuts:

```
pnpm ship:api    # just the worker
pnpm ship:web    # just the pages site
pnpm ship        # both
```

Don't hardcode `wrangler deploy …` calls anywhere else — go through `pnpm ship:*` so the project name, branch, and build step stay in one place.

## Cloudflare convention

- `apps/api` is a Worker. Its `wrangler.jsonc` declares `name = "ripscloud-api"` and binds `DB` (D1 `ripscloud-db`), `FILES` (R2 `ripscloud-files`), `TOKENS` (KV — id placeholder until provisioned), and `TENANT` (Durable Object class `TenantDO`, SQLite-backed).
- `apps/web` is a Cloudflare Pages project (`ripscloud-web`).
- Account: **Pah Venture** (`c318b2a1f2703c2869296fc0fed58362`). All ripscloud Workers, Pages, D1, KV, R2 live there.
- Long-lived secrets (R2 dev tokens, the GitHub Actions super-admin token) are managed via the `pahventure-ops` skill. Don't roll your own `wrangler login` flow.

### Production placeholders

Until the prod resources are provisioned and the prod domains confirmed, the following sit as `REPLACE_WITH_*` / `TODO` markers in `apps/api/wrangler.jsonc`:

- `database_id` (D1) and `id` (KV)
- `routes[].pattern` (custom domain — currently `api.ripscloud.com`, marked TODO)
- `ALLOWED_ORIGINS` in `env.production.vars` (currently `https://app.ripscloud.com`, marked TODO)

Resolve these before `pnpm ship:api` against production.

## Stack

- **API** — Cloudflare Workers + Hono + `@hono/zod-openapi` + Swagger/Scalar UI
- **Web** — Vite + React 19 + TanStack Router + TanStack Query
- **Versioning** — `/api/v1/<...>` prefix (TBD on this repo — current routes are `/{tenant}/api/...` mirroring the upstream)
- **DB** — Cloudflare D1 + Drizzle ORM (`packages/db`)
- **Auth to upstream** — `@ripscloud/client` ships an `openapi-fetch` middleware that auto-logs into SISPRO, caches the token in a pluggable `TokenStore` (KV + memory shipped in-package), deduplicates concurrent logins, and retries once on 401.

### Known gaps

- **OpenAPI registration**. `apps/api/src/index.ts` creates an `OpenAPIHono` and serves `/swagger`, but `apps/api/src/routes/tenant.ts` is a plain `Hono` and registers routes via `app.post()` / `app.all()`. Those don't add operations to the spec — only `app.openapi(createRoute(...), handler)` does. So `/doc` returns valid JSON with empty `paths`. To fix: switch the tenant router to `OpenAPIHono` and register each route via `createRoute({...})` with `request`/`responses` schemas in `@ripscloud/domain`.
- **Auto-token via DO** vs the original ticket. The MD-115 spec said "no DO-SQLite", but `apps/api/src/do/tenant-do.ts` is a SQLite-backed DO holding per-tenant credentials + token. Reconcile the spec or remove the DO before considering the bootstrap "done".
- **CQRS scaffold packages** (`commands`, `queries`, `domain`) currently hold the matrixmd-module-monorepo skill's example handlers — not real product logic. Replace before the read/write split actually carries weight.
- **Prod URL confirmation** for the upstream (`packages/client/src/envs.ts`) — best-guess `https://rips.matrixmdsoftware.com` is in tree pending human confirmation (RC-2 comment 3 thread).

## History

Extracted on 2026-05-07 from the `matrixmd` monorepo (`apps/fevrips-{api,web}` + `packages/fevrips-*`) into a standalone product. Linear tickets MD-114 and MD-115 became RC-2 and RC-1 in the new "Rips Cloud" team. The matrixmd-side fevrips paths and root scripts were removed in the same change.
