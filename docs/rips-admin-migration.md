# RIPS Admin Migration

This repository now hosts the Cloudflare migration target for the legacy project at:

```
/Users/carlos/source/pahventure/pahventure-rips-admin
```

The source project is a .NET 9 API with FastEndpoints, ASP.NET Identity, EF Core/PostgreSQL, Hangfire, and a React 19 client. The Cloudflare target in `ripscloud` keeps the current stack: Cloudflare Workers for API, Cloudflare Pages for web, D1 for global metadata, and SQLite-backed Durable Objects for tenant-local RIPS Admin data.

## Migration Shape

The legacy system has one PostgreSQL database containing both global control data and tenant business data. In the Cloudflare shape, that becomes two storage planes:

| Legacy area | Cloudflare target |
| --- | --- |
| Users, workspaces, tenant registry, refresh tokens | Global D1 tables in `packages/ripscloud-db` |
| Clients, patients, specialists, services, resolutions, invoice drafts, credit notes, dispatch attempts | One SQLite-backed `TenantDO` instance per tenant |
| SISPRO credentials and cached token | Existing per-tenant `TenantDO` storage |
| React app served by ASP.NET | `apps/ripscloud-web` on Cloudflare Pages |
| FastEndpoints API | `apps/ripscloud-api` Worker routes |
| Hangfire/PostgreSQL jobs | Replaced by synchronous Worker flows for provider dispatch, RIPS dispatch, retry/correction, and email resend |

## Implemented Worker Surfaces

Canonical migration API:

| Route | Purpose |
| --- | --- |
| `GET /api/rips-admin/tenants` | List global tenant registry |
| `POST /api/rips-admin/tenants` | Create a tenant in D1 and initialize its Durable Object metadata |
| `GET /api/rips-admin/tenants/{tenantId}` | Read tenant registry record by id or slug |
| `PUT /api/rips-admin/tenants/{tenantId}` | Update global tenant profile |
| `GET /api/rips-admin/tenants/{tenantId}/summary` | Read per-tenant DO SQLite collection counts |
| `GET /api/rips-admin/tenants/{tenantId}/users` | List global D1 users attached to a tenant |
| `POST /api/rips-admin/tenants/{tenantId}/users` | Create/attach a user to a tenant with a workspace role |
| `POST /api/rips-admin/migration/global` | Guarded migration endpoint for idempotent tenant, user, and membership upserts |
| `GET/POST /api/rips-admin/tenants/{tenantId}/{collection}` | Generic collection list/create |
| `GET/PUT/DELETE /api/rips-admin/tenants/{tenantId}/{collection}/{id}` | Generic collection item CRUD |
| `POST /api/rips-admin/tenants/{tenantId}/bulk-upsert/{collection}` | Bulk upsert endpoint used by the migration script |

Legacy-compatible auth:

| Route | Cloudflare behavior |
| --- | --- |
| `POST /api/auth/register` | Creates a D1 user with PBKDF2 password hash and returns access + refresh tokens |
| `POST /api/auth/login` | Validates new PBKDF2 hashes and migrated ASP.NET Identity hashes, then returns a legacy-compatible auth DTO |
| `POST /api/auth/refresh` | Rotates refresh token and returns a new access token |
| `POST /api/auth/logout` | Revokes the submitted refresh token |
| `GET /api/auth/user` | Resolves the Bearer token and returns the current user plus workspace claims |
| `POST /api/auth/google` | Verifies a Google ID token, links it to an existing D1 user by email, and returns the legacy-compatible auth DTO |
| `GET /api/config/frontend` | Returns same-origin API URL plus optional `RIPS_ADMIN_GOOGLE_CLIENT_ID` |

Legacy-compatible aliases:

| Legacy route shape | Cloudflare behavior |
| --- | --- |
| `/api/workspaces` | Maps to the global D1 tenant registry |
| `/api/workspaces/user` | Returns active tenant workspace claims |
| `/api/workspaces/{workspaceId}` | Reads a tenant registry record |
| `/api/workspaces/{workspaceId}/company` | Reads/updates tenant company profile |
| `/api/workspaces/{workspaceId}/environment` | Reads/updates tenant environment |
| `/api/workspaces/{workspaceId}/users` | Lists/adds users attached to the tenant |
| `/api/workspaces/{workspaceId}/dashboard/summary` | Reads tenant metadata plus DO collection counts |
| `/api/workspaces/{workspaceId}/invoice/wizard/context` | Returns clients, locations, resolutions, and services from the tenant DO |
| `/api/workspaces/{workspaceId}/invoice/settings` | Reads/updates the tenant invoice API token and provider in global D1 |
| `/api/workspaces/{workspaceId}/sispro/settings` | Reads masked SISPRO credential state from the tenant DO |
| `/api/workspaces/{workspaceId}/sispro/login` | Stores SISPRO credentials in the tenant DO |
| `/api/workspaces/{workspaceId}/clients` | Maps to DO `clients` |
| `/api/workspaces/{workspaceId}/patients` | Maps to DO `patients` |
| `/api/workspaces/{workspaceId}/specialists` | Maps to DO `specialists` |
| `/api/workspaces/{workspaceId}/services` | Maps to DO `services` |
| `/api/workspaces/{workspaceId}/resolutions` | Maps to DO `resolutions` |
| `/api/workspaces/{workspaceId}/credit-note-resolutions` | Maps to DO `credit-note-resolutions` |
| `/api/workspaces/{workspaceId}/invoice/documents` | Maps to DO `invoice-drafts` |
| `/api/workspaces/{workspaceId}/credit-notes` | Maps to DO `credit-note-drafts` |
| `/api/workspaces/{workspaceId}/invoice/drafts/{draftId}/rips` | Updates the stored RIPS payload and immediately re-submits the failed invoice to SISPRO/FEV-RIPS |
| `/api/workspaces/{workspaceId}/invoice/drafts/{draftId}/rips/xml/refresh` | Refreshes `xmlFevFile` from the latest successful provider attached document and can immediately re-submit to SISPRO/FEV-RIPS |
| `/api/workspaces/{workspaceId}/invoice/documents/{draftId}/download/{pdf,xml,attached}` | Resolves the latest successful provider dispatch attempt and streams the provider artifact |
| `/api/workspaces/{workspaceId}/invoice/documents/{draftId}/resend` | Rebuilds the legacy PDF/XML ZIP package and sends it by SMTP |
| `/api/workspaces/{workspaceId}/invoice/documents/{draftId}/retry` | Synchronously retries the configured provider dispatch and records the attempt |
| `/api/workspaces/{workspaceId}/invoice/documents/{draftId}/full-annul` | Creates a queued credit-note draft from the source invoice |
| `/api/workspaces/{workspaceId}/invoice/documents/{draftId}/export/{format}` | Exports the stored invoice/RIPS payload package as JSON during transition |
| `/api/workspaces/{workspaceId}/invoices/{invoiceId}/credit-note-context` | Builds credit-note wizard context from the tenant DO |
| `/api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/download/{pdf,xml,attached}` | Resolves the latest successful provider dispatch attempt and streams the provider artifact |
| `/api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/resend` | Rebuilds the legacy XML/PDF ZIP package and sends it by SMTP |
| `/api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/retry` | Synchronously retries the configured provider dispatch and records the attempt |
| `/api/workspaces/{workspaceId}/reports/{sales,client-statement,rips-dispatch,resolution-usage}` | Computes legacy-shaped reports from tenant DO data |
| `/api/workspaces/{workspaceId}/reports/{...}/csv` | Exports report rows as CSV |
| `/api/workspaces/{workspaceId}/patients/csv-template` | Returns the patient CSV import template |
| `/api/workspaces/{workspaceId}/patients/xlsx-template` | Returns a real XLSX patient import template generated in the Worker |
| `/api/workspaces/{workspaceId}/patients/convert-xlsx-to-csv` | Converts the first worksheet of an uploaded XLSX file to CSV |

Provider document availability is derived from migrated `dispatch-attempts` rows. For invoices, the Worker reads `urlinvoicepdf`, `urlinvoicexml`, and `urlinvoiceattached`; Ledger invoice PDFs also fall back to `urlinvoicexml + "/pdf"` like the legacy resolver. For credit notes, it reads `urlcreditnotepdf`, `urlcreditnotexml`, and `urlcreditnoteattached`, with Ledger credit-note PDFs still marked unsupported to match the legacy behavior.

Invoice and credit-note list aliases preserve the legacy query contract for filtering, sorting, and paging. The compatibility layer applies `page`, `pageSize`, `sortBy`, `sortDirection`, invoice/credit-note number, client name, status, submitted-by, date, and total range filters over tenant DO rows before returning `items`, `page`, `pageSize`, and `totalCount`. Credit-note rows also resolve `originalInvoiceNumber` and `originalInvoiceCufe` from the parent invoice row when migrated data contains the relationship.

Creating invoice and credit-note drafts now stores the draft in the tenant DO, attempts live Monaros or Ledger/DIAN-orchestrator provider dispatch when a tenant token is configured, records a provider `dispatch-attempts` row, prepares the XML-backed `FevRipsApiLocalDTO`, and synchronously submits Health documents to SISPRO/FEV-RIPS through the tenant DO credential/token store. RIPS results are recorded as separate `RipsMinistry` dispatch attempts; accepted invoice CUVs are persisted on the invoice draft, and credit-note RIPS acceptance is reported from the attempt history. When SMTP is configured, accepted documents also send the legacy ZIP email package and record an `Email`/`SMTP` dispatch attempt. Migrated Ledger attempts and artifact downloads remain readable through the same document endpoints.

The compatibility layer keeps CRUD, password and Google auth, reports, CSV/XLSX import helpers, Monaros/Ledger provider dispatch, SISPRO/RIPS dispatch, SMTP email resend, provider document availability/downloads from migrated attempts, retry state changes, and draft creation available without the .NET runtime. Unknown paths now return a normal `route_not_found` response; the generated migrated web app only calls the legacy-compatible routes listed above.

Auth uses `RIPS_ADMIN_JWT_SECRET` for deployed Workers. Store it with `wrangler secret put RIPS_ADMIN_JWT_SECRET`; local debug mode has a deterministic fallback so development smoke tests can run without committing a secret.

The migration endpoint is only open automatically when `LOG_LEVEL=debug` for local development. For deployed Workers, set `RIPS_ADMIN_MIGRATION_SECRET` as a secret and pass the same value to the migration CLI with `--migration-secret`.

Provider artifact download endpoints are configured through non-secret URL vars in `wrangler.jsonc`:

- `RIPS_ADMIN_MONAROS_BASE_URL`
- `RIPS_ADMIN_LEDGER_PRODUCTION_URL`
- `RIPS_ADMIN_LEDGER_HABILITACION_URL`
- `RIPS_ADMIN_LEDGER_REPORTING_PRODUCTION_URL`
- `RIPS_ADMIN_LEDGER_REPORTING_HABILITACION_URL`

When Ledger requires the orchestrator `X-API-Key`, store it as `RIPS_ADMIN_LEDGER_API_KEY` with `wrangler secret put`; do not commit it.

Ledger live dispatch posts the mapped DIAN-orchestrator payload to `RIPS_ADMIN_LEDGER_PRODUCTION_URL` or `RIPS_ADMIN_LEDGER_HABILITACION_URL` based on tenant environment, then polls the bridge process using `RIPS_ADMIN_LEDGER_MAX_POLL_ATTEMPTS` and `RIPS_ADMIN_LEDGER_POLL_INTERVAL_MS`. For Ledger tenants, `invoiceApiToken` stores the tenant NIT expected by the orchestrator. Optional habilitacion `testSetId` comes from `RIPS_ADMIN_LEDGER_HABILITACION_TEST_SET_ID`.

SMTP resend uses the non-secret defaults in `wrangler.jsonc` for `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM_ADDRESS`. Store `SMTP_USERNAME` and `SMTP_PASSWORD` as secrets. Set `SEND_EMAIL=false` to disable email dispatch even when credentials are present. Invoice resend requires CUFE, client email, PDF, and attached/signed XML; credit-note resend requires CUDE, client email, and XML, with PDF attached when available. The generated ZIP keeps the legacy 2 MB limit.

## Per-Tenant Durable Object Collections

Each tenant Durable Object initializes these SQLite tables:

- `rips_admin_metadata`
- `rips_admin_locations`
- `rips_admin_clients`
- `rips_admin_patients`
- `rips_admin_specialists`
- `rips_admin_services`
- `rips_admin_invoice_resolutions`
- `rips_admin_credit_note_resolutions`
- `rips_admin_invoice_drafts`
- `rips_admin_credit_note_drafts`
- `rips_admin_dispatch_attempts`

## Migration Script

The local migration script reads the legacy PostgreSQL database and writes to the Worker API. It is dry-run by default:

```bash
pnpm migrate:rips-admin --source-url "$RIPS_ADMIN_LEGACY_DATABASE_URL"
```

To write to the local Worker, first run the local API and local D1 migrations, then add `--apply`:

```bash
pnpm db:migrate:ripscloud-api
pnpm dev:ripscloud-api
pnpm migrate:rips-admin --source-url "$RIPS_ADMIN_LEGACY_DATABASE_URL" --apply
```

Safety gates:

- `--apply` is required for any writes.
- Non-local targets require `--allow-remote`.
- Deployed targets should set `RIPS_ADMIN_MIGRATION_SECRET` and pass `--migration-secret`.
- `--tenant <id-or-nit>` can be repeated to migrate a subset.
- `--skip-dispatch-attempts` skips historical provider/SISPRO attempt rows.

The script:

1. Read each legacy tenant from PostgreSQL.
2. Upsert global D1 tenants, users, and user-tenant memberships through `POST /api/rips-admin/migration/global`.
3. Store SISPRO document/password credentials in the tenant DO when they exist in the source.
4. Push tenant-local rows through `POST /api/rips-admin/tenants/{tenantId}/bulk-upsert/{collection}`.
5. Verify `GET /api/rips-admin/tenants/{tenantId}/summary` counts after each tenant is written.
6. Preserve legacy ASP.NET Identity password hashes so users can continue to log in while new registrations use the Cloudflare PBKDF2 format.

For `dispatch-attempts`, preserve `documentType`, `documentId`, `channel`, `provider`, `attemptedAtUtc`, `succeeded`, `requestPayload`, `responsePayload`, and `errorMessage`. The compatibility layer uses `documentId` plus provider/RIPS channel markers to split invoice-provider history from RIPS/SISPRO history and to locate downloadable provider artifacts.

Production resources are provisioned in the Pah Venture Cloudflare account:

- D1: `ripscloud-db` (`d0556ebf-00eb-4ab4-8375-91469da698e6`)
- KV: `ripscloud-tokens` (`3aabc5d0381f4d0f8e80d8c30ec2403f`)
- R2: `ripscloud-files`
- Worker: `ripscloud-api` (`https://ripscloud-api.pahventure.workers.dev`)
- Pages: `ripscloud-web` (`https://ripscloud-web.pages.dev/`)

`api.ripscloud.com` is the intended custom API domain, but the `ripscloud.com` zone is not onboarded in the Pah Venture Cloudflare account as of 2026-05-10. The Worker deploy therefore uses the Workers.dev fallback until DNS is available.

For production data migration, run the Worker D1 migrations remotely, set the required Worker secrets, deploy the API, and then run:

```bash
pnpm migrate:rips-admin \
  --source-url "$RIPS_ADMIN_LEGACY_DATABASE_URL" \
  --target-url "https://ripscloud-api.pahventure.workers.dev" \
  --migration-secret "$RIPS_ADMIN_MIGRATION_SECRET" \
  --allow-remote \
  --apply
```

The script is idempotent and verifies per-tenant collection counts after each tenant.
