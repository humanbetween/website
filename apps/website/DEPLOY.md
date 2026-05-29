# Deploying humanbetween.ai

Two tracks here:

- **Track A — co-founder review** : deploy to a free Vercel preview
  URL (e.g. `humanbetween-website.vercel.app`) so Sébastien can poke
  around. No production domain needed. ~30 min start to finish.
- **Track B — full production** : same as Track A plus DNS,
  verified email domain, live Stripe.

All accounts must be **freshly provisioned for Human Between** — no
reuse of GN Motion credentials.

---

## Current state (already wired)

| Service | Status | Notes |
|---|---|---|
| Neon (Postgres) | ✅ live | US East 1, pooled, 3 migrations applied (8 tables + indexes + site_settings) |
| Cloudflare R2 | ✅ live | bucket `humanbetween-prompts-media`, public dev URL `pub-5f8718b…r2.dev`, upload + read tested |
| Resend | ✅ live | API key set; sender is `onboarding@resend.dev` until domain is verified |
| Stripe | ⚠️ not yet | Test mode account + 2 prices + webhook still TODO |
| Vercel | ⚠️ not yet | This guide |
| Domain | ⚠️ not yet | Optional for review |

---

## Track A — co-founder review (Vercel preview, no domain)

### 1. Stripe in test mode (5 min)

Even for the review you need Stripe so checkout buttons resolve, or
you can leave Stripe blank and the checkout buttons will just return
an error toast — fine for visual review, blocks transaction flow.

If you want checkout working (recommended):

1. Create the HB Stripe account at https://dashboard.stripe.com/register
2. Stay in **Test mode** (orange badge top-right)
3. Products → **Add product** :
   - **Yearly access** — recurring annual, $149/year → copy the price id
   - **Lifetime access** — one-time, $199 → copy the price id
4. Developers → API keys → copy `Secret key` (`sk_test_...`) and
   `Publishable key` (`pk_test_...`)
5. Skip the webhook for now — Stripe can't reach Vercel previews
   without the production domain. The checkout still works, the
   webhook (which flips `subscription_status='active'`) won't fire
   until prod.

### 2. Push the repo to GitHub (or import directly from local)

Either:

- **GitHub** : create a private repo `human-between/website` and push
  this repo. Vercel imports it in one click.
- **Vercel CLI** : `bunx vercel` from `apps/website/` and follow the
  prompts to deploy without GitHub.

### 3. Vercel project (10 min)

1. https://vercel.com → New project
2. Import the repo, **Root directory** = `apps/website`
3. Framework: **Next.js** (auto-detected)
4. Build command: leave the default (`next build`)
5. Output: leave the default

### 4. Environment variables on Vercel

Paste these into Project Settings → Environment Variables. Use the
values you already collected during local setup (they live in
`apps/website/.env`).

```
DATABASE_URL                       # Neon pooled URL
BETTER_AUTH_SECRET                 # generate: openssl rand -base64 32
BETTER_AUTH_URL                    # https://<your-preview>.vercel.app
NEXT_PUBLIC_APP_URL                # same as BETTER_AUTH_URL
RESEND_API_KEY
RESEND_FROM_EMAIL                  # onboarding@resend.dev for now
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET                          # humanbetween-prompts-media
R2_PUBLIC_URL                      # https://pub-5f87…r2.dev
NEXT_PUBLIC_SKOOL_URL              # leave empty if no Skool yet

# Stripe (skip if you skipped step 1)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_YEARLY
STRIPE_PRICE_LIFETIME
# Webhook secret only after the prod domain is wired
```

### 5. Deploy + smoke test

1. Click **Deploy** — first build is ~2 min
2. Once green, Vercel hands you a URL like
   `humanbetween-website-abc.vercel.app`
3. Go to that URL → home should load with the 12 seed prompts
4. Sign up with your real email → magic link arrives via Resend
   (check spam — `onboarding@resend.dev` lands there sometimes)
5. SSH into your terminal and promote yourself:
   ```
   DATABASE_URL=<the prod URL> \
     bun run src/db/promote-admin.ts you@email.com
   ```
6. Refresh `/admin` → sidebar + dashboard show up
7. Try `/admin/prompts/new` → upload a real MP4 / image → confirm it
   shows on `/` in the grid

### 6. Send the review link

Share the Vercel URL with Sébastien plus a short note on what to look
at. Optional: invite him as a collaborator on the Vercel project so
he sees deploy logs and can promote himself admin.

---

## Track B — full production (after the review)

Layer these on top of Track A. None of them block the review.

### Domain on Vercel

1. Buy `humanbetween.ai` (Namecheap, Porkbun — Cloudflare Registrar
   doesn't sell `.ai`)
2. Point nameservers to Cloudflare (or use the registrar's DNS)
3. In Vercel → Project → Domains → add `humanbetween.ai`
4. Vercel gives DNS records → add them on Cloudflare
5. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` env vars to
   `https://humanbetween.ai`

### Custom media domain

1. Cloudflare → R2 bucket → Settings → Custom Domains → add
   `media.humanbetween.ai`
2. Update `R2_PUBLIC_URL` env var → `https://media.humanbetween.ai`

### Verified email domain in Resend

1. Resend → Domains → Add `humanbetween.ai`
2. Add the SPF / DKIM / MX records on Cloudflare
3. Update `RESEND_FROM_EMAIL` → `noreply@humanbetween.ai`

### Live Stripe + webhook

1. Stripe → flip to **Live mode** (banking + KBIS required)
2. Re-create the same two products in live mode → new price ids
3. Update `STRIPE_SECRET_KEY` and the price ids on Vercel
4. Add a webhook endpoint → `https://humanbetween.ai/api/stripe/webhook`
   subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   Copy the signing secret → `STRIPE_WEBHOOK_SECRET`
5. Customer Portal → enable in
   https://dashboard.stripe.com/settings/billing/portal

### CORS on R2

If browser uploads fail with a CORS error after switching the public
URL, add this CORS rule on the bucket:

```json
[
  {
    "AllowedOrigins": ["https://humanbetween.ai", "http://localhost:3000"],
    "AllowedMethods": ["POST"],
    "AllowedHeaders": ["*"]
  }
]
```

### Final smoke test (live)

1. Real signup → magic link from `noreply@humanbetween.ai`
2. Subscribe with a real card → webhook fires → `subscription_status`
   flips to `active` → prompt text appears on `/prompt/<id>`
3. Manage subscription → Stripe portal opens → cancel → back to
   `inactive`
4. Upload a 50 MB MP4 via `/admin/prompts/new` → served by R2 with
   zero egress cost

---

## Daily operation

- `bun run dev` for local dev (compiles routes on demand)
- `bun run build && bun run start` to feel production locally
- `bunx drizzle-kit generate` after every schema.ts change
- `bunx drizzle-kit migrate` to apply pending migrations
- `bun run src/db/promote-admin.ts <email>` to add an admin
- `bun run src/db/seed.ts` to insert the 12 demo prompts on a fresh DB
