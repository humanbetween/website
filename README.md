# human-between

Monorepo for **Human Between** apps — holding cofounded by Romain Guillon and
Sébastien Mando. Three verticals : `.com` (B2B agency), `.ai` (creator/AI
products), `.capital` (investment).

## Layout

```
human-between/
├── CLAUDE.md            # HB-specific rules (read first when Claude opens this repo)
├── apps/
│   └── chief-of-staff/  # generalist Telegram bot (ops, contacts, ad-hoc tasks)
├── infra/
│   ├── launchagents/    # plist templates for macOS launchd
│   └── scripts/         # bootstrap, install, export
└── docs/
    ├── architecture.md
    ├── conventions.md
    └── secrets-checklist.md
```

Shared infrastructure (Telegram dispatcher, Claude wrapper, Notion client,
Gmail OAuth, state store, scheduler) lives in a **separate repo**:
[`human-between/human-between-core`](https://github.com/human-between/human-between-core).
Clone it side-by-side: `~/Projects/human-between-core/`.

## Quickstart on a fresh machine

```bash
# 1. Clone both repos side by side
cd ~/Projects
git clone git@github.com:human-between/human-between.git
git clone git@github.com:human-between/human-between-core.git

# 2. Bootstrap (creates venvs, installs editable core, copies .env.example → .env, renders plists)
cd human-between
bash infra/scripts/bootstrap.sh

# 3. Provision the accounts listed in docs/secrets-checklist.md and fill .env files

# 4. Install launchd agents (autostart at login)
bash infra/scripts/install-launchd.sh
```

## Isolation discipline (CRITICAL)

This project shares NO credentials with GN Motion. Every API key, OAuth
client, Telegram bot, Notion workspace, and Drive is provisioned fresh under
the Human Between identity. See [`CLAUDE.md`](./CLAUDE.md) for the full rule.

## Portability

To deploy on another Mac:

```bash
bash infra/scripts/export.sh
# → human-between-export-YYYYMMDD.tar.gz (code + templates + docs + .env.example, no secrets)
# Copy to the target machine, untar, run bootstrap.sh.
```
