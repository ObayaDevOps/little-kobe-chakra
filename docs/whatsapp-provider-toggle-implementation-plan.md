# WhatsApp Provider Toggle Implementation Plan (Meta API + Baileys)

## Branch
- `plan/baileys-meta-toggle-admin-test`

## Confirmed Decisions
- Provider toggle scope: global.
- Toggle persistence: admin-managed setting (not env-only).
- Deployment: Vercel (serverless Next.js runtime).
- Baileys message parity: text-equivalent content is acceptable.
- Admin UI: include dedicated Baileys connection/auth status panel.
- Non-technical docs audience: support team.
- Additional requirement: support users can create/edit WhatsApp text templates from admin.
- Fallback policy: automatically fallback to Meta API when Baileys send fails.

## Objective
- Add a new Baileys-based WhatsApp sending path that reproduces the current Meta API behavior for order confirmations.
- Give admins a clear option to toggle messaging provider between:
- `meta_api` (existing official implementation, default)
- `baileys_wa` (new implementation)
- Add an admin dashboard live test workflow to confirm sending is operational.
- Add an admin template management area where support users can create/edit reusable WhatsApp text templates
  (example: `New Website Order - Action Required` body content).
- Preserve all current functionality and current API contracts while introducing this as an opt-in path.

## Current Baseline (No Changes Yet)
- Existing WhatsApp send core: `src/lib/whatsappNotification.js`
- Existing API endpoint: `src/pages/api/whatsapp/send-order-confirmation.js`
- Existing admin test page: `src/pages/admin/whatsapp-test.js`
- Existing production trigger: `src/pages/api/payments/verify.js`
- Existing health check: `src/lib/healthChecks.js`, `src/pages/api/admin/daily-health-check.js`

## Key Constraints
- Zero regression in existing Meta API flow.
- Existing endpoint contract remains valid for current callers.
- Toggle must be reversible quickly without redeploy risk.
- Admin test must verify both provider readiness and actual message send attempt.
- Security model (internal/test auth secrets) must remain intact.

## Target Architecture

### 1) Provider Abstraction Layer
- Create a provider-agnostic service entrypoint (example: `sendOrderConfirmationWhatsAppUnified`).
- Define normalized input:
- `recipientPhoneNumber`
- `orderDetails`
- `isShopkeeper`
- `provider` (optional override)
- Define normalized output:
- `provider`
- `messageId` (or provider-equivalent ID)
- `raw` provider response
- Keep payload-template mapping logic shared to avoid divergence in message content behavior.

### 2) Provider Implementations
- Meta provider:
- Reuse existing logic in `src/lib/whatsappNotification.js` with minimal extraction/refactor.
- Baileys provider:
- New module for Baileys socket/session/send logic.
- Message formatting will be text-equivalent to existing intent and variables.
- Add template rendering engine for admin-defined text templates with variable placeholders.

### 3) Provider Resolution / Toggle
- Global default from admin-managed setting (DB-backed).
- Optional per-request override in admin-only test endpoint usage.
- Priority order:
- request override (admin test/internal only)
- persisted admin setting (global)
- environment default
- fallback to `meta_api`

### 4) Health + Live Test
- Provider-specific readiness checks:
- Meta credentials + Graph API check (existing behavior)
- Baileys auth/session/socket connected state
- Admin test UI enhancements:
- Select provider (`meta_api` / `baileys_wa` / `auto`)
- Run readiness check
- Send test message and display normalized result + raw response
- Display Baileys auth/session status panel (connected/disconnected, last auth/update time).

## Detailed Implementation Phases

## Phase 0: Safety and Scaffolding
- Add constants/types file for provider IDs and validation.
- Add feature flag defaults:
- `WHATSAPP_PROVIDER_DEFAULT=meta_api`
- `WHATSAPP_BAILEYS_ENABLED=false`
- Preserve old code path as untouched fallback until final cutover.

## Phase 1: Extract Existing Meta Flow Behind Interface
- Keep `buildOrderConfirmationPayload` and data normalization behavior unchanged.
- Wrap existing sender in a provider interface adapter:
- `sendViaMetaApi(input): ProviderResult`
- Maintain existing error semantics for current callers.

## Phase 2: Add Baileys Sender Adapter
- Add dependency and sender module:
- `@whiskeysockets/baileys` plus required helper deps if needed.
- Implement:
- session/bootstrap
- reconnect strategy
- send text-equivalent content rendered from admin-managed templates
- normalized response conversion
- Ensure input validation and E.164 handling match current expectations.
- Add robust error taxonomy:
- `CONFIG_ERROR`
- `AUTH_ERROR`
- `SESSION_ERROR`
- `SEND_ERROR`
- `TIMEOUT_ERROR`

## Phase 3: Introduce Unified Dispatcher
- New module (example): `src/lib/whatsapp/providers/index.js`
- `sendOrderConfirmation({ ...input, provider })`:
- resolve provider
- call provider adapter
- return normalized result
- On `auto`, route to default provider.
- Guarded fallback policy:
- If selected provider is `baileys_wa` and send fails, retry once via `meta_api` and return fallback metadata in response/logs.
- Never fallback from `meta_api` to `baileys_wa` unless explicitly enabled in future.

## Phase 4: API Layer Integration (No Contract Break)
- Update `src/pages/api/whatsapp/send-order-confirmation.js`:
- keep existing request/response schema
- support optional provider override query/body for authorized test requests
- include `provider` in response payload
- Update `src/pages/api/payments/verify.js`:
- replace direct Meta call with unified dispatcher
- default stays `meta_api` unless toggle says otherwise
- keep current notification sequencing unchanged

## Phase 5: Admin Dashboard Toggle + Live Test
- Extend `src/pages/admin/whatsapp-test.js`:
- add provider selector
- add readiness status panel
- add "Send Test Message" using selected provider
- show provider used, send status, message ID, and raw result
- Add Baileys auth/session status box (state, last successful handshake, errors).
- Add admin settings endpoint/page for persisted global toggle:
- store active provider in DB/settings table
- guard with existing admin auth model

## Phase 5.1: Admin Template Management (Support-Facing)
- Add new admin page (example): `src/pages/admin/whatsapp-templates.js`
- Features:
- create template
- edit template
- activate/deactivate template
- preview rendered template with sample data
- test-send selected template to a number
- Suggested DB schema (Supabase):
- `whatsapp_templates`:
- `id`, `name`, `slug`, `provider_scope` (`meta_api|baileys_wa|all`), `body_text`, `variables_json`, `is_active`, `created_at`, `updated_at`
- `whatsapp_template_versions` (optional audit history)
- Validation:
- safe placeholder syntax (example `{{customerName}}`)
- length checks
- required variable checks before send
- Initial seeded template:
- `New Website Order - Action Required` with your provided message format.

## Phase 6: Health Checks
- Extend `checkWhatsAppHealth` into provider-aware checks:
- `checkWhatsAppHealth({ provider })`
- For `auto`, return both provider checks + active provider summary.
- Update daily health endpoint payload to include:
- active provider
- per-provider health
- last successful send metadata (if available)

## Phase 7: Testing Strategy
- Unit tests:
- payload mapping parity (Meta baseline vs unified dispatcher input)
- provider resolver logic and authorization guards
- Integration tests:
- API endpoint test mode for both providers
- Admin test endpoint/provider override behavior
- Failure-path tests:
- bad config, disconnected Baileys session, invalid recipient
- Manual UAT:
- send to test customer and shopkeeper numbers on both providers
- verify output parity and error surfacing

## Phase 8: Rollout and Reversibility
- Release with `meta_api` default.
- Enable Baileys in staging/admin test only.
- Validate live-test pass criteria.
- Enable production toggle only after repeated successful sends.
- Keep instant rollback path:
- set provider default back to `meta_api`
- disable `WHATSAPP_BAILEYS_ENABLED`

## Data and Config Plan
- Add env variables (proposed):
- `WHATSAPP_BAILEYS_ENABLED=true|false`
- `WHATSAPP_PROVIDER_ALLOW_FALLBACK=true|false`
- `WHATSAPP_BAILEYS_AUTH_STATE_PATH=...` (if filesystem-backed)
- `WHATSAPP_BAILEYS_PHONE_NUMBER=...` (if needed for mapping/identity)
- Keep env default as emergency bootstrap only if DB setting is missing.
- Keep existing Meta env vars unchanged and mandatory when `meta_api` active.
- Add DB-backed settings and template tables for admin-managed operation.

## Security Plan
- Provider override only for authorized internal/test/admin requests.
- Never expose secrets or raw auth blobs in admin UI responses.
- Maintain existing test-mode secret checks.
- Log provider, status, and correlation IDs; redact PII where possible.

## Non-Technical Documentation Plan (Markdown Deliverable)
- Create `docs/whatsapp-operations-guide.md` for support team users.
- Required sections:
- What the two providers are (`Meta API` vs `BaileysWA`) in plain language
- When to use each option
- How to switch provider in admin dashboard
- How to run "Live Test" and interpret success/failure
- How to create a new text template in admin and safely test it
- Common errors and what action to take
- Rollback steps (switch back to Meta)
- Escalation checklist (what info to share with engineering)
- Include screenshots and a one-page quick checklist at top.

## Acceptance Criteria
- Existing send endpoint works exactly as before when toggle is `meta_api`.
- Provider can be switched without code changes.
- Admin can run readiness + send test and see definitive result.
- Payment verification flow sends through selected provider with no behavior regression.
- Non-technical operations guide exists and is actionable.

## Risks and Mitigations
- Baileys runtime persistence risk in serverless environments:
- Mitigation with your chosen constraint (no separate service): keep Meta as default, treat Baileys as best-effort mode, persist auth state externally, and surface clear admin connectivity status before sends.
- Residual risk accepted: connection reliability and cold-start latency can still cause intermittent Baileys send failures on Vercel.
- Mitigation with approved fallback: automatic retry via Meta API reduces delivery failure risk when Baileys is unstable.
- Behavior mismatch risk (Meta templates vs Baileys message formats):
- Mitigation: explicit content parity matrix and approval before production toggle.
- Session/auth fragility for Baileys:
- Mitigation: health check + admin re-auth workflow + fallback to Meta.

## Questions Needing Confirmation
- None.
