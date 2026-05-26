# Human Between — secrets & accounts checklist

Romain (and only Romain — Sébastien is solo-mode for now) must provision
every resource below. All values must be **NEW**, owned by Human Between,
never reused from GN Motion.

Track status with `[ ]` / `[x]` as you go.

## Tier 1 — blocking for Chief of Staff minimal (Phase 4)

- [ ] **GitHub org `human-between`** — https://github.com/organizations/new
      → repos: `human-between`, `human-between-core` (both private)
- [ ] **Anthropic API key** — https://console.anthropic.com/
      → new workspace "Human Between" or distinct key. Env: `ANTHROPIC_API_KEY`
- [ ] **Telegram bot — Chief of Staff** — `@BotFather` → `/newbot`
      → handle `@hb_chief_*_bot`, disable privacy mode. Env: `TELEGRAM_BOT_TOKEN_CHIEF`
- [ ] **Telegram group "HB Ops"** — create new group, add bot + Romain, run
      `/id` in chat. Env: `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_GROUP_CHAT_ID`
- [ ] **Notion workspace HB** — https://www.notion.so/
      → create / confirm HB workspace exists (NOT the GN workspace).
      Create DBs: Contacts, Companies, Ops.
      Env: `NOTION_DB_CONTACTS_ID`, `NOTION_DB_COMPANIES_ID`, `NOTION_DB_OPS_ID`
- [ ] **Notion integration "HB Chief of Staff"** —
      https://www.notion.so/profile/integrations → New integration
      → share each HB DB with this integration. Env: `NOTION_API_KEY`

## Tier 2 — extends Chief of Staff (drafts, voice, attachments)

- [ ] **Google Cloud Console project "Human Between"** —
      https://console.cloud.google.com/ → enable Gmail API + Drive API +
      Calendar API
- [ ] **OAuth Client (Desktop)** — GCP → APIs & Services → Credentials →
      Create credentials → OAuth 2.0 Client ID → Desktop. Download JSON →
      `apps/chief-of-staff/secrets/google_oauth_client.json`.
      Env: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- [ ] **Gmail HB account** — set up `chief@humanbetween.com` (or similar
      official HB address). Run the OAuth flow:
      `cd apps/chief-of-staff && .venv/bin/python -m chief.scripts.auth_gmail`
      → token saved at `secrets/gmail_token.json`. Env: `GMAIL_USER_EMAIL`
- [ ] **OpenAI Platform** — https://platform.openai.com/ → new org "Human
      Between" or distinct key (Whisper for voice notes).
      Env: `OPENAI_API_KEY`

## Tier 3 — future (Sales Bot, dashboard HB.com, outbound)

- [ ] **Vercel team "Human Between"** — https://vercel.com/teams/create
      Env: `VERCEL_TOKEN`
- [ ] **Slack workspace HB + app "HB Ops Bot"** — https://slack.com/
      Env: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_OPS_CHANNEL_ID`
- [ ] **Google Shared Drive "HUMAN BETWEEN"** — https://drive.google.com/
      → Shared drives → Create. Distinct from GN MOTION drive.
      Env: `HB_DRIVE_ID`, `HB_DRIVE_ROOT_FOLDER_ID`
- [ ] **fal.ai** — https://fal.ai/dashboard (if HB.ai generates images).
      Env: `FAL_KEY`
- [ ] **Resend** — https://resend.com/ + verify `humanbetween.com` domain
      via DNS. Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] **Apollo / Clay / Smartlead** — if/when an outbound Signal Scout
      equivalent is launched for HB
- [ ] **Supabase project HB** — https://supabase.com/dashboard/new (if a
      learning-loop DB is needed). Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **n8n** — self-hosted or cloud workspace (if orchestrating outbound)

### Tier 1.5 — for the Hermes Agent instance (`hermes-home/`)

Hermes Agent uses many of the same credentials as the custom bot. Copy these
into `hermes-home/.env` (in addition to `apps/chief-of-staff/.env`):

- `ANTHROPIC_API_KEY` (same value as Tier 1 #2)
- `OPENAI_API_KEY` (Whisper STT + optional model provider)
- `OPENAI_CODEX_API_KEY` (only if you use the Codex default in `config.yaml`)
- `TELEGRAM_BOT_TOKEN` — **a SECOND HB bot from BotFather**, distinct from
  the Chief of Staff Python bot's token. Hermes Agent and the custom bot
  cannot share a Telegram token (only one polling client allowed per token).
- `NOTION_API_KEY` (same as Tier 1 #6)
- `OPENROUTER_API_KEY`, `GROQ_API_KEY`, etc. — optional fallback providers
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` (when Hermes needs
  Gmail/Drive/Calendar access)

So in total you'll create **two HB Telegram bots** via BotFather:
1. `@hb_chief_*_bot` — custom Python Chief of Staff
2. `@hb_hermes_*_bot` — Hermes Agent generalist

Both connect to the same HB group (or separate groups — your choice).

## Verification after provisioning

After filling `.env` files, run:

```bash
cd ~/Projects/human-between/apps/chief-of-staff
.venv/bin/python -m chief.scripts.run_bot --check
```

Should print every required env var as present, then exit 0. If any are
missing, the script lists which ones with the URL where to provision them.

## Isolation audit (run before every commit)

```bash
grep -rE "(gnmotion|GN Motion|GN-followup|198f275e822444e6aeb1b8ed6542760c|fd2b144d-0d3a-45e7-8ac6-8702375c3fed|0ABw7SCouMszQUk9PVA|146jt1ruY3lfvS8iVHObyj3IQoMDjrEqm)" \
  ~/Projects/human-between/ ~/Projects/human-between-core/ \
  --exclude-dir=.venv --exclude-dir=node_modules --exclude-dir=.git
```

**Expected output: nothing** (no matches). Any match is a leak.
