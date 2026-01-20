# Bitrix24 integration (Gridix)

This integration consists of two Supabase Edge Functions:

- `bitrix-install`: receives Bitrix Marketplace install callback (OAuth tokens + portal info) and stores them in DB
- `bitrix-app`: serves the embed UI API + SSO + webhook handler for Bitrix → Gridix sync

## Required environment variables

### For `bitrix-install`

- `SITE_URL`: public base URL of Gridix (must be reachable from Bitrix), e.g. `https://app.gridix.io/`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`: used to secure Bitrix → Gridix webhook calls (event.bind handler URL includes this secret)

### For `bitrix-app`

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`: required for Bitrix SSO (`action=sso_create/sso_verify`) and for validating webhook calls
- `BITRIX_CLIENT_ID` + `BITRIX_CLIENT_SECRET`: required to refresh Bitrix access tokens when they expire

If `BITRIX_CLIENT_ID/SECRET` are missing, the integration may work only until the initial access token expires.

## How the flow works (high level)

1) **Install in Bitrix Marketplace** → Bitrix sends a server-to-server POST to `bitrix-install`.

2) `bitrix-install`:
- upserts a row in `bitrix_pending_installs` (`domain`, `member_id`, `access_token`, `refresh_token`, `token_expires_at`, `claim_token`)
- best-effort configures Bitrix placements:
  - `LEFT_MENU` → `/embed/bitrix/projects`
  - `CRM_DEAL_DETAIL_TAB` → `/embed/bitrix/deal-tab`
- ensures the UF field exists (`UF_GRIDIX_APARTMENT_ID`)
- optionally binds events (`OnCrmDealUpdate`, `OnCrmDealAdd`) to the webhook endpoint when `JWT_SECRET` is set

3) **Connect to Gridix account**:
- user opens `/embed/connect/bitrix24?domain=...&member_id=...`
- if not logged in, the page sends user to `/<lang>/auth?redirect=/embed/connect/bitrix24?...`
- once logged in, the page calls `bitrix-app` with `action=claim_install` to bind the installation to the user (`crm_connections`)

4) **Embed UI in Bitrix**:
- the embedded pages use `BX24.getAuth()` (domain + member_id)
- then call `bitrix-app` `action=sso_create` / `action=sso_verify` to create a Supabase session automatically

5) **Sync deal stages (optional)**:
- Bitrix events call `bitrix-app?event=deal_updated&secret=...`
- the function maps Bitrix stages to local stages via `bitrix_stage_mapping` and updates `leads.pipeline_stage_id`

