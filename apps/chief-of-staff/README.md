# Chief of Staff — HB Telegram bot

Generalist Telegram bot for **Human Between** ops. Captures contacts,
handles ad-hoc tasks, free-form chat with HB context. Built on
`hb_core` primitives.

## Layout

```
chief-of-staff/
├── pyproject.toml
├── .env.example
├── chief/
│   ├── __init__.py
│   ├── config.py            # env loading, paths
│   ├── orchestrator.py      # implements hb_core.Orchestrator protocol
│   ├── bot.py               # wires the dispatcher
│   ├── system_prompt.md     # HB tone / discipline
│   ├── learnings.md         # remember: rules
│   └── scripts/
│       └── run_bot.py       # entry point
├── state/                   # gitignored — JSON state
├── logs/                    # gitignored — launchd logs
└── secrets/                 # gitignored — Gmail OAuth tokens etc.
```

## Quickstart

```bash
# from human-between repo root
bash infra/scripts/bootstrap.sh

# fill the .env (Telegram bot token + Anthropic key minimum)
$EDITOR apps/chief-of-staff/.env

# verify env
cd apps/chief-of-staff
.venv/bin/python -m chief.scripts.run_bot --check

# run interactively
.venv/bin/python -m chief.scripts.run_bot

# install as launchd service (autostart at login)
cd ../..
bash infra/scripts/install-launchd.sh
```

## Triggers (text routing)

| Pattern | Effect |
|---|---|
| `remember: <rule>` | Append to `chief/learnings.md`, reloaded next Claude call |
| `reset chat` | Clear in-memory conversation history for the calling chat |
| (anything else) | Free-form chat with Claude (HB-context system prompt + learnings) |

`/ping` always replies with `pong ✅` (built-in to `hb_core.TelegramDispatcher`).

## Extending

To add a new flow (e.g. `add contact`), create:

1. A new trigger in `chief/bot.py` (`TRIGGERS` list)
2. A handler in `ChiefOrchestrator.dispatch_trigger`
3. If it produces a draft, persist via `dispatcher.store.add("contact_draft", payload=...)`
4. Wire callbacks in `ChiefOrchestrator.on_callback`

The dispatcher enforces the routing order `tweak_pending → triggers → free chat`.
Do not bypass that order — past GN bug shows silent interception otherwise.
