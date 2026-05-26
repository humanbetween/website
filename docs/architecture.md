# Human Between — architecture

## The three verticals (Disney model)

| Vertical | Domain | Stage | Notes |
|---|---|---|---|
| `.com` | B2B agency — CGI-AI production, monthly design subscription, physical installs | Site built, needs case studies + outreach | Migrate existing GN clients HERE only with explicit re-onboarding (not as a copy from GN CRM) |
| `.ai` | AI products — prompt business, tools, courses, Creator/B2B AI Platform | Creator Platform in dev (~1 month) | The platform is the first revenue lever |
| `.capital` | Investment arm — reinvest in students + AI projects + build tools for brands | Phase 3 — not before `.com` or `.ai` generate cashflow | Gate-locked until cashflow exists |

## Codebase shape

```
human-between/                 ← apps monorepo (this repo)
├── apps/
│   └── chief-of-staff/        ← Telegram generalist bot (Phase 1)
│   ├── sales-bot/             ← future: HB.com prospect relances
│   ├── ops-bot/               ← future: HB.com / .ai operations
│   └── dashboard-web/         ← future: HB.com internal dashboard (Next.js)
├── infra/
│   ├── launchagents/
│   └── scripts/
└── docs/

human-between-core/            ← shared lib (separate repo)
├── python/  (hb_core)
└── ts/      (@human-between/core)
```

## How apps compose

Each app under `apps/*` is self-contained: own venv (Python) or
package.json (TS), own `.env`, own pyproject. They depend on
`human-between-core` via editable installs / local symlinks. No cross-app
imports — apps communicate via Notion / files / Telegram, not in-process.

## Bot per domain

GN Motion taught us the hard way (2026-05-18 routing bug) that one Telegram
bot per workflow is the right granularity. HB starts the same way:

- **Chief of Staff** = generalist ops (capture contacts, ad-hoc reminders,
  free-form chat with context). 1 bot, 1 Telegram token.
- **Sales Bot** (future) = HB.com prospect relances. Distinct bot, distinct
  token.
- **Ops Bot** (future) = CRUD over Notion HB (Projects/Revenue/Expenses).
  Distinct bot.

## Data flow

```
Romain / Sébastien (Telegram)
       ↓
   Chief of Staff bot
       ↓
   Notion HB workspace (source of truth)
       ↓
   Future: Dashboard HB.com (Next.js, auto-pull from Notion)
```

No HTTP coupling between bot and dashboard — Notion is the back-channel. The
dashboard pulls on session load. The bot writes to Notion + sends a Telegram
confirmation.

## Identity boundaries (read also `CLAUDE.md`)

Every resource (Notion workspace, Telegram bot, Google account, Anthropic
key, OpenAI key, Slack workspace, Vercel team, Resend domain) is a **fresh
HB-owned resource**. Nothing is shared with GN Motion. See
[`secrets-checklist.md`](./secrets-checklist.md) for the provisioning list.
