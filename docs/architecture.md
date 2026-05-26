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
│   └── chief-of-staff/        ← custom Python Telegram bot (lightweight scaffold)
│   ├── sales-bot/             ← future: HB.com prospect relances
│   ├── ops-bot/               ← future: HB.com / .ai operations
│   └── dashboard-web/         ← future: HB.com internal dashboard (Next.js)
├── hermes-home/               ← Hermes Agent HERMES_HOME for HB (2nd instance)
│   ├── config.yaml            ← framework defaults (no secrets)
│   ├── SOUL.md                ← HB persona
│   ├── skills/                ← full Hermes Agent skill library
│   ├── memories/              ← MEMORY.md + USER.md (start blank)
│   └── ...                    ← runtime state (gitignored)
├── infra/
│   ├── launchagents/          ← com.humanbetween.{chief,hermes-agent}.plist.template
│   └── scripts/
└── docs/

human-between-core/            ← shared lib (separate repo)
├── python/  (hb_core)
└── ts/      (@human-between/core)
```

## The two bot tracks

HB runs **two distinct agent codebases**, each with its own Telegram bot,
its own scope, and its own daemon:

### 1. Hermes Agent (`hermes-home/`) — generalist agent

Same product as GN's Chief of Staff at `~/.hermes/`. Open-source framework
(Hermes Agent by Nous Research, 1,400+ Python files) with full toolkit:
web, github, email, voice, vision, MCP servers, skills, kanban, sessions,
multi-channel (Telegram/Discord/Slack/WhatsApp/...). Used for **everything
generalist**: ad-hoc tasks, research, captures, free-form chat with persistent
memory.

- HERMES_HOME : `~/Projects/human-between/hermes-home/`
- Code (shared with GN's instance) : `~/.hermes/hermes-agent/`
- Daemon : `com.humanbetween.hermes-agent` (launchd)
- Memory : `hermes-home/memories/{MEMORY,USER}.md` (blank at start, agent
  appends learnings over time)

### 2. Custom Python bots (`apps/*`) — domain-specific workflows

Lightweight bots built on `hb_core` for **workflows that need very strict
validation discipline** (e.g. email drafts with 4-button approval). The
`apps/chief-of-staff/` scaffold demonstrates the pattern; future
`apps/sales-bot/` will handle HB.com prospect relances (HB equivalent of
Hermès Sales).

These are NOT a replacement for Hermes Agent — they coexist with it. Each
addresses a different need : Hermes Agent for "agent with full toolkit and
memory", custom bots for "tight loops with mandatory human-in-the-loop on
each external write".

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
