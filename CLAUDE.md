# Rips Cloud

Single-product pnpm + Turborepo workspace. Cloudflare Workers (`apps/ripscloud-api`) + Cloudflare Pages (`apps/ripscloud-web`) + a few shared packages. The product is a multi-tenant manager that sits in front of the Colombian Ministry FEV RIPS / SISPRO upstream — clients log in once via the manager's intercept, the manager caches the JWT in a per-tenant Durable Object, and every subsequent call is auto-authenticated and refreshed on 401.

A high-level overview lives in [`README.md`](./README.md). This file is the contributor handbook.

## Workspace shape

```
ripscloud/
├── apps/
│   ├── ripscloud-api/    # Cloudflare Worker (Hono + zod-openapi)
│   └── ripscloud-web/    # Cloudflare Pages (Vite + React 19 + React Router)
├── packages/
│   ├── ripscloud-client/   # OpenAPI-typed client + auth-injecting fetch (zero workspace deps)
│   ├── ripscloud-domain/   # Pure domain types + zod schemas
│   ├── ripscloud-commands/ # CQRS write side
│   ├── ripscloud-queries/  # CQRS read side
│   ├── ripscloud-db/       # Drizzle schema + migrations (D1)
│   └── ripscloud-logger/   # Structured logger
├── package.json          # name: "ripscloud", pnpm@10.33.4, turbo 2.9.9, typescript 6.0.3
├── pnpm-workspace.yaml   # workspaces + catalog (single source of truth for shared dep versions)
├── turbo.json            # task pipeline
└── tsconfig.base.json
```

Rips Cloud follows the same module-slug convention as the MatrixMD monorepo. Apps publish under `@ripscloud/<module>-<surface>` (`@ripscloud/ripscloud-api`, `@ripscloud/ripscloud-web`) and their folder names match the unscoped package name. Module-owned packages publish under `@ripscloud/<module>-<thing>` (`@ripscloud/ripscloud-client`, `@ripscloud/ripscloud-db`, etc.). Internal deps are always `"workspace:*"`.

## Versioning policy

- Latest stable of every dependency unless a specific older pin is required (document the why next to the pin).
- Tooling versions are **exact-pinned** in the workspace catalog (`turbo`, `typescript`, `wrangler`) and referenced from `package.json` with `catalog:` — no carets/tildes — so every contributor uses the same toolchain.
- Inside apps and packages, third-party deps may use `^`. Workspace deps stay `workspace:*`. Anything shared by 2+ packages goes through the catalog.

### Catalog

`pnpm-workspace.yaml` declares one catalog. Reference it with `"<dep>": "catalog:"` in any `package.json`; bump the version once in the workspace file and every package picks it up on the next install.

## Local dev

```bash
pnpm install
pnpm db:migrate:ripscloud-api  # local D1 (miniflare) — applies all packages/ripscloud-db/drizzle migrations
pnpm dev:ripscloud             # api + web together
pnpm dev:ripscloud-api         # just the worker — http://localhost:8830 (inspector :8833)
pnpm dev:ripscloud-web         # just the web   — http://localhost:8836
```

Rips Cloud owns the isolated local port segment **8830–8839**. The API binds **8830/8833** and the web binds **8836** (strict ports, configured in `apps/ripscloud-api/wrangler.jsonc` and `apps/ripscloud-web/vite.config.ts`). Don't put port numbers in `package.json` scripts — keep them in the per-app config so `pnpm dev:*` stays portable. The MatrixMD monorepo keeps this same block reserved to avoid localhost collisions.

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
| `apps/ripscloud-api` (Worker) | `wrangler deploy --env production` |
| `apps/ripscloud-web` (Pages)  | `pnpm run build && wrangler pages deploy dist --project-name ripscloud-web --branch main` |

Root shortcuts:

```
pnpm ship:ripscloud-api    # just the worker
pnpm ship:ripscloud-web    # just the pages site
pnpm ship:ripscloud        # both
```

Don't hardcode `wrangler deploy …` calls anywhere else — go through `pnpm ship:*` so the project name, branch, and build step stay in one place.

## Cloudflare convention

- `apps/ripscloud-api` is a Worker. Its `wrangler.jsonc` declares `name = "ripscloud-api"` and binds `DB` (D1 `ripscloud-db`), `FILES` (R2 `ripscloud-files`), `TOKENS` (KV `ripscloud-tokens`), and `TENANT` (Durable Object class `TenantDO`, SQLite-backed).
- `apps/ripscloud-web` is a Cloudflare Pages project (`ripscloud-web`).
- Account: **Pah Venture** (`c318b2a1f2703c2869296fc0fed58362`). All ripscloud Workers, Pages, D1, KV, R2 live there.
- Long-lived secrets (R2 dev tokens, the GitHub Actions super-admin token) are managed via the `pahventure-ops` skill. Don't roll your own `wrangler login` flow.

### Production resources

The production Cloudflare resources are provisioned in the Pah Venture account:

- D1 `ripscloud-db` (`d0556ebf-00eb-4ab4-8375-91469da698e6`)
- KV `ripscloud-tokens` (`3aabc5d0381f4d0f8e80d8c30ec2403f`)
- R2 `ripscloud-files`
- Pages `ripscloud-web`
- Worker production URL `https://ripscloud-api.pahventure.workers.dev`
- Intended Worker custom domain route `api.ripscloud.com` once the `ripscloud.com` zone is onboarded

## Stack

- **API** — Cloudflare Workers + Hono + `@hono/zod-openapi` + Swagger/Scalar UI
- **Web** — Vite + React 19 + React Router, migrated from the legacy RIPS Admin client
- **Versioning** — `/api/v1/<...>` prefix (TBD on this repo — current routes are `/{tenant}/api/...` mirroring the upstream)
- **DB** — Cloudflare D1 + Drizzle ORM (`packages/ripscloud-db`)
- **Auth to upstream** — `@ripscloud/ripscloud-client` ships an `openapi-fetch` middleware that auto-logs into SISPRO, caches the token in a pluggable `TokenStore` (KV + memory shipped in-package), deduplicates concurrent logins, and retries once on 401.

### Known gaps

- **OpenAPI registration**. `apps/ripscloud-api/src/index.ts` creates an `OpenAPIHono` and serves `/swagger`, but `apps/ripscloud-api/src/routes/tenant.ts` is a plain `Hono` and registers routes via `app.post()` / `app.all()`. Those don't add operations to the spec — only `app.openapi(createRoute(...), handler)` does. So `/doc` returns valid JSON with empty `paths`. To fix: switch the tenant router to `OpenAPIHono` and register each route via `createRoute({...})` with `request`/`responses` schemas in `@ripscloud/ripscloud-domain`.
- **Auto-token via DO** vs the original ticket. The MD-115 spec said "no DO-SQLite", but `apps/ripscloud-api/src/do/tenant-do.ts` is a SQLite-backed DO holding per-tenant credentials + token. Reconcile the spec or remove the DO before considering the bootstrap "done".
- **CQRS scaffold packages** (`ripscloud-commands`, `ripscloud-queries`, `ripscloud-domain`) currently hold the matrixmd-module-monorepo skill's example handlers — not real product logic. Replace before the read/write split actually carries weight.
- **Prod URL confirmation** for the upstream (`packages/ripscloud-client/src/envs.ts`) — best-guess `https://rips.matrixmdsoftware.com` is in tree pending human confirmation (RC-2 comment 3 thread).

## History

Extracted on 2026-05-07 from the `matrixmd` monorepo (`apps/fevrips-{api,web}` + `packages/fevrips-*`) into a standalone product. Linear tickets MD-114 and MD-115 became RC-2 and RC-1 in the new "Rips Cloud" team. The matrixmd-side fevrips paths and root scripts were removed in the same change.
