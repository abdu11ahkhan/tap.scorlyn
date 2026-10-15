# Tests

Two suites. Neither needs a new dependency, and neither writes to any database.

| Command | What it runs | Needs |
|---|---|---|
| `npm run test:unit` (also `npm test`) | Logic and API-route tests with Node's built-in test runner | Node 24+ only |
| `npm run test:smoke` | Read-only browser checks against a running server | A running build (see below) |
| `npm run test:smoke:update` | Same, but rewrites the screenshot baselines | A running build |

## Unit tests — `tests/unit/`

Node 24 runs the TypeScript files directly. `tests/register.mjs` adds the
project's `@/…` path alias and extension-less imports (`tests/alias-hooks.mjs`);
`--experimental-test-module-mocks` lets the route tests swap Supabase, the
mailer and `next/server`'s `after()` for in-memory fakes (`tests/unit/fakes.ts`).

| File | Covers |
|---|---|
| `nfc-route.test.ts` | Every branch of the NFC/QR router: unknown, inactive, claimable, held-back, assigned, one-link; `src=nfc/qr` and untagged (`card`) attribution; URL encoding |
| `activation.test.ts` | Every activation-page state; valid, incomplete and invalid code formats |
| `vcard.test.ts` | Every phone, WhatsApp and email number reaches the vCard; grouping on screen doesn't change what's saved |
| `number-grouping.test.ts` | The "which number?" picker grouping |
| `api-limits.test.ts` | The real `/api/tap`, `/api/review-feedback`, `/api/referral` and `/api/nfc/[cardId]` handlers: per-visitor and per-IP limits (and that there is no per-card lockout), header spoofing, the feedback email cooldown (feedback still saved; per card; count of the last hour), the referral signup check and order cap, byte-counted body limits, writes going through the service role, the first-tap email being sent once, generic error messages, fail-open/fail-closed behaviour, the one-link tap being recorded only after the redirect |

| `api-no-key.test.ts` | The same routes with **no** `SUPABASE_SERVICE_ROLE_KEY` (local dev, or a misconfigured deploy) against a pre-migration-070 database: taps, feedback and referrals still record through the anon client, limits are skipped (fail open), no alert or first-tap emails are guessed |

## Smoke tests — `tests/smoke/smoke.mjs`

```bash
npm run build
npm start                      # or: npx next start -p 3100
npm run test:smoke             # BASE_URL defaults to http://localhost:3000
BASE_URL=http://localhost:3100 npm run test:smoke
```

Every check is a GET. Profiles are rendered through `/preview/card/<design>`
with the built-in fictional demo personas, so no customer data is read and
nothing is recorded. The local server still *reads* from whichever Supabase
project `.env.local` points at (template settings). The script refuses to run
against `tap.scorlyn.com` unless `SMOKE_ALLOW_PROD=1` is set.

It checks:

- error routes return 404 (unknown profile, design, activation code, vCard, card state);
- `/card/inactive` and `/card/not-set-up` render; an unknown card code, with or without `?src=`, redirects to `/card/not-set-up`;
- **every design** listed in `CARD_TEMPLATES` (read from `src/lib/card.ts`, so new designs are included automatically) renders at 390px with no script errors, no 5xx responses, no horizontal overflow and at least one link;
- screenshots of 12 representative designs match their baselines.

### Screenshots

- Taken at 390×844, `prefers-reduced-motion: reduce`, after fonts load and every animation is finished (infinite ones are paused at their start), so runs are repeatable (0.000% drift between runs when this was set up).
- Baselines live in `tests/smoke/baseline/<design>.png` and are committed. They are only ever written by `npm run test:smoke:update`; a design with no baseline **fails** (its screenshot is saved to `tests/smoke/output/` so you can check it before creating one).
- A design fails when more than 0.2% of pixels differ. The run then writes `tests/smoke/output/<design>.actual.png` and `<design>.diff.png` (red = changed; this folder is git-ignored).
- **Approving an intentional change:** look at the diff images, and if the change is what you meant, run `npm run test:smoke:update` and commit the updated baselines together with the code change, so the review shows both.
- The designs compared are listed in `SCREENSHOT_DESIGNS` at the top of `smoke.mjs`: the six in use by real cards, plus cover-photo, viewport-sized and known small-text designs.

## What isn't covered (yet)

- Signed-in screens (dashboard, editor saves, admin): they need a test account in an isolated Supabase project, which doesn't exist yet.
- The rate limits against the real database: covered by the route tests with a faithful in-memory copy of `hit_rate_limit()`/`claim_cooldown()`, not against Postgres itself.
- Real NFC taps and real phones.
