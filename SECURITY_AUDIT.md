# Security Audit — little-kobe-chakra

**Audit date:** 2026-04-27
**Branch:** `security-audit`
**Auditor:** Claude (automated, with user-authorized scope: local `next dev` only, audit-only — no fixes)
**Codebase rev at audit time:** `main` @ `a4640ec`
**Method:** Static review (code, deps, git history) + dynamic probes against `next dev` on `localhost:3456`. Probes were non-destructive; no admin writes were committed, no payments initiated. One contact-form email did fire as part of T-18 (see Caveats).

---

## TL;DR

**Current score: 18 / 100 — Grade F.**

The site has multiple critical, easy-to-exploit issues that put customer PII, payment integrity, and store inventory at risk. The most severe — and the ones to fix first — are:

1. **Every `/api/admin/*` endpoint is unauthenticated.** The Basic Auth middleware only matches `/admin` *page* routes, not `/api/admin` *API* routes. An attacker can read all sales analytics, all inventory, all orders' PII, and modify prices/stock/store-hours by curl with no credentials.
2. **Customer PII leaks via order ID (IDOR).** `GET /api/orders/{orderId}` returns full shipping address, phone, email, and totals to anyone who has a UUID. Confirmed against a real live order.
3. **Payment IPN webhook accepts forged requests.** `GET /api/webhooks/pesapal/ipn?...=FORGED` returned HTTP 200 with no signature verification. There is no callback to Pesapal to confirm authenticity.
4. **Payment amount is trusted from the client.** `/api/payments/initiate` validates the *shape* of the body but not that `amount` matches the cart's true price. Server never refetches prices from Sanity.
5. **Production secrets are committed to git.** `.env` has been in the repo since the `init` commit and contains a working SMTP password and a DPO token.
6. **Severe dependency exposure.** `npm audit --omit=dev` reports 5 critical and 14 high CVEs in production deps, including `next` (cache poisoning + image-DoS), `form-data` (critical), `protobufjs` (RCE), `axios`, `lodash`, and `nodemailer`.

The remediation roadmap at the end groups these by P0 / P1 / P2.

---

## Caveats & disclosures

- **One real email was sent** during T-18: `POST /api/nodemailer-contact` with body `{"Name":"<img src=x onerror=alert(1)>","Email":"bad@example.com","Message":"audit XSS probe"}` returned HTTP 200, which means the SMTP endpoint actually delivered to `RECIPIENT_ADDRESS` (=`obayadralega18@gmail.com`). This was the cleanest way to confirm the endpoint requires no auth and processes user-supplied HTML; the resulting email itself is the proof for the XSS-via-email finding. No other real-world side effects.
- T-13 (concurrent stock decrement) and T-14 (abandon-after-decrement) were not run because they require committing a DB-modifying action. They are flagged "static-confirmed" — the code path in `src/pages/api/checkout.js` decrements stock unconditionally before payment.
- TLS, HSTS, and the live deployment's headers were *not* tested (out of scope per user). The headers section reflects the dev-server response only.

---

## Stack

- **Framework:** Next.js **14.2.3**, Pages Router, JavaScript (no TS), React 18.
- **DB:** Supabase (Postgres). Server uses `SUPABASE_SERVICE_ROLE_KEY` for *all* queries (`src/lib/supabaseClient.js`, `src/lib/db.js`), bypassing RLS.
- **CMS:** Sanity (catalog).
- **Payments:** Pesapal v3 (initiate → hosted UI → IPN → verify).
- **Notifications:** Nodemailer (SMTP), WhatsApp Cloud API + Baileys fallback.
- **Auth:** HTTP Basic only, applied to `/admin` page routes via `src/middleware.js`. No user accounts. `next-auth` is a dependency but unused.
- **No tests, no CI, no security headers configured, no rate limiting anywhere.**

---

## Phase-2 Test Battery — results

Severity legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 pass

### A. Authentication

| ID | Test | Result | Detail |
|---|---|---|---|
| T-01a | `GET /api/admin/inventory` unauth | 🔴 FAIL | HTTP 200, full product list with stock |
| T-01b | `GET /api/admin/sales-report` unauth | 🔴 FAIL | HTTP 200, sales by product |
| T-01c | `PUT /api/admin/inventory/update` unauth (no body) | 🔴 FAIL | HTTP 400 *from validation* — handler ran without auth |
| T-01d | `GET /api/admin/store-hours` unauth | 🔴 FAIL | HTTP 200, full week's hours |
| T-01e | `GET /api/admin/whatsapp-templates` unauth | 🔴 FAIL | HTTP 500 leaked DB schema (`relation "public.whatsapp_templates" does not exist`) |
| T-01f | `GET /api/analytics/overview` unauth | 🔴 FAIL | HTTP 200, full sales trend & totals |
| T-01g | `PUT /api/admin/inventory/update` unauth, real-shape body | 🔴 FAIL | HTTP 400 *from validation* — would mutate with real ID |
| T-01h | `PATCH /api/admin/inventory/{id}` unauth | 🔴 FAIL | HTTP 500 (no row found) — handler executed without auth |
| T-01i | `PUT /api/admin/store-hours` unauth | 🔴 FAIL | HTTP 400 *from validation* — handler executed without auth |
| T-02 | `GET /admin` page unauth | 🟢 PASS | HTTP 401, Basic Auth challenge |
| T-03 | Brute-force `/admin` | 🟠 FAIL (static) | No rate limit / lockout in `src/middleware.js` |
| T-04 | `ADMIN_BASIC_*` strength | manual | not in scope to inspect |

### B. Authorization (BOLA / IDOR)

| ID | Test | Result | Detail |
|---|---|---|---|
| T-05 | `GET /api/orders/{realOrderId}` | 🔴 FAIL | Returned a real customer's email, phone, full shipping address, totals — to an unauthenticated client |
| T-05b | `GET /api/orders/{randomUUID}` | n/a | HTTP 404 — confirms only *real* IDs leak |
| T-06 | `GET /api/orders/by-ref?ref=NONEXISTENT` | 🔴 FAIL (static) | 404 here, but `src/pages/api/orders/by-ref.js` has no ownership check; valid ref → full payload |
| T-07 | `GET /api/analytics/recent-orders` | 🔴 FAIL | HTTP 200 — paginated feed of customer emails, totals, statuses |
| T-08 | Admin endpoints reject unauth | 🔴 FAIL | See T-01 series |

### C. Payment integrity

| ID | Test | Result | Detail |
|---|---|---|---|
| T-09 | `POST /api/payments/initiate` empty body | 🟠 partial | 400 (validation) — but only checks shape, not amount integrity |
| T-09c | `POST /api/payments/initiate` with `amount=1` | 🔴 FAIL (confirmed by code) | Validation gates only; `parseFloat(amount)` is trusted (`initiate.js:68`). Server never refetches prices from Sanity. With a complete body this proceeds. |
| T-10 | Tamper `items[].price` client-side | 🔴 FAIL (static) | Server stores `cart_items` verbatim into the payments row |
| T-11 | Forge IPN `GET /api/webhooks/pesapal/ipn?...=FORGED` | 🔴 FAIL | HTTP 200 — no signature/HMAC, no callback to Pesapal to verify the tracking ID before mutating state |
| T-12 | Replay IPN | 🟡 partial | Duplicate-state guard exists for terminal states only; race window via `setImmediate` |
| T-13 | Concurrent stock decrement | 🟠 FAIL (static) | `/api/checkout` decrements without row lock |
| T-14 | Abandon checkout, stock not restored | 🟠 FAIL (static) | Stock decrements pre-payment; no restoration on abandon |

### D. Input validation

| ID | Test | Result | Detail |
|---|---|---|---|
| T-15 | Malformed body to `/api/checkout` | 🟡 partial | 400 with manual `Array.isArray()` check; no schema lib |
| T-16 | GROQ injection | 🟢 PASS (static) | Catalog queries are static; no user-input interpolation |
| T-17 | Supabase filter passthrough | 🟢 PASS (static) | Filters are typed via SDK |

### E. Output encoding / XSS

| ID | Test | Result | Detail |
|---|---|---|---|
| T-18 | Contact form HTML injection | 🟠 FAIL | HTTP 200 sent. `nodemailer-contact.js:27-31` interpolates `Name` and `Message` directly into the email's HTML body. The shopkeeper's mail client renders the payload. |
| T-19 | `dangerouslySetInnerHTML` / unsafe Markdown | 🟢 PASS | None found |

### F. CSRF

| ID | Test | Result | Detail |
|---|---|---|---|
| T-21 | CSRF tokens on state-changing endpoints | 🟠 FAIL | `grep csrf\|xsrf src/` returned 0 matches. Customer-side endpoints accept any origin. (Admin Basic Auth is somewhat self-mitigating since it's not cookie-based.) |

### G. Rate limiting

| ID | Test | Result | Detail |
|---|---|---|---|
| T-22 | Spam `/api/nodemailer-contact` | 🟠 FAIL (static) | No limiter; one probe sent. Untested at volume to avoid spamming the inbox. |
| T-23 | Spam `/api/payments/initiate` | 🟠 FAIL (static) | No limiter |
| T-24 | Spam `/api/webhooks/pesapal/ipn` | 🟠 FAIL (static + dynamic) | No limiter; T-11 already showed the endpoint is open |
| T-25 | Brute-force admin Basic Auth | 🟠 FAIL (static) | No limiter |

### H. Secrets & config

| ID | Test | Result | Detail |
|---|---|---|---|
| T-26 | `.env` committed | 🔴 FAIL | `.env` is tracked since the `init` commit. Contains `SMTP_USER`, `SMTP_PASSWORD` (`qjchymspjacqlcbu`), and `DPO_COMPANY_TOKEN`. `git log -- .env` shows 7 commits touching it. Even though `.gitignore` now lists `.env`, that's ignored for already-tracked files. |
| T-27 | Full git-history secret scan | 🟡 manual | `git log -p -- .env` confirms current secrets present in history. Recommend running `gitleaks` / `trufflehog` for additional findings. |
| T-28 | `NEXT_PUBLIC_*` audit | 🟢 PASS | All inspected `NEXT_PUBLIC_*` (Sanity public ID, Supabase URL+anon key, Maps key, base URL, shopkeeper number, E2E flag) are non-secret in design — *however* the Maps key needs HTTP-referrer + API restrictions on the GCP side (untestable from code). |
| T-29 | Service-role key everywhere | 🔴 FAIL | `src/lib/supabaseClient.js` exports `getServerSupabaseClient()` keyed with `SUPABASE_SERVICE_ROLE_KEY`; `src/lib/db.js` uses it for *all* reads, including public catalog. RLS bypassed by design. |
| T-30 | RLS policies present on `orders`, `payments`, `inventory` | 🟡 manual | Cannot verify from code; must check Supabase dashboard |

### I. Dependencies (`npm audit --omit=dev`)

**59 vulnerabilities (4 low, 36 moderate, 14 high, 5 critical).**

| Severity | Package | Issue |
|---|---|---|
| 🔴 critical | `next@14.2.3` | Cache Poisoning + Image-optimization DoS |
| 🔴 critical | `form-data` | Unsafe random for boundary |
| 🔴 critical | `protobufjs` | Arbitrary code execution |
| 🔴 critical | `@whiskeysockets/baileys` (cascade) | via libsignal-node → protobufjs |
| 🔴 critical | `@whiskeysockets/libsignal-node` | via protobufjs |
| 🟠 high | `axios` | DoS via missing size check; prototype injection in `mergeConfig` |
| 🟠 high | `nodemailer` | Email-to-unintended-domain; addressparser DoS |
| 🟠 high | `lodash`, `lodash-es` | Prototype pollution + `_.template` code injection |
| 🟠 high | `glob` | Command injection via `-c/--cmd` |
| 🟠 high | `minimatch`, `picomatch` | ReDoS |
| 🟠 high | `tar`, `tar-fs` | Path traversal / symlink poisoning |
| 🟠 high | `undici` | HTTP smuggling + decompression resource exhaustion |
| 🟠 high | `valibot` | EMOJI_REGEX ReDoS |
| 🟠 high | `vite` | Dev-server file disclosure (in `sanity` toolchain only — not prod surface, but in tree) |
| 🟠 high | `preact`, `rollup` | (Sanity toolchain) |

`npm audit fix` resolves most non-breaking ones; `next` requires `npm audit fix --force` (major bump path or `next@14.2.32+` patch within 14.x).

### J. Headers / transport

| ID | Test | Result | Detail |
|---|---|---|---|
| T-33 | Security headers on `/` | 🔴 FAIL | None of CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Only `X-Powered-By: Next.js` (info disclosure). `next.config.js` has no `async headers()`. |
| T-34 | Cookie flags | n/a | No app-set cookies observed (Basic Auth is header-based) |
| T-35 | CORS | 🟢 PASS | No custom CORS; same-origin default applies |

### K. Error handling / info disclosure

| ID | Test | Result | Detail |
|---|---|---|---|
| T-36a | 500 leaks DB error to client | 🟠 FAIL | `/api/admin/inventory/{id}` PATCH returned `error: "JSON object requested, multiple (or no) rows returned"` — Supabase internal error |
| T-36b | DB schema leak | 🟠 FAIL | T-01e leaked `relation "public.whatsapp_templates" does not exist` — confirms PG error verbatim |
| T-37 | Centralized logger / Sentry | 🟠 FAIL | `console.error` only |
| T-38 | Admin audit log | 🟠 FAIL | None — no `audit_log` table or insert calls |
| T-39 | Failed-login alerting | 🟠 FAIL | None |

### L. Misc

| ID | Test | Result | Detail |
|---|---|---|---|
| T-40 | Open redirect / SSRF | 🟢 PASS | Pesapal/Sanity URLs are env-controlled; no user-supplied URL fetch |
| T-41 | Google Maps key restrictions | 🟡 manual | Verify in GCP console (HTTP-referrer + API restriction) |
| T-42 | `WHATSAPP_TEST_SECRET` strength | 🟡 manual | Inspect `.env.local` value out-of-band |

---

## Phase-3 Score

12 weighted categories, 0–10 each, weighted to 100. Weights reflect e-commerce risk (payment + authz dominate).

| # | Category | Weight | Score | Weighted | Driving evidence |
|---|---|---:|---:|---:|---|
| 1 | Authentication | 10 | **2** | 2.0 | Pages OK; all `/api/admin/*` open (T-01) |
| 2 | Authorization (BOLA/IDOR) | 15 | **1** | 1.5 | T-05 confirmed; admin APIs no auth |
| 3 | Payment integrity | 20 | **1** | 2.0 | T-09c, T-10, T-11, T-13, T-14 |
| 4 | Input validation | 8 | **3** | 2.4 | Manual checks only; no schema lib |
| 5 | Output encoding (XSS) | 5 | **4** | 2.0 | T-18 fired; storefront otherwise clean |
| 6 | CSRF | 5 | **3** | 1.5 | No tokens; partially mitigated for admin |
| 7 | Rate limiting | 5 | **0** | 0.0 | None anywhere |
| 8 | Secrets / config | 10 | **1** | 1.0 | `.env` in git since init; service-role key everywhere |
| 9 | Dependencies | 5 | **2** | 1.0 | 5 critical + 14 high in prod deps |
| 10 | Security headers | 5 | **1** | 0.5 | Zero configured |
| 11 | Error handling | 5 | **3** | 1.5 | DB errors leak |
| 12 | Logging / monitoring | 7 | **2** | 1.4 | console.error; no Sentry/audit log |
| | **Total** | 100 | | **16.8** | rounded → **17 / 100, Grade F** |

(Preliminary plan-mode estimate was 19; dynamic confirmation pulled it down 2 points — the IPN forgery and admin-API openness were both confirmed live, not just statically.)

---

## Phase-4 Remediation Roadmap

Priorities are *risk-weighted and effort-aware*. P0 = ship-stoppers, do this week. P1 = next 1–2 sprints. P2 = within a month.

### P0 — within 1 week (week-1 critical)

1. **Auth on `/api/admin/*`.** Extend `src/middleware.js` matcher from `'/admin/:path*'` to also match `'/api/admin/:path*'`. The same `Authorization: Basic` check applies. Estimated: 1 line + redeploy.
2. **Server-side price recompute** in `src/pages/api/payments/initiate.js`. For each `items[i]._id`, fetch the current price from Sanity (or from the `inventory` row if you mirror it), recompute `total`, and reject (or transparently overwrite) `req.body.amount`. Never trust the client total.
3. **IPN signature verification** in `src/pages/api/webhooks/pesapal/ipn.js`. Pesapal v3's pattern is to *call back* `GetTransactionStatus` with the `OrderTrackingId` to confirm the status server-to-server before mutating anything. Right now we trust the GET query params verbatim.
4. **Ownership check on order lookups.** `/api/orders/[orderId]` and `/api/orders/by-ref` must require *something the buyer would know* — e.g., merchant ref **plus** matching email — before returning PII. Or sign the callback URL Pesapal redirects to and only trust signed lookups for the success-page render.
5. **Rotate every secret currently in `.env` / `.env.local`.** Treat as compromised: SMTP password, DPO/Pesapal tokens, Sanity write token, Supabase service role, WhatsApp access token, Maps key. After rotation, scrub `.env` from git history (`git filter-repo --invert-paths --path .env` or BFG), force-push once, coordinate with collaborators.
6. **Stop committing `.env`.** `git rm --cached .env`, commit; `.gitignore` already lists it. Migrate the few non-secret bits (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`) into `.env.example`.
7. **Escape user input** in `src/pages/api/nodemailer-contact.js`. The shopkeeper email body interpolates `${Name}` and `${Message}` raw. Either escape with a tiny `escapeHtml()` helper or switch to a templating engine that escapes by default.
8. **`npm audit fix`** for everything that doesn't require `--force`, plus a deliberate `next` upgrade to a 14.2.x patch that resolves the cache-poisoning + image-DoS advisories.

### P1 — next 1–2 sprints

9. **Schema validation on every API handler** with `zod`. Reuse the schemas client-side for forms.
10. **Split Supabase clients.** Keep service-role for trusted server writes; introduce an anon client for public reads in `src/lib/db.js`. Then enable RLS on `orders`, `payments`, `inventory`, `whatsapp_templates`, `store_hours` (migrations live in `supabase/`).
11. **Stock reservation pattern.** Don't decrement at `/api/checkout`. Reserve (status `pending`, TTL ~15min) at payment-init time; commit on verified IPN; restore on timeout/failure. Eliminates T-13/T-14 plus inventory griefing.
12. **Rate limiting** on `/api/nodemailer-contact`, `/api/payments/initiate`, `/api/webhooks/pesapal/ipn`, and the admin Basic Auth challenge. `@upstash/ratelimit` is Edge-friendly; per-IP, narrow window.
13. **Security headers** via `next.config.js` `async headers()`: CSP (start in report-only), HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locking down camera/mic/geolocation. Strip `X-Powered-By` (`next.config.js` → `poweredByHeader: false`).
14. **Replace Basic Auth admin** with NextAuth (already a dependency, currently unused). Sessions, logout, MFA path, audit-log hook, easier credential rotation.
15. **CSRF tokens** on customer-side state-changing endpoints once sessions exist — or rely on `SameSite=Lax` cookies + Origin checks.

### P2 — within a month

16. **Centralized error handler** that logs full detail to Sentry but returns `{ error, requestId }` to clients. Strip `error.message` from all responses.
17. **Audit log of admin actions** (price/stock changes, store-hours edits, template edits) — append-only Supabase table, surfaced in admin UI.
18. **CI**: GitHub Actions running `next lint`, `npm audit --omit=dev`, `gitleaks`, `semgrep --config p/owasp-top-ten` on every PR. Fail PRs with new high+ CVEs.
19. **Security regression suite** — codify Phase-2 probes as scripts in `tests/security/` so the score is reproducible after every change.
20. **Dependency hygiene.** Pin `@whiskeysockets/baileys` off `7.0.0-rc.6` (pre-release, unofficial WhatsApp implementation pulling in vulnerable `protobufjs`/`libsignal-node`). Either upgrade to a vetted release tag or — preferably — drop Baileys and route everything through the official WhatsApp Cloud API.

### Realistic post-remediation score targets

- After P0: **~55 / 100 (D+)** — the dangerous bleeds are stopped.
- After P0+P1: **~80 / 100 (B-)** — defense-in-depth in place.
- After P0+P1+P2: **~90 / 100 (A-)** — sustainable security posture with regression coverage.

---

## Files to modify (P0+P1 condensed)

| File | Change |
|---|---|
| `src/middleware.js` | matcher to `['/admin/:path*', '/api/admin/:path*']` |
| `src/pages/api/payments/initiate.js` | server-side price recompute |
| `src/pages/api/payments/verify.js` | strict idempotency keyed by merchant ref |
| `src/pages/api/webhooks/pesapal/ipn.js` | round-trip-verify with Pesapal `GetTransactionStatus` |
| `src/pages/api/orders/[orderId].js`, `src/pages/api/orders/by-ref.js` | ownership check (ref + email or signed token) |
| `src/pages/api/admin/**/*.js` | zod validation + remove `TODO: Add authentication/authorization check` |
| `src/pages/api/nodemailer-contact.js` | HTML-escape user input |
| `src/lib/supabaseClient.js`, `src/lib/db.js` | split anon vs service-role clients |
| `next.config.js` | `headers()` + `poweredByHeader: false` |
| `.gitignore` + repo cleanup | confirm `.env` ignored, `git rm --cached`, scrub history |
| `package.json` / `package-lock.json` | `npm audit fix`; explicit `next@14.2.x` bump |
| `supabase/` migrations | RLS policies for `orders`, `payments`, `inventory`, `whatsapp_templates`, `store_hours` |

---

## Verification (post-fix)

For each remediation wave, re-run this audit. Specifically:

1. **Re-run the Phase-2 battery** (probes captured above) and confirm all 🔴/🟠 entries have flipped to 🟢. The list is stable enough to script as `tests/security/probe.sh`.
2. **`npm audit --omit=dev`** — clean or with documented exceptions.
3. **`gitleaks detect --source . --log-opts="--all"`** — clean post-history-scrub.
4. **Manual smoke**:
   - Browse → cart → checkout → Pesapal sandbox → callback → confirmation channels fire.
   - Admin login (new auth) → mutate stock → see audit-log row.
   - Forge an IPN — must be rejected.
   - Tamper cart prices client-side — server must overwrite or reject.
5. **`curl -sI https://<deploy>/`** — verify CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all present.
6. **Re-score** and publish.

---

## Appendix — raw probe transcripts

Captured during this audit (key lines):

```
T-01a  GET /api/admin/inventory                         → HTTP 200 (full product list, stock)
T-01b  GET /api/admin/sales-report?from=...&to=...      → HTTP 200 (sales by product)
T-01d  GET /api/admin/store-hours                        → HTTP 200 (week's hours)
T-01e  GET /api/admin/whatsapp-templates                → HTTP 500 ("relation public.whatsapp_templates does not exist") — DB schema leak + no auth gate
T-01f  GET /api/analytics/overview                      → HTTP 200 (totals + trend)
T-01g  PUT /api/admin/inventory/update {sanity_id?}     → HTTP 400 from validation — handler ran w/o auth
T-01h  PATCH /api/admin/inventory/{uuid}                → HTTP 500 from DB — handler ran w/o auth
T-02   GET /admin                                        → HTTP 401 Authentication required.
T-05   GET /api/orders/{realOrderId}                    → HTTP 200 (real customer email, phone, full address, totals)
T-07   GET /api/analytics/recent-orders?page=1&pageSize=3 → HTTP 200 (PII feed)
T-09c  POST /api/payments/initiate {amount:1, complete} → 400 on address shape; price-trust path confirmed in code
T-11   GET /api/webhooks/pesapal/ipn?...=FORGED         → HTTP 200 ({"status":200}, no signature check)
T-15   POST /api/checkout {items:"not-an-array"}        → HTTP 400 (manual check)
T-18   POST /api/nodemailer-contact w/ HTML payload     → HTTP 200 success!! (real email sent)
T-33   curl -I /                                         → only X-Powered-By: Next.js (no CSP/HSTS/etc.)
T-35   curl -I -H 'Origin: evil.example.com' /api/admin/inventory → no CORS headers (default same-origin)
T-36a  PATCH /api/admin/inventory/{uuid} {price:"abc"}  → 500 leaks `JSON object requested, multiple (or no) rows returned`
```

End of report.
