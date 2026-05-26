# hermes-home/ — Human Between Hermes Agent instance

This directory is the `HERMES_HOME` for HB's instance of [Hermes Agent](https://hermes-agent.nousresearch.com).
The agent code lives at `~/.hermes/hermes-agent/` (shared with GN's instance —
same Python venv, same code, but two completely separate homes / configs /
memories / channels).

## Layout

```
hermes-home/
├── config.yaml              # ⏳ committed: framework config (no secrets)
├── SOUL.md                  # ⏳ committed: HB persona
├── .env.example             # ⏳ committed: required env vars documented
├── .env                     # 🚫 gitignored: HB credentials
├── bin/
│   └── tirith               # ⏳ committed: security checker (binary)
├── skills/                  # ⏳ committed: Hermes Agent skill library (HB-customizable)
├── memories/
│   ├── MEMORY.md            # ⏳ committed: agent's long-term project memory
│   └── USER.md              # ⏳ committed: notes on Romain & Sébastien
├── logs/                    # 🚫 gitignored: gateway/agent logs
├── cron/                    # 🚫 gitignored: scheduled job state
├── profiles/                # 🚫 gitignored: user profile state
├── hooks/                   # ⏳ committed (empty): for custom hooks
├── sessions/                # 🚫 gitignored: session DB (created at runtime)
├── audio_cache/             # 🚫 gitignored: voice cache
├── image_cache/             # 🚫 gitignored
├── pastes/                  # 🚫 gitignored
├── checkpoints/             # 🚫 gitignored
├── sandboxes/               # 🚫 gitignored
├── cache/                   # 🚫 gitignored
├── channel_directory.json   # 🚫 gitignored: list of Telegram/Discord channels (runtime)
├── auth.json                # 🚫 gitignored
├── google_token.json        # 🚫 gitignored
├── google_client_secret.json # 🚫 gitignored
├── state.db                 # 🚫 gitignored: agent state DB
├── kanban.db                # 🚫 gitignored: kanban store
└── gateway.{lock,pid}       # 🚫 gitignored: gateway state
```

## Running

```bash
# 1. Fill .env (from .env.example) with HB credentials
cp .env.example .env
$EDITOR .env

# 2. Launch the gateway (the daemon that connects channels and routes to the agent)
HERMES_HOME=~/Projects/human-between/hermes-home \
  ~/.hermes/hermes-agent/venv/bin/python -m hermes_cli.main gateway run --replace

# Or install as launchd service (autostart at login):
cd ~/Projects/human-between
bash infra/scripts/install-launchd.sh
```

## Adding a channel (e.g. Telegram bot HB)

Once running, send a message from the HB Telegram bot to the agent. The
gateway will pick it up and the channel will appear in `channel_directory.json`.

## Skills

The `skills/` directory ships with Hermes Agent's full skill library (web,
github, email, productivity, devops, etc.). Add HB-specific skills by
creating a new directory under `skills/<your-skill-name>/` with a `SKILL.md`.

## Isolation

This instance NEVER references GN Motion. Do not paste GN credentials,
client names, or Notion DB IDs in `.env`, `MEMORY.md`, or any skill file.
See `~/Projects/human-between/CLAUDE.md` for the full isolation rule.
