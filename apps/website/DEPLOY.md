# Deploying humanbetween.ai

These are the once-only steps to take this app from local dev to a live
production deploy on Vercel + Neon + Cloudflare R2 + Stripe + Resend.

All accounts must be **freshly provisioned for Human Between** — no
reuse of GN Motion credentials (see `feedback-hb-isolation`).

## 1. Domain

Buy / point `humanbetween.ai` (and ideally a `media.humanbetween.ai`
subdomain) to a registrar of your choice.

## 2. Neon (Postgres)

1. Create a new HB project at https://console.neon.tech
2. Copy the pooled `DATABASE_URL` (it looks like
   `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)
3. Run migrations once: `DATABASE_URL=... bunx drizzle-kit migrate`
4. (Later) seed: `DATABASE_URL=... bun run src/db/seed.ts`
5. Promote your account to admin once you have a real account:
   `DATABASE_URL=... bun run src/db/promote-admin.ts you@email.com`

## 3. Cloudflare R2

1. Create a new HB Cloudflare account
2. Create an R2 bucket named `humanbetween-prompts-media`
3. Set up a custom domain `media.humanbetween.ai` (R2 → Settings →
   Public access → Custom domain). DNS will be created automatically if
   the domain is on Cloudflare.
4. Generate an R2 API token with read/write scope on that bucket. Copy
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## 4. Stripe

1. Create an HB Stripe account (start in test mode)
2. Create two recurring products:
   - **Monthly** — recurring price, $19/mo
   - **Lifetime** — one-time price, $199
3. Copy each price ID into `STRIPE_PRICE_MONTHLY` and
   `STRIPE_PRICE_LIFETIME`.
4. Get `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
5. Add a webhook endpoint pointing at
   `https://humanbetween.ai/api/stripe/webhook`, subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Set the Customer Portal up under
   https://dashboard.stripe.com/settings/billing/portal so users can
   manage their subscription themselves.

## 5. Resend

1. Create an HB Resend account
2. Verify the `humanbetween.ai` domain
3. Generate an API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL=noreply@humanbetween.ai`

## 6. Vercel

1. Create an HB Vercel account
2. Import this repo (you can point Vercel at `apps/website` as the
   project root)
3. Frame:
   - **Framework**: Next.js
   - **Build command**: `bun run build`
   - **Output**: default
4. Add the following environment variables (copy values from steps
   above):

   ```
   DATABASE_URL
   BETTER_AUTH_SECRET            # generate: openssl rand -base64 32
   BETTER_AUTH_URL               # https://humanbetween.ai
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_PRICE_MONTHLY
   STRIPE_PRICE_LIFETIME
   RESEND_API_KEY
   RESEND_FROM_EMAIL
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET                     # humanbetween-prompts-media
   R2_PUBLIC_URL                 # https://media.humanbetween.ai
   NEXT_PUBLIC_APP_URL           # https://humanbetween.ai
   NEXT_PUBLIC_SKOOL_URL         # https://skool.com/your-group
   ```

5. Add the domain `humanbetween.ai` in Vercel → Settings → Domains.

## 7. Smoke test

1. Sign up with your real email → check magic link arrives via Resend
2. Promote yourself to admin via the CLI in step 2.5
3. Visit `/admin`, create a prompt, upload an MP4 → confirm it lands on
   the home grid and autoplays in viewport
4. Open an incognito window, hit `/pricing`, sign up, run the Stripe
   test card `4242 4242 4242 4242` (or a real card in live mode) →
   confirm the webhook fires, your `subscription_status` flips to
   `active`, and the prompt detail page shows the prompt text + Copy
   button
5. Hit Manage subscription on `/account` → confirm Stripe portal opens
   and cancel takes you back to `inactive`

## CORS on R2

If browser uploads fail with a CORS error, add a CORS rule to your R2
bucket allowing your origin:

```json
[
  {
    "AllowedOrigins": ["https://humanbetween.ai", "http://localhost:3000"],
    "AllowedMethods": ["POST"],
    "AllowedHeaders": ["*"]
  }
]
```
