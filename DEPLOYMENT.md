# Going live — Supabase + Vercel

Everything below is required. Nothing in the app has been run against a real
database yet, so step 2 is the one that turns a demo into a product.

---

## 0. Before anything: rotate the leaked password

`dbpass.txt` and `Ayyan2013#.txt` are committed to the public GitHub repo. That
password is compromised — assume it is known.

1. Supabase dashboard → **Project Settings → Database → Reset database password**.
2. Delete both files and purge them from git history (a plain `git rm` leaves
   them in every previous commit):
   ```bash
   git rm dbpass.txt "Ayyan2013#.txt"
   pip install git-filter-repo
   git filter-repo --path dbpass.txt --path "Ayyan2013#.txt" --invert-paths
   git push --force
   ```
3. Anyone who cloned the repo before this still has the old value. Rotating in
   step 1 is what actually protects you; the history purge is cleanup.

---

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → **New project**. Pick the region
   closest to your users — for Pakistan, **Singapore (ap-southeast-1)** has the
   lowest latency of the available regions.
2. Save the database password somewhere real (a password manager, not a text
   file in the repo).

---

## 2. Apply the schema

In the Supabase dashboard → **SQL Editor**, run these **in order**. Each one
depends on the last:

| Order | File | What it adds |
|---|---|---|
| 1 | `supabase/schema.sql` | profiles, websites, assets, nfc_cards + RLS |
| 2 | `supabase/migrations/001_card_profiles_and_referrals.sql` | card_profiles, card_taps, referral_events, referral codes |
| 3 | `supabase/migrations/002_card_templates.sql` | template, buttons, font |
| 4 | `supabase/migrations/003_card_images.sql` | cover_url, cover_mode, gallery |
| 5 | `supabase/migrations/004_admin.sql` | is_admin, suspended, admin RLS policies |

Confirm it worked — this should return 21 rows of policies:

```sql
select tablename, policyname from pg_policies
where schemaname = 'public' order by tablename;
```

### Auth settings

**Authentication → Providers → Email**:

- **Confirm email** — ON for production. The signup flow already handles both
  states; with it OFF anyone can register any address.
- **Site URL** — `https://yourdomain.com`
- **Redirect URLs** — add `https://yourdomain.com/**` and, for local work,
  `http://localhost:3000/**`

---

## 3. Deploy to Vercel

1. Push to GitHub, then [vercel.com](https://vercel.com) → **Add New → Project**
   → import the repo. Vercel detects Next.js; no build settings to change.
2. Add environment variables (**Settings → Environment Variables**), for all
   three environments:

   | Name | Where to find it | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key | Public by design; RLS is what protects data |
   | `TAP_HASH_SALT` | Generate: `openssl rand -hex 32` | **Server-only — no `NEXT_PUBLIC_` prefix.** Salts the visitor hash for tap analytics |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | **Server-only — no `NEXT_PUBLIC_` prefix, ever.** Required by `/api/tap`, `/api/referral`, `/api/review-feedback` and the NFC redirect's tap recording (`src/lib/rate-limit.ts`'s `serviceClient()`), and by migration 070 below. Must never be exposed to client code or carry a `NEXT_PUBLIC_` prefix — on Vercel that prefix is what ships a variable into the browser bundle, and this key bypasses RLS entirely. |

   This key did not exist in earlier versions of this app and earlier guidance
   here said never to add it — that guidance is gone. The write paths above
   now depend on it being present *before* migration 070 runs (see below).

3. Deploy.

### Custom domain

**Vercel → Settings → Domains** → add your domain, then point DNS at Vercel
(`A → 76.76.21.21`, or `CNAME → cname.vercel-dns.com`). SSL is automatic.

Then go back and update the Supabase **Site URL** and **Redirect URLs** to the
real domain, or email confirmation links will point at the wrong host.

---

## 3a. Rate limiting and server-only writes (migrations 069, 070)

Two migrations in `supabase/migrations/` are not yet part of the numbered
schema walkthrough in section 2, because they depend on the application code
above already being live, not just on the database:

- **069 — `supabase/migrations/069_rate_limit_cooldown.sql`.** Additive only:
  one index, one new `claim_cooldown()` function (service_role only). Nothing
  reads or writes depend on this existing — `src/lib/rate-limit.ts` falls back
  to an older, slightly less exact cooldown if it's absent. Safe to run at any
  time, before or after the app is deployed, and safe to rerun.
- **070 — `supabase/migrations/070_server_only_public_writes.sql`.** Not
  additive: it removes the anonymous database policies that used to let
  anyone holding the public anon key write directly to `card_taps` and
  `referral_events`, and revokes anonymous/authenticated EXECUTE on
  `submit_review_feedback()`. After this runs, the **only** way to write any
  of those is through `/api/tap`, `/api/referral` and `/api/review-feedback`
  using the `SUPABASE_SERVICE_ROLE_KEY` above. **If that key is not set when
  this migration is applied, tap recording, referral events and review
  feedback all stop working — silently, with no error visible to a visitor.**

**Safe order:**

1. Deploy the current application code (it already writes through the
   service-role client with a graceful fallback, so it works whether or not
   070 has been run yet).
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel for the environment
   you're deploying (Production and/or Preview).
3. **Verify the critical write paths before touching any migration:**
   - Tap a real card (or open a profile with `?src=qr`) and confirm the tap
     shows up in `/dashboard/analytics` for that card.
   - Submit a piece of review feedback on a Review card and confirm it
     appears on the card's private feedback link / in the dashboard.
   - Trigger a referral event (open a card with a referral link) and confirm
     it's recorded for the referring account.
   - Check your Vercel function logs for `/api/tap` and `/api/review-feedback`
     around these actions — there should be **no** `SUPABASE_SERVICE_ROLE_KEY
     is not set` message from `serviceClient()`.
4. Apply migration 069 (low risk, can be done any time relative to the steps
   above).
5. Apply migration 070 **only once step 3 has passed.**
6. Immediately repeat the three checks in step 3. All three must still work
   exactly as before.

**If any check in step 3 or step 6 fails:** stop. Do not rerun the migration
and do not attempt a rollback of production objects as a first response — a
failed check after 070 most likely means the service-role key isn't actually
reaching the deployed functions (wrong environment, typo, redeploy needed to
pick up a newly-added env var) rather than a problem with the migration
itself. Re-check the environment variable and the deployment that's actually
serving traffic, fix that, and only then re-run the same three checks — do
not move on, and do not apply any further migrations, until they pass.

---

## 4. Make yourself an admin

Sign up through the live site first so the row exists, then in the SQL Editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

`/admin` is then reachable. Non-admins get a polite wall, and the RLS policies
refuse the data regardless — the page check is convenience, not the security
boundary.

---

## 5. Writing the physical NFC cards

Each card needs one URL written to it. With NFC Tools on Android, or your PN532:

```
https://yourdomain.com/api/nfc/<card_url>
```

`<card_url>` is the value in `nfc_cards.card_url`. That endpoint looks up the
card and redirects to the owner's profile, which means **you can reassign a
physical card to a different profile later without rewriting the chip.**

Write the tag as **read-only / locked** once verified. An unlocked NTAG can be
overwritten by anyone who taps it with a writer app — including pointing your
customer's card at a site you don't control.

NTAG213 (144 bytes) is enough for a URL. NTAG215/216 only matter if you later
want to store more on the chip itself.

---

## What is *not* wired up yet

Be aware before you sell anything:

- **Payments.** Stripe is in `package.json` but there is no checkout, no webhook,
  no orders table. The pricing section's buttons link to `/templates`. Taking
  money needs: an orders table, a checkout route, and a webhook to mark orders
  paid. EasyPaisa/JazzCash need a registered merchant account and their APIs are
  not public-sandbox friendly — budget real time for that.
- **Image uploads.** The editor takes image *URLs*. Real uploads need a Supabase
  Storage bucket, an upload policy, and a file picker in the editor.
- **The contact forms** in the Reply and Booking templates submit via `mailto:`,
  which opens the visitor's email client. That works without a backend but is
  not a real form pipeline.
- **Email sending.** Supabase's built-in SMTP is rate-limited and not for
  production volume. Add a custom SMTP provider (Resend, Postmark) under
  **Authentication → Email Templates → SMTP Settings**.

---

## Costs

| | Free tier | When you outgrow it |
|---|---|---|
| Vercel | Hobby — fine for launch. **Commercial use requires Pro.** | $20/mo |
| Supabase | 500MB database, 50k monthly active users | $25/mo |
| Domain | — | ~$10–15/yr |

Vercel's Hobby plan forbids commercial use. The moment you charge for a card,
you need Pro.

---

## Quick checklist

- [ ] Database password rotated — confirm this yourself in the Supabase
      dashboard; nothing in this repo's history state proves it either way
- [ ] All 5 SQL files run in order
- [ ] Email confirmation ON, Site URL + Redirect URLs set to the real domain
- [ ] Four env vars set on Vercel (`TAP_HASH_SALT` and
      `SUPABASE_SERVICE_ROLE_KEY` **without** `NEXT_PUBLIC_`)
- [ ] Custom domain live with SSL
- [ ] `is_admin` set on your account
- [ ] One NFC card written, tapped with a real phone, and locked
- [ ] Tap appears in `/dashboard/analytics`
- [ ] Migration 069 applied (any time)
- [ ] Migration 070 applied — only after the step 3 checks in section 3a pass,
      and re-checked immediately after (section 3a)
