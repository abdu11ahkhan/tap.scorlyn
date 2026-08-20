# Phase 8 — Security, Authorization, NFC + Production-Readiness Audit

Adversarial audit against the live production database, using real throwaway
accounts and direct requests (bypassing the Next.js app entirely where
relevant — hitting Supabase's REST API and RPCs directly with a session JWT,
exactly as an attacker with "a normal user account" and "ability to modify
requests" would). Every exploit attempt below was actually run, not
reasoned about; every fix was re-verified live after applying it, alongside
the legitimate paths it must not break.

## Security Architecture

```
Anonymous
  ↓ (published=true row visibility only; resolve_nfc_card()/resolve RPCs for narrow lookups)
Authenticated Individual
  ↓ (auth.uid() = user_id on every owner-scoped table)
Corporate Owner
  ↓ (org_owner_id = auth.uid() on card_profiles; own profiles row for house style)
Corporate Employee
  ↓ (owns their own card_profiles row via user_id; no elevated access to siblings)
Admin
  (is_admin(), a SECURITY DEFINER function reading profiles.is_admin,
   used as the backstop in nearly every admin-scoped RLS policy)
```

**The database is the actual enforcement boundary**, not the Next.js app.
Every mutation this audit tested was attempted with a real session JWT
directly against Supabase's REST API — the app's own server actions add
convenience and (in a few places, see findings) defense-in-depth, but RLS
is what ultimately decides whether a write lands. No `middleware.ts` exists
in this project; route "protection" is entirely server-component
`getUser()` checks plus RLS, which is the correct architecture for this
stack (a hidden route or a disabled button was never load-bearing here).

Two intentionally anonymous-callable RPCs exist and were audited
specifically: `resolve_nfc_card(code)` (Phase 7 — resolves a physical tag's
public code to `{nfc_card_id, card_profile_id}` only) and
`username_available`/`company_slug_available` (boolean-only lookups). A
third, `invoice_by_token(token)`, serves the `/i/[token]` public
invoice-sharing route with a fixed, narrow column set.

## P0 Findings

| # | Finding | Status |
|---|---|---|
| 1 | **`nfc_cards` retained a self-service `FOR ALL USING (auth.uid()=user_id)` policy** from before physical-stock issuance became admin-only (schema.sql, never revoked by 004/005_admin_control.sql). `FOR ALL` with no explicit `WITH CHECK` defaults the check to the same clause — which only constrains `user_id`, never `card_profile_id`. **Confirmed live**: Individual A could INSERT a `nfc_cards` row with `user_id = self` but `card_profile_id` pointed at Individual B's real published card, and `resolve_nfc_card()` correctly (and dangerously) resolved the forged code to B's profile — meaning A could inject fabricated NFC-attributed analytics onto any published card, or repoint an existing row via UPDATE the same way. | **Fixed** — migration `046`, self-service policy dropped, replaced with owner SELECT-only (the one legitimate self-service read the dashboard already relies on). Re-verified live: the same forged insert now fails RLS; the legitimate owner-SELECT read and the full NFC redirect→tap-tracking chain both still work end-to-end. |

## P1 Findings

| # | Finding | Status |
|---|---|---|
| 2 | **`card_profiles` INSERT never constrained `org_owner_id`** — `lock_card_ownership()` (040_corporate_accounts.sql) only ran `BEFORE UPDATE`. **Confirmed live**: Individual A could self-insert a card with `org_owner_id` set to an arbitrary corporate account's id, which that corporate owner's own `org_owner_id = auth.uid()` policies would then treat as a real employee card — visible in their team list, editable and deletable by them. A spoofing/pollution path into a company's roster, not a data-exposure one. | **Fixed** — migration `047` extends `lock_card_ownership()` to also run `BEFORE INSERT`, rejecting a non-null `org_owner_id` from anyone but an admin/service-role caller. The legitimate corporate flow (`createEmployee`, service-role, `org_owner_id` stamped server-side from the session) is unaffected — verified live. Re-verified: forged insert now fails; normal card creation (no `org_owner_id`) and legitimate service-role employee creation both still work. |
| 3 | **`orders` UPDATE policy was full-row, not limited to the field it was designed for.** The policy's own comment states the intent — "attaching a proof is the ONE field a customer may change" — but RLS is row-level, not column-level, and (unlike `profiles`, protected since migration 014) nothing ever enforced that. **Confirmed live**: a customer could rewrite `amount_pkr`, `quantity`, `internal_note`, `flagged`, and more on their own pending order — including the price, before uploading payment proof. | **Fixed** — migration `047` adds `protect_order_columns()`, pinning every column except `payment_proof_url` back to `OLD` for any non-admin/non-service-role UPDATE. Re-verified live: the same tamper attempt is now silently reverted; attaching a real payment proof still works. |
| 4 | `orders/actions.ts`'s `reorder`/`attachPaymentProof` had no application-level ownership check — correct behavior was already fully guaranteed by RLS alone (confirmed: cross-user reads/writes were blocked in every live test), but a single point of failure with no defense-in-depth, unlike the corporate `ownedEmployeeCard()` pattern used elsewhere in this codebase. `attachPaymentProof` also silently returned `{ok:true}` even when the RLS-guarded update matched zero rows. | **Fixed** as a low-risk hardening — added explicit `.eq("user_id", user.id)` to both queries, and `attachPaymentProof` now checks the update actually affected a row before reporting success. |

## P2 Findings

| # | Finding | Recommendation | Status |
|---|---|---|---|
| 5 | Six `SECURITY DEFINER` functions predating migration 010 never pinned `SET search_path` (`is_admin`, `delete_own_account`, `handle_new_user`, `bump_view_count`, `log_order_status`, `sync_card_referral_code`). All internal statements are already schema-qualified, limiting real exploitability today, but this is the textbook setup for a search-path-hijack privilege escalation if any future edit ever adds an unqualified statement. | Pin `search_path` explicitly, matching every function added since 010. | **Fixed** — migration `048`, verbatim bodies preserved (each verified against its original migration source before being re-created), only the `SET search_path = public` clause added. No behavior change. |
| 6 | No security headers configured anywhere (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` all absent; no `middleware.ts`). | Add the headers that are safe regardless of any third-party asset this app uses — verified against the app's actual embed surface (YouTube/Vimeo/TikTok iframes in `ProfileExtras`, same-origin editor/template-gallery iframes, file-input-only card scanner with no camera API usage anywhere in the codebase). | **Fixed** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Verified live: headers present on every route; same-origin iframe previews (editor live preview, template gallery thumbnails) still render correctly. A full Content-Security-Policy was deliberately **not** attempted — getting its allowlist wrong for three video-embed providers, Google OAuth, and Supabase would fail silently rather than loudly; documented as a P3 recommendation for a dedicated future pass instead. |
| 7 | The referral-code and "next" cookies (`RefCatcher.tsx`, `signup/page.tsx`) were missing the `Secure` flag. Low severity — `SameSite=Lax` was already set, and the value is a non-sensitive referral code, not a session token — but a one-line fix with zero functional risk. | Add `Secure` when the page is actually on `https:` (conditionally, so local `http://localhost` dev is unaffected). | **Fixed.** |
| 8 | `/api/scan-card` has no authentication at all and is an unauthenticated, unrate-limited proxy to a paid Anthropic API endpoint. This is confirmed **intentional** — the OCR "scan a business card to start a digital one" feature is deliberately usable pre-signup, matching this product's "edit first, sign in only to publish" design. The gap is volume abuse (repeated calls burning API credits), not authorization. | Real rate limiting needs infrastructure this phase shouldn't add speculatively (a Redis-backed limiter, or Vercel/Cloudflare edge rate limiting) — the existing image-size/count clamp already bounds worst-case cost *per request*. Documented for a future phase rather than built now. | **Not fixed** — deliberately deferred, per the brief's own "do not introduce aggressive rate limiting blindly." |
| 9 | `next_invoice_number()` is `GRANT EXECUTE`'d to `authenticated`, not admin-only — `invoices` itself is fully admin-gated, so impact is limited to gaps/skew in the shared sequence, not data exposure. | Low priority; would need to move invoice creation to a service-role-only path to tighten further, a larger change than this finding justifies. | **Not fixed** — documented only. |

## P3 — Documented, Not Fixed

- A **live/migration-file drift** was discovered and could not be fully
  root-caused within this phase's timebox: `referral_events`' committed
  migration states `WITH CHECK (true)` on INSERT, and `card_taps`' INSERT
  policy (as committed) has no `event_type` awareness at all — yet direct,
  unauthenticated REST/RPC attempts against both were consistently
  **rejected** in live testing (`42501`, a genuine Postgres RLS violation),
  while the real `/api/tap` and application flows continued to succeed
  through the same tables with the same anon key. Ruled out during
  investigation: a stale/rotated anon key (the key was decoded and verified
  valid, and known-open tables like `plans`/`faqs` read correctly with it);
  a stale dev-server process (killed and restarted fresh, behavior
  unchanged); a `@supabase/supabase-js` vs `@supabase/ssr` client
  difference (both tested directly, both rejected); Supabase's anonymous-
  auth-session feature (confirmed disabled on this project). The practical,
  security-relevant outcome is unambiguous and in the safe direction —
  forged/direct writes are rejected — but the *mechanism* enforcing that
  beyond what the committed migration files describe is not something this
  audit could pin down with certainty, meaning **the migration files can no
  longer be assumed to fully describe the live schema's RLS state** for
  every table. Recommend a follow-up with direct `psql`/dashboard access to
  dump `pg_policies` and reconcile it against the migration history
  properly.
- A full Content-Security-Policy (see P2 #6).
- Rate limiting on `/api/scan-card` and, more generally, `/api/tap`/
  `/api/referral` (both already anonymous-by-design and already validate
  their inputs server-side, but neither has volume limits — spam would
  distort analytics/referral counts, not grant unauthorized access).

## RLS Matrix (resource × role, current state after this phase's fixes)

| Resource | Anonymous | Individual (own) | Individual (other's) | Corporate Owner (own company) | Corporate Owner (other company) | Admin |
|---|---|---|---|---|---|---|
| `card_profiles` (published) | Read | Read/Write | Read only | Read/Write (own employees) | No access | Read/Write |
| `card_profiles` (unpublished) | No access | Read/Write | No access | Read/Write (own employees) | No access | Read/Write |
| `nfc_cards` | No table access (only via `resolve_nfc_card` RPC, narrow return) | Read (own) | No access | No access beyond own | No access | Full |
| `card_taps` | Insert only (own published card, via app validation) | Read (own cards) | No access | Read (own employees' cards) | No access | Read all |
| `orders` | No access | Read/Insert (own); Update limited to `payment_proof_url` on own pending orders | No access | No access to individual employee's personal orders | No access | Full |
| `referral_events` | Insert (app-validated); live behavior stricter than committed policy, see P3 | Read (own, as referrer) | No access | Same as individual | Same | Read all |
| `profiles` | No access | Read/Update (own; `id`/`is_admin`/`suspended`/`referral_code` pinned) | No access | Same as individual for own row | No access | Full |
| `invoices` | Read via `invoice_by_token()` RPC only (narrow columns) | No table access | No access | No access | No access | Full |
| `notifications`, `admin_audit`, `email_campaigns`, `deleted_accounts`, `admin_impersonations` | No access | No access | No access | No access | No access | Full |
| `plans`, `template_settings`, `app_settings`, `faqs` (published), `shop_payment_methods` (enabled) | Read | Read | Read | Read | Read | Full |

## NFC Security

- **Resolution**: `resolve_nfc_card(code)` — `SECURITY DEFINER`, `SET
  search_path = public`, returns exactly `{nfc_card_id, card_profile_id}`
  for one `card_url` at a time. Confirmed live: leaks no `batch`/`note`/
  `user_id`; nonexistent, malformed, SQL-injection-shaped, and
  wrong-type inputs all return an empty result set safely (parameterized —
  no injection surface).
- **Assignment**: entirely admin-driven (`issueNfcCards`/`assignNfcCard` in
  `admin/actions.ts`), now that the self-service RLS gap (P0 #1) is closed.
- **Anonymity**: a physical tap is always anonymous by design; the redirect
  and the resulting tap event both work correctly for a truly anonymous
  visitor, confirmed live end-to-end after every fix in this phase.
- **Enumeration resistance**: `card_url` is an 8-character random code from
  a 33-character alphabet (~1.4 trillion combinations, no sequential
  component) — not practically guessable. `resolve_nfc_card` returns
  nothing for an unknown code rather than a distinguishable error, so a
  brute-force attempt gets no signal beyond a uniform empty response.
- **Lifecycle**: unassigned → assigned → reassigned → deleted are all
  admin-only mutations now (P0 fix); a deleted or reassigned card's old
  code simply resolves to nothing or to its new owner, deterministically.

## Analytics Security

- **Event ingestion**: all through `/api/tap`, which re-resolves and
  ownership-validates any claimed `nfcCode` server-side (a client can only
  ever hand back a code, never fabricate a foreign `nfc_card_id` directly —
  confirmed live in Phase 7 and re-confirmed this phase).
- **Attribution**: `event_type`/`target` are both server-validated against
  fixed allowlists (a `CHECK` constraint for `event_type`, a length-capped
  free-text field for `target`).
- **Deduplication**: page views are session-deduped client-side
  (`TapTracker`); outbound clicks have an 800ms same-target debounce
  (`OutboundClickTracker`) — both were re-confirmed working in Phase 7's
  own live tests, unchanged this phase.
- **Forgery resistance**: direct, unauthenticated attempts to insert
  `card_taps`/`referral_events` rows bypassing the app entirely were
  consistently rejected in this phase's live testing (see P3 for the
  open question about exactly which enforcement layer is responsible).

## Authentication

Tested: signup, login, logout, `auth/callback` (Google OAuth PKCE exchange)
and `auth/confirm` (email OTP) both validate their `next` redirect target
against `safeNext()` before honoring it — no open-redirect found. No
`middleware.ts` exists; every protected page relies on a server-side
`getUser()` check plus RLS as the real backstop, confirmed correct in every
live cross-user/cross-corporate test this phase ran (13 direct-access
attempts, all correctly blocked). Direct navigation to a protected route
with no session correctly finds no data to render rather than exposing
anything — verified for `/dashboard` family routes' underlying RLS-scoped
queries.

## Secrets

**No committed secret values found**, in tracked files or in git history
(`.env.local` is gitignored and untracked; a full-history pickaxe search for
JWT/key/token patterns across all commits returned zero results). One
`SUPABASE_ACCESS_TOKEN` was supplied directly in chat during Phase 7 to
authorize the CLI for two production migrations, and again this phase for
migrations 046-048 — **this token should be revoked/rotated now that this
phase is complete**, since it was used interactively rather than stored as
a durable credential.

## Test Results

| Test | Result |
|---|---|
| Individual A reads/updates/deletes Individual B's `card_profiles` by id substitution | PASS (blocked) |
| Individual A reads Individual B's `nfc_cards`/`orders` | PASS (blocked) |
| Employee A reads Corp B's employee cards via `org_owner_id` filter | PASS (blocked) |
| Corp Owner B updates Corp A's employee card by id substitution | PASS (blocked) |
| Individual A self-inserts `nfc_cards` row pointing at B's profile | **FAIL → FIXED** (P0 #1) |
| Individual A repoints their own `nfc_cards` row via UPDATE | **FAIL → FIXED** (P0 #1) |
| Anonymous `resolve_nfc_card` leaks batch/note/user_id | PASS (no leak) |
| `resolve_nfc_card` with nonexistent/malformed/SQLi-shaped input | PASS (safe empty result) |
| Individual A inserts `card_profiles` with forged `org_owner_id` | **FAIL → FIXED** (P1 #2) |
| Individual A tampers with `amount_pkr`/`internal_note` on own order | **FAIL → FIXED** (P1 #3) |
| Anonymous forges `referral_events`/`card_taps` rows directly | PASS (blocked; mechanism not fully understood, see P3) |
| Non-admin reads `notifications`/`admin_audit`/`invoices`/`email_campaigns`/`deleted_accounts`/`admin_impersonations` | PASS (blocked, all 6) |
| Non-admin's `is_admin()` returns false | PASS |
| Anonymous reads an unpublished `card_profiles` row (table + `/u/[username]` + `/api/vcard/[username]`) | PASS (blocked, all 3 surfaces) |
| Malformed usernames (5000 chars, script tag, SQL-injection-shaped) against `/u/[username]` | PASS (404, no 500, no reflection) |
| Post-fix: owner can still SELECT their own `nfc_cards` | PASS (preserved) |
| Post-fix: individual can still create a normal card (no `org_owner_id`) | PASS (preserved) |
| Post-fix: legitimate corporate `createEmployee` (service-role, real `org_owner_id`) | PASS (preserved) |
| Post-fix: customer can still attach `payment_proof_url` to their own pending order | PASS (preserved) |
| Post-fix: full NFC redirect → `/api/tap` → correct `nfc_card_id` attribution, end-to-end | PASS (preserved) |
| Security headers present on every route; same-origin iframe previews unaffected | PASS |
| `tsc --noEmit`, `eslint`, `next build` | PASS, clean after every commit |

## Remaining Risk

- The migration-file/live-schema drift documented in P3 means this audit's
  RLS Matrix, while verified against **live behavior** wherever this phase
  could test it directly, cannot be certified as matching the **committed
  migration files** for every table — a future pass with direct database
  access (not just the anon/service-role REST surface) should reconcile
  `pg_policies` against the migration history properly.
- `/api/scan-card`'s volume-abuse exposure (P2 #8) is real but explicitly
  deferred; if API costs from this endpoint are ever observed to spike,
  that's the first place to look.
- No full CSP exists. The four headers added this phase cover clickjacking,
  MIME-sniffing, referrer leakage, and unused browser permissions, but not
  script-injection defense-in-depth that a proper CSP would add.
- This audit tested the RLS/API/RPC surface exhaustively but did not attempt
  session-fixation, CSRF-token, or timing-attack-class exploits against
  Supabase Auth itself (out of scope — that surface is Supabase's own
  infrastructure, not this codebase's).
