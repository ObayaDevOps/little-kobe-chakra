# Security Remediation Plan — little-kobe-chakra

Companion to `SECURITY_AUDIT.md`. The audit identified the failures; this document specifies *exactly how to fix them*, in what order, with what code, and how to verify each fix.

**Branch:** continue on `security-audit` for the plan + early P0 work, then split into focused PRs (one per fix or small group) so each can be reviewed and reverted independently.

---

## Audit corrections (read first)

While drafting this plan I re-read several files cited in the audit. Two findings need to be re-framed:

- **T-11 (Pesapal IPN forgery).** `src/pages/api/webhooks/pesapal/ipn.js` *does* call back to Pesapal's `GetTransactionStatus` (lines 70–82) before mutating the DB. So the handler does **not** actually trust IPN query params for status — it uses them only as a lookup key. The forged-IPN HTTP 200 in the audit is the immediate ACK, which is the correct behavior per Pesapal's spec. The remaining real risks are: (a) **idempotency** — a replayed IPN can still cause duplicate post-completion actions (emails, WhatsApp, order creation) within the small race window before the terminal-state guard fires; (b) **no source filtering** — anyone can trigger the round-trip to Pesapal, which is a soft DoS vector. Re-prioritized in P0-3 below.
- **T-09c (price tampering).** Confirmed in code: `src/pages/api/payments/initiate.js:68` does `parseFloat(amount)` and stores it. P0-2 is the right fix.

The audit score does not need revising — those reframings affect *what* to fix, not *whether*.

---

## Sequencing strategy

Three buckets, executed in order:

1. **P0 (Week 1) — stop the bleeding.** Eight items. Each is small (S–M), each can ship independently, none requires a schema migration. Goal: every 🔴 in the audit flips to 🟢.
2. **P1 (Sprint 2–4) — defense in depth.** Seven items. Two of them (Supabase client split + RLS, NextAuth replacement) are large and have downstream implications.
3. **P2 (Month 2) — sustainable posture.** Five items. CI, observability, regression suite, dependency hygiene. Mostly tooling.

Within each bucket, items have explicit dependencies. The "Depends on" line in each item is the only ordering constraint — anything else can run in parallel.

**Effort key:** S = ≤½ day, M = 1–2 days, L = 3+ days.

---

## P0 — week 1

### P0-1 · Auth on `/api/admin/*`

**What.** Extend the existing Basic Auth middleware so it covers the API routes too, not just the page routes.

**Why.** Audit T-01 confirmed every `/api/admin/*` is reachable unauthenticated. Page-level Basic Auth is meaningless if the underlying endpoints are open.

**Files.** `src/middleware.js`.

**Change.**

```js
// src/middleware.js — bottom of file
export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*']
};
```

The handler at the top of the file (`if (!url.pathname.startsWith(ADMIN_PATH_PREFIX))`) also needs to allow either prefix:

```js
const ADMIN_PATH_PREFIXES = ['/admin', '/api/admin'];
// ...
if (!ADMIN_PATH_PREFIXES.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) {
    return NextResponse.next();
}
```

Also remove the now-redundant `// TODO: Add authentication/authorization check` block at the top of `src/pages/api/admin/inventory/update.js` (and any other admin handler that has the same TODO).

**Verify.** Re-run T-01a..T-01i — all should return HTTP 401 with `WWW-Authenticate: Basic`. Authenticated calls (Basic creds via curl `-u`) should return as before.

**Effort.** S (≤30 min). **Depends on.** Nothing.

**Risk.** None significant. The frontend admin pages already send Basic Auth (`fetch` inherits cookies/auth from the page session), so the admin UI keeps working. If any admin page calls `/api/admin/*` *without* credentials, the network tab will surface a 401 immediately.

---

### P0-2 · Server-side price recompute on payment initiate

**What.** Stop trusting the client-supplied `amount` and `items[].price`. Refetch each item's current price from Sanity (or from `inventory` if it's mirrored) and recompute the total server-side.

**Why.** Audit T-09c / T-10. A trivially-tampered cart can pay 1 UGX for any product.

**Files.**
- `src/pages/api/payments/initiate.js` (rewrite the validation + amount block)
- `src/lib/pricing.js` (new — extracted helper)
- `src/lib/sanity.client.js` (or wherever the existing Sanity server client lives — read-only)

**Change.** New helper `validateAndComputeCart(items)`:

```js
// src/lib/pricing.js
import { sanityClient } from './sanity.client';

const TOLERANCE = 0.5; // UGX rounding tolerance

export async function validateAndComputeCart(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Cart is empty.');
    }
    const ids = items.map(i => i._id).filter(Boolean);
    if (ids.length !== items.length) {
        throw new Error('Cart contains items missing _id.');
    }
    // Sanity GROQ — bind ids as a typed array param, never string-interp
    const docs = await sanityClient.fetch(
        `*[_type == "product" && _id in $ids]{ _id, name, price, archived }`,
        { ids }
    );
    const byId = new Map(docs.map(d => [d._id, d]));

    let serverTotal = 0;
    const sanitized = items.map(line => {
        const doc = byId.get(line._id);
        if (!doc) throw new Error(`Unknown product: ${line._id}`);
        if (doc.archived) throw new Error(`Product unavailable: ${doc.name}`);
        const qty = Number(line.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
            throw new Error(`Bad quantity for ${doc.name}.`);
        }
        const lineTotal = doc.price * qty;
        serverTotal += lineTotal;
        return { _id: doc._id, name: doc.name, price: doc.price, quantity: qty, lineTotal };
    });

    return { serverTotal, sanitized };
}
```

Call it at the top of `initiate.js` and replace `parseFloat(amount)`:

```js
const { serverTotal, sanitized } = await validateAndComputeCart(items);
if (Math.abs(serverTotal - Number(amount)) > TOLERANCE) {
    return res.status(409).json({ message: 'Cart total mismatch — please refresh and retry.' });
}
// from here on use `serverTotal` and `sanitized`, never req.body.amount or req.body.items
```

**Verify.** Re-run T-09c with `amount: 1` against a real product `_id`: must return 409. With the correct amount: must succeed.

**Effort.** M. **Depends on.** Nothing.

**Risk.** Low if the Sanity field for price is `price` (verify the schema in `sanity/schemas/`). If the catalog uses currency/variant pricing, the helper needs to mirror that logic — read `src/lib/db.js` for any existing pricing query first.

---

### P0-3 · IPN idempotency + light source-IP allowlist

**What.** (Re-scoped per the correction at top of this doc.) Add idempotency to the IPN processor so duplicate Pesapal pings cannot fire post-completion side effects twice. Optionally allowlist Pesapal's IP ranges if Pesapal publishes them.

**Why.** The handler already verifies state with Pesapal directly, so signature verification adds little. The real exposure is replay → duplicate confirmation emails, duplicate WhatsApp sends, duplicate order rows.

**Files.**
- `src/pages/api/webhooks/pesapal/ipn.js`
- `src/lib/db.js` (new function: `claimIpnSlot(trackingId)` using a unique-constraint pattern)
- `supabase/migrations/<ts>_ipn_processed_log.sql` (new — small append-only table with unique key on `tracking_id`)

**Schema.**

```sql
-- supabase/migrations/<ts>_ipn_processed_log.sql
create table public.ipn_processed_log (
    id bigserial primary key,
    tracking_id text not null,
    processed_at timestamptz not null default now(),
    final_status text not null,
    constraint ipn_processed_log_tracking_unique unique (tracking_id)
);
alter table public.ipn_processed_log enable row level security;
-- service-role inserts only; no public policies
```

**Change.** Inside the `setImmediate` block, before `updatePaymentStatus`, attempt an insert. If the unique constraint trips, another worker already processed this IPN → return early.

```js
// inside setImmediate
const claimed = await claimIpnSlot(OrderTrackingId, internalStatus);
if (!claimed) {
    console.log(`IPN ${OrderTrackingId} already processed — skipping side effects.`);
    return;
}
```

`claimIpnSlot` returns `true` on insert, `false` on `23505` (unique violation). Order matters: claim *before* `updatePaymentStatus` and post-completion actions, but *after* the Pesapal `GetTransactionStatus` round-trip (so failed lookups don't burn the slot).

**(Optional) Source-IP allowlist.** If Pesapal publishes IPN source IPs, check `req.headers['x-forwarded-for']` (Vercel) against a list. Skip silently if absent rather than 401, so legitimate edge-case traffic isn't dropped during onboarding.

**Verify.** Hit the IPN endpoint twice with the same `OrderTrackingId`. First call processes; second logs "already processed" and exits without side effects. Confirm via Supabase that there's exactly one row in `orders` and one outbound email/WhatsApp event.

**Effort.** M. **Depends on.** Nothing.

**Risk.** If the Pesapal status genuinely changes (e.g., REVERSED after COMPLETED), the slot blocks reprocessing. Mitigation: store `final_status` in the slot row and allow re-processing only if the new status is "more terminal" than the stored one. Acceptable to skip in the first pass and add later.

---

### P0-4 · Ownership check on order lookup endpoints

**What.** `/api/orders/[orderId]` and `/api/orders/by-ref` must require something the buyer would know before returning PII.

**Why.** Audit T-05 confirmed live PII leak.

**Files.**
- `src/pages/api/orders/[orderId].js`
- `src/pages/api/orders/by-ref.js`
- `src/pages/payment/success.js` and `src/pages/payment/callback.js` (callers — may need to forward `email` query param)

**Change.** Two equivalent options; pick one.

**Option A — email match (simplest).** Both endpoints accept `?email=…`, normalize (lowercase, trim), compare to the order's `customer_email`. On mismatch return **404** (not 403 — don't leak existence).

```js
// shared helper
function emailMatchesOrder(order, supplied) {
    if (!supplied || !order?.customer_email) return false;
    return order.customer_email.trim().toLowerCase() === String(supplied).trim().toLowerCase();
}

// in handler, after fetching the order:
if (!emailMatchesOrder(orderData, req.query.email)) {
    return res.status(404).json({ message: `Order not found.` });
}
```

The success/callback page already has the email in the cart context (or can read it from the same payload it sent to `/api/payments/initiate`). Pass it through to the API call.

**Option B — signed callback (stronger but bigger change).** Sign the redirect URL Pesapal returns to with an HMAC of `merchant_reference + iat`, set TTL ~30min. The success page reads the signature, the order endpoint verifies it. More work but stateless and tamper-proof. Skip for P0; revisit if Option A leaves usability gaps.

**Verify.** T-05 with a real `orderId` but no `?email` param: 404. With wrong email: 404. With matching email: 200 + order. Same for `by-ref`.

**Effort.** S–M. **Depends on.** Nothing.

**Risk.** Existing buyers visiting old confirmation links break. Mitigation: make the email param *required* only for new orders, and keep a short grace window where missing email returns 200 only for orders older than `now - 24h`. Or just accept the breakage — old links are rarely revisited.

---

### P0-5 · Rotate every secret currently in `.env` / `.env.local`

**What.** Treat every secret in version control as compromised. Rotate at each provider, then re-deploy with new values in `.env.local` only.

**Why.** Audit T-26 — `.env` has been in git since the `init` commit. Anyone with read access to the repo (including past collaborators, mirrors, forks, GitHub search) has the secrets.

**Files.** None — this is provider-side ops.

**Steps (in order, each is independent).**

| Provider | Action |
|---|---|
| Gmail SMTP (`SMTP_USER`/`SMTP_PASSWORD`) | Revoke the app password at https://myaccount.google.com/apppasswords; generate a new one |
| Pesapal | Regenerate consumer key + secret in the merchant portal; re-register IPN URL if needed |
| Supabase | Rotate the service role key (Project Settings → API → Reset). Anon key stays. |
| Sanity | Rotate write token at https://sanity.io/manage/personal/tokens; keep read token if scope-limited |
| WhatsApp Cloud API | Rotate access token (Meta Business → System Users → token) |
| Google Maps | Restrict the existing key to HTTP referrer + specific APIs (Maps JS, Geocoding) instead of rotating — restriction makes the leaked key non-abusive |
| DPO | Confirm whether `DPO_COMPANY_TOKEN` is still in use (recon flagged it as legacy). If unused, delete; if used, rotate. |
| `ADMIN_BASIC_PASS` | Rotate to a strong random value (≥24 chars, generator) |

After rotation, push the new values to the deployment environment (Vercel/host env vars). Do **not** commit them.

**Verify.** Pre-rotation values fail when used (e.g., old SMTP creds → "Invalid login"). Production smoke: send a test email, run a Pesapal sandbox transaction, confirm WhatsApp template fires.

**Effort.** M (mostly waiting on UI clicks). **Depends on.** Nothing in code, but P0-6 should follow immediately.

**Risk.** Any deployment that doesn't pick up the new env values will break. Coordinate one rotation at a time with re-deploys to limit blast radius.

---

### P0-6 · Stop committing `.env` and scrub history

**What.** Remove `.env` from version control going forward; optionally rewrite history to remove past instances.

**Why.** Audit T-26.

**Files.** `.env`, `.gitignore`, `.env.example` (new).

**Steps.**

```bash
# 1. Untrack .env in current tree
git rm --cached .env
# 2. .gitignore already lists `.env` — confirm
grep -E '^\.env(/|$)' .gitignore
# 3. Capture the non-secret bits in a template for collaborators
cat > .env.example <<'EOF'
# Sanity (public IDs, safe to expose)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# SMTP — secrets go in .env.local only
SMTP_USER=
SMTP_PASSWORD=
RECIPIENT_ADDRESS=

# DPO — leave blank if unused
# DPO_COMPANY_TOKEN=
EOF
# 4. Commit
git add .gitignore .env.example
git commit -m "remove .env from tracking; add .env.example template"
```

**History scrub (optional, recommended).** Coordinate with all collaborators (force-push will require everyone to re-clone or `reset --hard`). Run from a fresh clone:

```bash
# preferred: git-filter-repo (https://github.com/newren/git-filter-repo)
git filter-repo --invert-paths --path .env
git push --force-with-lease origin main
```

If the repo has been public on GitHub at any point, history scrub does **not** retract anything already cloned/forked — rotation in P0-5 is the load-bearing step. Treat scrub as cleanup, not as remediation.

**Verify.** `git log --all -- .env` empty post-scrub. `git ls-files .env` empty. New PRs do not contain `.env`.

**Effort.** S (untrack) + M (history scrub coordination). **Depends on.** P0-5 must precede or run in parallel — scrub without rotation is meaningless.

**Risk.** Force-push over collaborators' branches → diverged refs. Pause merges during the scrub window.

---

### P0-7 · Escape user input in the contact-form email

**What.** The contact handler interpolates `Name`, `Email`, `PhoneNumber`, `Message` into HTML raw. Escape them.

**Why.** Audit T-18. Also the `from: Email` line lets unauthenticated callers spoof the From header (likely violates SPF/DKIM and/or gets the mail dropped — but worth fixing alongside).

**Files.** `src/pages/api/nodemailer-contact.js`.

**Change.**

```js
import nodemailer from "nodemailer";

const escapeHtml = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    const { Name, Email, PhoneNumber, Message } = req.body || {};
    if (!Name || !Email || !Message) {
        return res.status(400).json({ message: 'Missing fields.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email) || String(Email).length > 254) {
        return res.status(400).json({ message: 'Invalid email.' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    const safe = {
        Name: escapeHtml(Name),
        Email: escapeHtml(Email),
        PhoneNumber: escapeHtml(PhoneNumber),
        Message: escapeHtml(Message),
    };

    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,        // never trust user-supplied From
            replyTo: Email,                       // safe: header value not rendered as HTML
            to: process.env.RECIPIENT_ADDRESS,
            subject: `Little Kobe contact form — ${safe.Name}`,
            html: `<h1>${safe.Name} sent a message</h1>
                   <p><strong>Email:</strong> ${safe.Email}</p>
                   <p><strong>Phone:</strong> ${safe.PhoneNumber}</p>
                   <p><strong>Message:</strong> ${safe.Message}</p>`,
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('contact-form sendMail failed', err);
        return res.status(500).json({ message: 'Could not send.' });
    }
};
```

Three fixes in one: escaped HTML, fixed `from` header, callback-style API replaced with proper async/await + status codes (the previous code returned 200 even on error).

**Verify.** Re-run T-18 with the same XSS payload. The shopkeeper email body must show `&lt;img src=x ...&gt;` literally.

**Effort.** S. **Depends on.** Nothing.

**Risk.** None.

---

### P0-8 · `npm audit fix` + `next` patch upgrade

**What.** Resolve as many CVEs as possible without breaking changes; deliberately upgrade `next` within 14.x to a patch that fixes the cache-poisoning + image-DoS advisories.

**Why.** Audit category I — 5 critical, 14 high.

**Files.** `package.json`, `package-lock.json`.

**Steps.**

```bash
# 1. Snapshot the lockfile pre-change for diffing
git checkout -b deps/npm-audit-fix
cp package-lock.json package-lock.json.bak

# 2. Non-breaking fixes
npm audit fix
npm test 2>/dev/null || true   # no test suite today, but reserved
npm run build                  # must pass

# 3. Targeted next upgrade (verify latest 14.2.x patch with both CVE fixes)
#    Anthropic doesn't have a real-time CVE feed in this session — check
#    https://github.com/vercel/next.js/security/advisories before pinning.
npm install next@14.2.x --save-exact   # replace with concrete patch
npm run build

# 4. Re-audit
npm audit --omit=dev
```

For deps that need `--force` (likely `@whiskeysockets/baileys` due to `protobufjs` cascade), defer to P2-20 — those bring breaking changes and the WhatsApp fallback path needs separate review.

**Verify.** `npm audit --omit=dev` shows reduced count. `npm run build` succeeds. `npm run dev` boots; the storefront, admin, and contact form work. Image optimization (Next Image) renders Sanity images.

**Effort.** S–M (mostly testing). **Depends on.** Nothing.

**Risk.** A `next` minor/patch upgrade can subtly change image-optimization or middleware behavior. Smoke-test images and `/admin` Basic Auth specifically before deploying.

---

## P1 — sprint 2–4

### P1-9 · Schema validation with `zod` on every API handler

**What.** Replace ad-hoc `typeof` / `Array.isArray` checks with declarative schemas. Reject bad input before any handler logic runs.

**Why.** Audit T-15 + general defense-in-depth. Also makes future changes safer.

**Files.**
- `package.json` — add `zod`
- `src/lib/schemas/` (new directory) — one file per logical area: `payments.js`, `admin.js`, `orders.js`, `contact.js`
- `src/lib/withSchema.js` (new) — tiny wrapper

**Helper.**

```js
// src/lib/withSchema.js
export const withSchema = (schemas, handler) => async (req, res) => {
    try {
        if (schemas.body)  req.body  = schemas.body.parse(req.body);
        if (schemas.query) req.query = schemas.query.parse(req.query);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid request.', issues: err.issues });
    }
    return handler(req, res);
};
```

**Pattern (one example).**

```js
// src/lib/schemas/payments.js
import { z } from 'zod';
export const initiateBody = z.object({
    amount: z.number().positive().max(100_000_000),
    currency: z.literal('UGX'),
    description: z.string().min(1).max(200),
    items: z.array(z.object({
        _id: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        // price intentionally NOT trusted (see P0-2)
    })).min(1).max(50),
    billing_address: z.object({
        email_address: z.string().email().optional(),
        phone_number: z.string().min(7).max(20).optional(),
        // ...
    }).refine(x => x.email_address || x.phone_number, 'Email or phone required'),
});

// initiate.js
import { withSchema } from '@/lib/withSchema';
import { initiateBody } from '@/lib/schemas/payments';
export default withSchema({ body: initiateBody }, async function handler(req, res) { /* ... */ });
```

Roll out one endpoint at a time, in this order: payments → orders → admin/* → contact → checkout. Each PR adds one schema file + one or more wrapped handlers.

**Verify.** Re-run T-15 across each migrated endpoint with malformed bodies — must return 400 with structured `issues` array.

**Effort.** L (across all endpoints). **Depends on.** P0-2 (initiate.js already touched).

**Risk.** Zod's defaults can mask bugs (e.g., `coerce` quietly converting strings to numbers). Use strict types (`z.number()` not `z.coerce.number()`) by default.

---

### P1-10 · Split Supabase clients + enable RLS

**What.** Use the *anon* key for public reads; reserve the *service-role* key for verified-admin/server-trusted writes. Then enable RLS policies on every table so the anon path is properly gated.

**Why.** Audit T-29. Today every read uses the service role, bypassing RLS — meaning RLS provides zero defense if a single endpoint is misconfigured.

**Files.**
- `src/lib/supabaseClient.js` — already exports both `supabase` (anon) and `getServerSupabaseClient` (service). Keep both, but rename for clarity (`getAnonSupabaseClient`, `getServiceSupabaseClient`).
- `src/lib/db.js` — split functions into `publicReads` (use anon) vs `adminWrites` (use service).
- `supabase/migrations/<ts>_enable_rls.sql` — add policies.

**RLS sketch.**

```sql
-- payments: nobody can read or write directly via anon
alter table public.payments enable row level security;
-- (no policies = deny all for anon; service role bypasses RLS)

-- orders: same
alter table public.orders enable row level security;

-- inventory: anon can SELECT (catalog browsing), nothing else
alter table public.inventory enable row level security;
create policy inventory_select_public on public.inventory
    for select to anon using (is_archived = false);

-- store_hours: anon can SELECT
alter table public.store_hours enable row level security;
create policy hours_select_public on public.store_hours for select to anon using (true);

-- whatsapp_templates, ipn_processed_log: service-role only (no policies)
```

**Migration plan.** Apply migrations in staging first. For each public-read endpoint, switch to the anon client and confirm the response is unchanged. Only then enable RLS. Endpoints affected:
- `/api/store-status` → reads `store_hours`
- product listing pages → read `inventory`
- catalog pages → mostly Sanity, but any hybrid read of `inventory.quantity` switches to anon

Admin endpoints stay on the service-role client.

**Verify.** With a fresh anon client, attempt `select * from payments` → empty. `select * from inventory` → returns non-archived only. End-to-end checkout still works.

**Effort.** L. **Depends on.** P0-1 (admin auth) — without that, switching admin to service-role doesn't matter, and ordering matters less.

**Risk.** Highest risk in P1. Mis-applied RLS can break public reads invisibly (queries return empty without errors). Mitigation: enable policies one table at a time, smoke-test each, keep migration rollback files.

---

### P1-11 · Stock reservation pattern

**What.** Replace the eager `decrement_stock` at `/api/checkout` with a *reservation* row that has a TTL. Commit the decrement only on verified IPN; release on timeout/failure.

**Why.** Audit T-13 (race) and T-14 (abandon-griefing). The current code even has a TODO acknowledging this (`/api/checkout.js:29-30`).

**Files.**
- `supabase/migrations/<ts>_stock_reservations.sql`
- `src/lib/db.js` — `reserveStock`, `commitReservation`, `releaseReservation`, `expireOldReservations`
- `src/pages/api/checkout.js` — replace `decrement_stock` calls with `reserveStock`
- `src/pages/api/payments/verify.js` and `src/pages/api/webhooks/pesapal/ipn.js` — call `commitReservation` on COMPLETED, `releaseReservation` on FAILED/REVERSED
- A scheduled task (Vercel cron or Supabase scheduled function) runs `expireOldReservations` every minute

**Schema.**

```sql
create table public.stock_reservations (
    id uuid primary key default gen_random_uuid(),
    merchant_reference text not null,
    product_id text not null,            -- sanity _id
    quantity int not null check (quantity > 0),
    status text not null check (status in ('PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED')),
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    constraint reservations_unique_per_ref_product unique (merchant_reference, product_id)
);
create index reservations_pending_idx on public.stock_reservations (status, expires_at);
```

**Logic.** "Available stock" = `inventory.quantity - SUM(stock_reservations.quantity WHERE status='PENDING' AND expires_at > now() AND product_id = X)`. Implement as a SQL function so callers don't repeat the math. Reservation insert + availability check must run in a single transaction (Postgres function with `select ... for update` on the inventory row).

**Verify.** Two concurrent clients each reserve the last unit → one succeeds, one gets 409. Abandon a checkout → after 15 min, the reservation expires and the unit is available again. Successful payment → reservation flips to COMMITTED and `inventory.quantity` decrements once.

**Effort.** L (multi-day). **Depends on.** P1-10 (RLS) so the new table can be locked down properly.

**Risk.** Concurrency bugs. Use `select ... for update` and unique constraints; don't rely on application-level locking.

---

### P1-12 · Rate limiting

**What.** Add a per-IP, sliding-window limiter to four endpoints: `/api/nodemailer-contact`, `/api/payments/initiate`, `/api/webhooks/pesapal/ipn`, and the admin Basic Auth challenge.

**Why.** Audit category G — none today.

**Files.**
- `package.json` — add `@upstash/ratelimit` + `@upstash/redis` (or, if no edge KV available, `lru-cache` for in-memory per-instance)
- `src/lib/ratelimit.js` (new)
- The four target handlers

**Sketch.**

```js
// src/lib/ratelimit.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
export const limits = {
    contact:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1 m') }),
    payments: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m') }),
    ipn:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m') }),
    adminAuth:new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '5 m') }),
};

export async function gate(limiter, ip) {
    const { success, reset } = await limiter.limit(ip);
    return { success, retryAfterMs: reset - Date.now() };
}
```

Integrate at the top of each handler (or in middleware for the Basic Auth one). 429 + `Retry-After` header on miss.

**Verify.** Hit `/api/nodemailer-contact` 4 times in a minute from one IP — fourth call returns 429.

**Effort.** M. **Depends on.** Adding Upstash (free tier) or accepting the in-memory limitation on Vercel (per-instance, not global).

**Risk.** Edge-runtime vs Node-runtime mismatch. Confirm middleware compatibility before deploying.

---

### P1-13 · Security headers + strip `X-Powered-By`

**What.** Configure `next.config.js` to emit a hardened header set on all responses.

**Why.** Audit T-33.

**Files.** `next.config.js` (currently has only `reactStrictMode` + image domains).

**Change.**

```js
// next.config.js
const securityHeaders = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    // CSP — start in report-only, then promote after observing a week of reports
    { key: 'Content-Security-Policy-Report-Only', value: [
        "default-src 'self'",
        "img-src 'self' https://cdn.sanity.io data:",
        "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://*.supabase.co https://*.sanity.io https://pay.pesapal.com",
        "frame-src https://pay.pesapal.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' https://pay.pesapal.com",
    ].join('; ') },
];

module.exports = {
    reactStrictMode: true,
    poweredByHeader: false,
    images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }] },
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }];
    },
};
```

CSP runs in *report-only* first to surface false positives. After a week of clean reports, change `Content-Security-Policy-Report-Only` → `Content-Security-Policy` and remove `'unsafe-inline'` from script-src (will require nonces).

**Verify.** `curl -sI https://staging/ | grep -iE 'content-security|strict-transport|x-frame|x-content|referrer|permissions|powered'` — all present, `X-Powered-By` absent.

**Effort.** M. **Depends on.** Nothing.

**Risk.** A too-strict CSP breaks Pesapal iframe or Google Maps. Report-only mode mitigates; tune based on real traffic.

---

### P1-14 · Replace Basic Auth admin with NextAuth

**What.** Move from header-based Basic Auth to a session-based admin login using NextAuth (already a dependency, currently unused).

**Why.** Basic Auth has no logout, no MFA path, no audit-log hook, and credentials are sent on every request. Sessions enable proper UX *and* unlock CSRF-token semantics for P1-15.

**Files.**
- `package.json` — `next-auth` already present
- `src/pages/api/auth/[...nextauth].js` (new) — credentials provider with bcrypt-hashed password from env, or a tiny Supabase `admin_users` table
- `src/middleware.js` — replace Basic Auth check with `getToken({ req })` + `token.role === 'admin'`
- `src/pages/admin/login.js` (new) — minimal Chakra form
- `src/pages/admin/_app.js` or root layout — wrap with `<SessionProvider>`

**Decision: storage.** For a single-tenant admin (one shopkeeper), env-var hashed password is fine. For >1 admin, add a Supabase `admin_users` table with `email`, `password_hash`, `created_at`, `last_login_at`.

**Sketch (env-based, single admin).**

```js
// src/pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export default NextAuth({
    providers: [Credentials({
        name: 'admin',
        credentials: {
            username: { type: 'text' },
            password: { type: 'password' },
        },
        authorize: async (creds) => {
            if (creds.username !== process.env.ADMIN_USER) return null;
            const ok = await bcrypt.compare(creds.password, process.env.ADMIN_PASS_HASH);
            return ok ? { id: 'admin', name: creds.username, role: 'admin' } : null;
        },
    })],
    session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
    callbacks: {
        jwt: ({ token, user }) => { if (user?.role) token.role = user.role; return token; },
        session: ({ session, token }) => { session.user.role = token.role; return session; },
    },
    pages: { signIn: '/admin/login' },
});
```

Update `src/middleware.js`:

```js
import { getToken } from 'next-auth/jwt';
// ...
const token = await getToken({ req });
if (!token || token.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', req.url));  // for pages
    // for /api/admin: return 401 JSON
}
```

Migration: keep Basic Auth as a fallback for one deploy cycle so the cutover doesn't lock anyone out, then remove.

**Verify.** Visiting `/admin` redirects to `/admin/login`. Login → `/admin` accessible. `Sign out` clears the session. `/api/admin/*` rejects requests without the cookie.

**Effort.** L. **Depends on.** P0-1 (so middleware already covers `/api/admin`); coordinates with P1-15.

**Risk.** Lockout. Test the rotation in staging; keep Basic Auth as fallback during the cutover.

---

### P1-15 · CSRF on customer-side state-changing endpoints

**What.** Once admin is session-based (P1-14), add CSRF protection to anything that takes mutating cookies. For purely customer-side endpoints (which today have no cookies), enforce `Origin` header allowlisting.

**Why.** Audit T-21.

**Files.**
- `src/lib/csrf.js` (new) — double-submit token helper
- API handlers that mutate state

**Two-track approach.**
- **Admin (cookie-authenticated post P1-14):** double-submit cookie + custom header. NextAuth's `getCsrfToken()` already provides this — wire it through admin forms.
- **Customer (no cookies):** check `Origin` against an allowlist of `[NEXT_PUBLIC_APP_BASE_URL]`. Reject mismatches.

```js
// src/lib/origin.js
const allowed = new Set([process.env.NEXT_PUBLIC_APP_BASE_URL]);
export function checkOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true; // same-origin fetches omit Origin in some cases — let through
    return allowed.has(origin);
}
```

**Verify.** A cross-origin `fetch` from `https://attacker.example.com` to `/api/checkout` is rejected. Same-origin call still works.

**Effort.** M. **Depends on.** P1-14.

**Risk.** Same-origin Origin-header quirks (some browsers omit on same-origin GET). Stick to mutating verbs only (`POST`/`PUT`/`PATCH`/`DELETE`).

---

## P2 — month 2

### P2-16 · Centralized error handler + Sentry

**What.** A single wrapper for API handlers that logs full errors to Sentry but returns sanitized `{ error, requestId }` to clients. Strip `error.message` everywhere it's currently being returned.

**Files.** `src/lib/withErrorHandler.js`, every API handler (gradual rollout), `package.json` (`@sentry/nextjs`), `sentry.client.config.js`, `sentry.server.config.js`.

**Sketch.**

```js
// src/lib/withErrorHandler.js
import * as Sentry from '@sentry/nextjs';
import { randomUUID } from 'crypto';
export const withErrorHandler = (handler) => async (req, res) => {
    const requestId = randomUUID();
    try {
        await handler(req, res);
    } catch (err) {
        Sentry.captureException(err, { tags: { requestId, path: req.url } });
        if (!res.headersSent) {
            res.status(err.statusCode || 500).json({ error: 'Internal error', requestId });
        }
    }
};
```

Compose with `withSchema`:

```js
export default withErrorHandler(withSchema({ body: someSchema }, handler));
```

**Effort.** M. **Depends on.** P1-9.

---

### P2-17 · Admin audit log

**What.** Append-only Supabase table recording every admin write with actor, action, target, before/after.

**Files.** `supabase/migrations/<ts>_admin_audit_log.sql`, `src/lib/auditLog.js`, every admin write handler, new admin page `src/pages/admin/audit-log.js`.

**Schema sketch.**

```sql
create table public.admin_audit_log (
    id bigserial primary key,
    actor text not null,
    action text not null,                 -- e.g. 'inventory.update'
    target_id text,
    diff jsonb,                            -- { before, after, changed: [...] }
    request_id uuid,
    occurred_at timestamptz not null default now()
);
```

Each admin handler calls `auditLog({ actor, action, targetId, before, after, requestId })` after a successful mutation.

**Effort.** M–L. **Depends on.** P1-14 (need `actor` from the session).

---

### P2-18 · CI: lint, audit, gitleaks, semgrep

**What.** GitHub Actions running on every PR.

**Files.** `.github/workflows/ci.yml`.

**Sketch.**

```yaml
name: ci
on: [pull_request]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm audit --omit=dev --audit-level=high
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
      - uses: returntocorp/semgrep-action@v1
        with: { config: 'p/owasp-top-ten' }
      - run: npm run build
```

Block merge on failure.

**Effort.** S. **Depends on.** Nothing.

---

### P2-19 · Security regression suite

**What.** Codify the Phase-2 audit probes as scripts. Run nightly against staging.

**Files.** `tests/security/probe.sh`, `tests/security/expected.json`, optional `tests/security/run.js` for richer assertions.

**Approach.** Each probe is a `curl` + an expected status code + an expected JSON shape. Diff against `expected.json`. Wire up in CI on a schedule.

**Effort.** M. **Depends on.** Staging environment with a known seed dataset (so order IDs etc. are stable).

---

### P2-20 · Drop or pin Baileys

**What.** `@whiskeysockets/baileys@7.0.0-rc.6` is pre-release, unofficial, and pulls vulnerable `protobufjs` + `libsignal-node`. Either pin to a vetted release or remove.

**Files.** `package.json`, `src/lib/whatsapp/*` (drop the Baileys provider; route everything through the official Cloud API).

**Decision.** Prefer removal. The official Cloud API is already integrated; Baileys exists only as a fallback. Removing it eliminates two critical CVEs in one commit.

**Verify.** WhatsApp order-confirmation still fires through the Cloud API path. `npm audit` no longer reports `protobufjs`/`libsignal-node`.

**Effort.** M. **Depends on.** Confirmation that the Cloud API path is reliable enough (review `src/lib/whatsapp/` and recent send logs).

---

## End-to-end timeline

| Phase | Duration | Items | Goal |
|---|---|---|---|
| P0 | Week 1 | 1, 2, 3, 4, 5, 6, 7, 8 | Every 🔴 in audit → 🟢. Re-score: target ~55/100. |
| P1 | Sprints 2–4 (~3 weeks) | 9, 10, 11, 12, 13, 14, 15 | Defense in depth. Re-score: target ~80/100. |
| P2 | Month 2 | 16, 17, 18, 19, 20 | Sustainable posture, regression coverage. Re-score: target ~90/100. |

P0 items are independent — parallelize across the team if more than one person is on it. P1-10 and P1-11 are sequential. P1-14 and P1-15 are sequential. Everything else in P1 can run in parallel.

---

## Verification across the program

After each item:

1. Re-run the relevant Phase-2 probes from `SECURITY_AUDIT.md` (eventually scripted as P2-19).
2. `npm run build` passes.
3. Manual smoke of the affected flow (storefront purchase, admin login, contact form, etc.).

After each phase:

1. Re-score against the same 12-category rubric in `SECURITY_AUDIT.md` Phase-3.
2. Update `SECURITY_AUDIT.md` with the new score and check-marks.
3. Run `npm audit --omit=dev` and `gitleaks detect --source . --log-opts="--all"`.

End state acceptance:

- All 🔴/🟠 from Phase-2 → 🟢.
- `npm audit --omit=dev` clean (or every remaining advisory documented in `SECURITY_EXCEPTIONS.md` with a justification).
- CI gates merges on the above.
- A successful `tests/security/probe.sh` run exists in CI history within the last 24h.

---

## Rollout & rollback

**Branching.** Each item is one PR. Title prefix `sec(P0-1)`, `sec(P1-9)`, etc. for traceability.

**Staging first.** Every item lands in staging and runs ≥24h before promoting to production. Exception: P0-5 (secret rotation) is operational and applied in production directly.

**Rollback.**
- Code-only items (P0-1, P0-2, P0-4, P0-7, P0-8, P1-9, P1-12, P1-13, P1-15, P2-16): revert the commit, redeploy.
- Schema migrations (P0-3, P1-10, P1-11, P2-17): every migration ships with a `down.sql`. Test the down path in staging before applying up in production.
- Secret rotation (P0-5): impossible to truly roll back — the old secret is gone. Mitigation: rotate one provider at a time and verify before moving on.
- NextAuth cutover (P1-14): keep Basic Auth fallback active for one deploy cycle.

**Coordination points.**
- P0-5 + P0-6 must be done together with the team paused (force-push on history scrub).
- P1-10 (RLS) requires a quiet window — apply migrations during off-hours.
- P1-11 (reservations) has a stock-data freeze: ship the migration and reservation logic together; do not ship reservations without the table.

End of plan.
