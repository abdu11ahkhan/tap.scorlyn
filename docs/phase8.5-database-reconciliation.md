# Phase 8.5 — Production Database State Reconciliation

## Executive Summary

Direct database introspection (via the Supabase Management API's SQL
endpoint, executing real queries against `pg_policy`, `pg_policies`,
`pg_proc`, `pg_default_acl`, `information_schema` — not application-behavior
inference) confirms: **the live production database's RLS policies,
triggers, and function bodies match the committed migration repository
exactly, for every table and function checked.** No policy drift exists.

The Phase 8 "anomaly" — direct writes to `referral_events`/`card_taps`
being rejected in ways that seemed to contradict the committed
`WITH CHECK (true)` — is now fully explained and was **never a security
issue or migration drift**. It was an artifact of the Phase 8 test
scripts' own methodology: every test chained `.select()` after `.insert()`,
which Supabase's client translates to `Prefer: return=representation`,
requiring the row to also satisfy a **SELECT** policy immediately after
insert. Neither table grants anon a SELECT policy on rows they didn't
already own (`card_taps`' own migration comment literally says "write-only
append" — this is intentional, deliberate design, not a bug). Postgres
reports that SELECT-on-RETURNING failure with the exact same wording as a
`WITH CHECK` failure ("new row violates row-level security policy for
table X"), which made it indistinguishable from a real INSERT-policy
rejection without directly testing at the SQL level. Confirmed
conclusively: the identical insert, issued without requesting the row
back, succeeds instantly as `anon` — and this is exactly what the real
`/api/tap` route has always done (it never calls `.select()` after its
insert), which is why the actual application was never affected.

One genuine, previously-undiscovered, low-severity drift **was** found
during this reconciliation — not in RLS policies, but in function-level
**grants** — and is now fixed (migration `049`).

## Live Database State

Retrieved via direct SQL against the linked production project
(`blabmleiezggwyxseoay`), executed through the Supabase Management API
(`POST /v1/projects/{ref}/database/query`) using the access token supplied
for this work — genuine `pg_catalog`/`information_schema` introspection,
not PostgREST behavior inference.

- **48 RLS policies** across all `public` schema tables with RLS enabled.
- **21 `SECURITY DEFINER` functions**, every one now showing
  `search_path=public` pinned (confirms Phase 8's migration `048` landed).
- **23 triggers**, including `card_profiles_lock_ownership` now firing on
  both `INSERT` and `UPDATE` (confirms Phase 8's migration `047`), and
  `orders_protect_columns` present on `orders` (same migration).
- `nfc_cards`' policy set is exactly `{Owners can view their own NFC
  cards. (SELECT), Admins can view/issue/reassign/delete NFC cards.}` —
  confirms Phase 8's migration `046` (the P0 fix) is live and the
  vestigial self-service write policy is gone.
- `pg_default_acl` confirms Supabase's own platform-level default
  privileges: every function created by the `postgres` role automatically
  receives `EXECUTE` granted **directly** to `anon`, `authenticated`, and
  `service_role` (not via the `PUBLIC` pseudo-role) — this is Supabase
  project bootstrapping, not anything in this repo's migration history.

## Repository Migration State

49 migration files (`001` through `049`, the last created this phase),
read in full, in order. Every `CREATE POLICY`, `CREATE TRIGGER`, and
`CREATE OR REPLACE FUNCTION` statement across all 49 files was
cross-referenced against the live introspection above.

## Migration Drift

| Area | Repository says | Production has | Classification |
|---|---|---|---|
| `nfc_cards` RLS policies | (post-046) owner SELECT + admin CRUD | Exact match | **SAFE** (no drift) |
| `card_profiles` RLS policies + triggers | (post-047) `lock_card_ownership` on INSERT+UPDATE | Exact match | **SAFE** |
| `orders` RLS policies + triggers | (post-047) `protect_order_columns` on UPDATE | Exact match | **SAFE** |
| `card_taps` RLS policies | `WITH CHECK` requires published card only | Exact match | **SAFE** (see investigation below) |
| `referral_events` RLS policies | `WITH CHECK (true)` on INSERT | Exact match | **SAFE** (see investigation below) |
| `profiles` RLS policies | owner + admin, column-pinning trigger | Exact match | **SAFE** |
| All 21 `SECURITY DEFINER` function bodies | as committed | Byte-identical (verified via `pg_get_functiondef`) | **SAFE** |
| `is_admin()`, `delete_own_account()`, `next_invoice_number()` **grants** | intended: `authenticated` only (each migration does `REVOKE ALL FROM PUBLIC` first) | `anon` also had `EXECUTE`, via Supabase's default-ACL mechanism, which `REVOKE ... FROM PUBLIC` does not touch | **REQUIRED MIGRATION** — fixed, `049` |
| `resolve_nfc_card()` grant | intended: `anon, authenticated` (achieved) | Also carried a redundant leftover `PUBLIC` grant (migration `045` never revoked it first, unlike every sibling RPC) | **REQUIRED MIGRATION** (cosmetic/consistency, not a security gap — intended audience already covered) — fixed, `049` |

No other drift was found across any table or function this phase could
introspect. Provenance of the one real drift item: **Supabase's own
platform-level `ALTER DEFAULT PRIVILEGES`**, confirmed directly via
`pg_default_acl` (not `UNKNOWN` — the mechanism and its owner role,
`postgres`, are both directly visible in the catalog).

## `referral_events` Investigation

**Repository state**: `WITH CHECK (true)` on INSERT, unconditional
(`001_card_profiles_and_referrals.sql:177-179`).

**Production state**: identical — confirmed via `pg_get_expr(pol.polwithcheck,
pol.polrelid)`, returning the literal string `true`.

**Which rule actually causes rejection when it happens**: none, for a plain
INSERT. The rejection Phase 8 observed only occurs when the request also
asks Postgres to return the inserted row (`Prefer: return=representation`,
i.e. calling `.select()` after `.insert()` in the JS client). That
additional read is governed by `referral_events`' SELECT policies —
`"Referrers can read their own referral events." USING (auth.uid() =
referrer_user_id)` and `"Admins can view all referral events." USING
(is_admin())` — neither of which an anonymous caller (`auth.uid()` is
`NULL`) can ever satisfy. Postgres reports that as the same "new row
violates row-level security policy" error text as a `WITH CHECK` failure.
**Confirmed by direct SQL**: the identical insert, run as `anon` via `SET
ROLE anon`, succeeds and the row lands in the table — when issued without
a `RETURNING` clause. With `RETURNING id` appended, it fails with the
exact error text Phase 8 recorded. The real `/api/referral` route never
requests the row back, so it was never affected.

## `card_taps` Investigation

Identical mechanism and identical proof, run independently: **repository**
`WITH CHECK (EXISTS (SELECT 1 FROM card_profiles cp WHERE cp.id =
card_profile_id AND cp.published = true))`, confirmed **byte-identical in
production**. The bare `EXISTS(...)` condition, evaluated standalone as
`anon`, returns `true` for a real published card. A plain `INSERT ...`
(no `RETURNING`) as `anon` succeeds and the row is verifiable afterward
via an admin-role read. The same insert with `RETURNING id` fails, for the
same reason as above: `card_taps`' only SELECT policies are "owner reads
their own" (via a join back to `card_profiles.user_id = auth.uid()`) and
"admin reads all" — an anonymous inserter satisfies neither, by design
(the table's own migration comment: "they can never read taps back, so
this only exposes write-only append"). The real `/api/tap` route's insert
call has never chained `.select()`.

## `SECURITY DEFINER` Audit

All 21 functions, full detail (name, args, return type, `search_path`,
grants, tables touched, RLS-bypass status) captured via direct
`pg_get_functiondef`/`information_schema.routine_privileges` queries.
Summary:

- **19 of 21** have grants that exactly match their migration's stated
  intent.
- **`resolve_nfc_card(code text)`**: `RETURNS TABLE(nfc_card_id uuid,
  card_profile_id uuid)`, `STABLE SECURITY DEFINER SET search_path =
  public`. Reads only `nfc_cards` (bypassing its RLS, by design — that's
  the entire point of the function). Accepts one user-controlled
  argument, `code` (a plain string, used only in a parameterized `WHERE
  card_url = code` — confirmed injection-safe with SQL-injection-shaped,
  wrong-type, and null inputs, all returning an empty result set rather
  than an error or unintended data). Returns only the two columns an
  anonymous NFC redirect needs — never `batch`, `note`, `user_id`, or any
  other column. Grant: `anon, authenticated` (now cleaned of the redundant
  `PUBLIC` leftover, migration `049`).
- **`is_admin()`, `delete_own_account()`, `next_invoice_number()`**: grant
  drift found and fixed (migration `049`), detailed above. None were
  exploitable even before the fix — each function's own body independently
  guards against anonymous misuse — but the live grant no longer matches
  every migration's explicit `REVOKE ALL FROM PUBLIC` intent, now
  corrected with an explicit `REVOKE ... FROM PUBLIC, anon`.

## RLS Matrix

| Resource | Anonymous | Individual | Employee | Org Owner | Admin |
|---|---|---|---|---|---|
| `card_profiles` (published) | SELECT | SELECT/INSERT/UPDATE/DELETE (own) | SELECT/INSERT/UPDATE/DELETE (own) | SELECT/UPDATE/DELETE (employees, `org_owner_id`); INSERT locked to own via `lock_card_ownership` | Full |
| `card_profiles` (unpublished) | — | SELECT/INSERT/UPDATE/DELETE (own) | Same | Same | Full |
| `profiles` | — | SELECT/UPDATE (own; `id`/`is_admin`/`suspended`/`referral_code` pinned) | Same | Same | Full |
| `nfc_cards` | — (only via `resolve_nfc_card` RPC, 2 columns) | SELECT (own) | Same | — beyond own | Full (issue/assign/reassign/delete) |
| `orders` | — | SELECT/INSERT (own); UPDATE limited to `payment_proof_url` (own, pending, via `protect_order_columns`) | Same | — beyond own personal orders | Full |
| `card_taps` | INSERT only (published card, write-only — no read-back) | SELECT (own cards) | Same | SELECT (employees' cards) | SELECT all |
| `referral_events` | INSERT only (write-only — no read-back) | SELECT (own, as referrer) | Same | Same | SELECT all |
| Organizations (via `profiles.company_slug`/`account_type`) | — | — | Read own via `profiles` self-row | Read/update own via `profiles` self-row | Full |
| Team membership (`card_profiles.org_owner_id`) | — | — | Is the membership signal itself | SELECT/UPDATE/DELETE employees | Full |
| Analytics (aggregate) | — | Own cards only | Own cards only | Own employees' cards | All |

## Reconciliation Migrations

Only one was needed: `049_reconcile_function_grants.sql` — narrowly
scoped, idempotent (`REVOKE`/`GRANT` are both safe to re-run regardless of
prior state), no destructive changes, full rationale in the migration's
own comments. Applied to production and verified live: `anon` now gets
`permission denied for function` (a genuinely different Postgres error
class than the RLS wording, independently confirming these are two
distinct mechanisms) for all three tightened functions;
`resolve_nfc_card` continues to work correctly for `anon`.

No migration was needed for `referral_events`/`card_taps` — there was
nothing to reconcile; repository and production already matched exactly.

## Test Migrations

**No local/staging Supabase instance is available in this environment**
(the CLI's `db dump`/local-diff commands require Docker Desktop, confirmed
absent — `db push --linked` against the real production project is this
environment's only working path). Migration `049` was therefore verified
the same way every migration this session has been: applied directly to
the linked production project, then its effect verified via direct SQL
re-introspection (shown above) and a live functional test (`anon` blocked
from the three tightened functions, `resolve_nfc_card` unaffected). This
is **not** the same guarantee as a clean-database replay proving the full
49-migration sequence reproduces production from scratch — that remains
unverified and is called out explicitly in Remaining Unknowns.

## Security Regression Tests

All re-run live this phase, verified against admin-role ground truth
(not just the acting client's own response, which — per the
investigation above — can itself be misleading for write-only-append
tables):

| Test | Result |
|---|---|
| Public card view, all 9 event types (`view` through `booking_click`), NFC tap redirect + attribution, referral attribution — all via real HTTP against the running app | **20/20 PASS** |
| Anonymous cannot create an `nfc_cards` row (ground-truth checked via admin read) | PASS |
| Individual A cannot forge an `nfc_cards` row pointing at B's profile | PASS |
| Individual A cannot modify B's order (`amount_pkr` unchanged) | PASS |
| Individual A cannot modify B's card (`full_name` unchanged) | PASS |
| Corporate Owner B cannot modify Corporate Owner A's employee's card | PASS |

## Remaining Unknowns

- **No clean-environment migration replay was performed** (Docker
  unavailable). The 49-migration sequence's ability to reproduce
  production from an empty database is asserted by careful reading and
  by production itself matching every migration's stated intent, but was
  not mechanically verified end-to-end.
- This reconciliation covered every table this phase's scope named
  explicitly (`nfc_cards`, `card_profiles`, `card_taps`, `referral_events`,
  `orders`, `profiles`) plus every `SECURITY DEFINER` function in the
  schema. Tables entirely outside this phase's stated scope (e.g.
  `shop_payment_methods`, `email_campaigns`, `faqs`) were not
  re-introspected this phase — Phase 8's static reading of their
  migrations is the only evidence for their current state.

## Final Risk Assessment

**Production database state and the migration repository are now
confirmed to match**, for every resource this phase's scope covers, via
direct catalog introspection rather than inference. The one real
discrepancy found (function grants, not RLS policies) was low-severity,
already independently mitigated by each function's own body, and is now
fixed and re-verified. The apparent `referral_events`/`card_taps`
"discrepancy" that motivated this entire phase is fully resolved: it was
never a live-vs-repository mismatch, only a test-methodology artifact that
happened to produce an identically-worded Postgres error to a genuine
policy violation. No security regression was introduced; all legitimate
application paths (analytics, NFC attribution, referral attribution,
cross-user/cross-corporate isolation) remain verified working.
