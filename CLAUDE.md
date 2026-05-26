# Human Between — project rules for Claude

These rules **complement** the global `~/.claude/CLAUDE.md`. They do not
override; they add HB-specific discipline on top.

## Non-negotiable: zero GN Motion contamination

This repo, and any app built on top of `hb_core`, **MUST NOT** reference any
GN Motion credential, account, ID, label, or business object. Concretely:

- ❌ No GN Motion client name in the HB CRM. If the same human exists in both
  worlds, they are re-entered as a separate HB record with their own history.
- ❌ No reuse of GN's `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NOTION_TOKEN`,
  `TELEGRAM_BOT_TOKEN`, `GMAIL_*`, Drive IDs, Vercel tokens.
- ❌ No copy of `~/Projects/gn-pipeline/hermes/secrets/` files into HB.
- ❌ No reference to GN database IDs (`198f275e822444e6aeb1b8ed6542760c`,
  `fd2b144d-0d3a-45e7-8ac6-8702375c3fed`, etc.) in any HB code or env.
- ❌ No `com.gnmotion.*` launchd labels — HB uses `com.humanbetween.*` only.

When Romain (or anyone) asks "reuse X from GN for HB", **refuse and
redirect** to the equivalent fresh resource in
[`docs/secrets-checklist.md`](./docs/secrets-checklist.md).

## Stack conventions (inherited from validated GN patterns)

These conventions were validated on the GN side and ported here. They apply
to all HB bots and dashboards.

### Telegram bots

- **4-button drafts** (no Skip): ✅ Send / ✏️ Tweak / 📤 Sent manually / 🔄 Re-draft
- **Strict trigger routing**: `tweak_pending → registered triggers → free-form chat`.
  This order is enforced in `hb_core.TelegramDispatcher._route_text` — do not
  reshuffle.
- **Manual validation everywhere**: no write to Notion/Gmail without a
  Telegram button click.
- **Dynamic learnings**: `remember: <rule>` → appended to `learnings.md`,
  reloaded on every Claude call via prompt caching.
- **EOD reminder 21h** (configurable) if pending validations remain.
- **Bot per domain**: each functional bot has its own Telegram token. Don't
  cram multiple workflows into one bot — past GN bug (2026-05-18) showed
  silent interception across workflows.

### Python

- Python > Node for bots. TS only for dashboards.
- `pip install -e ../../human-between-core/python` for `hb_core`.
- venv per app, never shared.
- Logging via `hb_core.logger.setup_logging("INFO")`.

### Claude API

- Default model: `claude-sonnet-4-6`.
- Prompt cache static blocks (system prompt, learnings, schema) via
  `ClaudeClient(...).chat(cached_system_blocks=[...])`.
- Force structured outputs via `ClaudeClient.run_tool(tool, messages)`. Don't
  ask for raw JSON in the assistant text.

### Notion

- API version 2025-09-03 (data_source_id pattern). `hb_core.NotionClient`
  handles the discovery + cache automatically.
- Each app defines its own dataclass + property map. No business schema in
  `hb_core`.

### Design (for future dashboards)

When scaffolding a dashboard under `apps/`, apply:

- Montserrat 400/500, sentence case, dense paddings (`p-4`/`p-5`).
- No `ring-*` by default. Use `border-border/40` for subtle separation.
- Architecture in 3 progressive levels: Morning (30s, ~5 KPIs) → Weekly (5min
  by dept) → Monthly (deep dive).
- TS strict, `bunx tsc --noEmit` before every commit.

## launchd

- All HB services use the label prefix `com.humanbetween.*`.
- Templates live in `infra/launchagents/*.plist.template`.
- Render via `infra/scripts/install-launchd.sh` (substitutes `{{USER}}`,
  `{{PROJECT_ROOT}}`, `{{LABEL}}`, `{{APP_DIR}}`, `{{PYTHON_BIN}}`).
- Rendered plists are **not** committed.

## Commits

- One feature per commit. If a working tree has unrelated WIP, split into
  separate commits (the same hygiene rule as GN's dashboard-mockup).
- `bunx tsc --noEmit` (TS apps) or `pytest` (Python apps) before commit.
- Conventional commit subject style: `feat(chief): add /pong handler`,
  `fix(core): notion data_source cache miss`.

## Memory references

- [[project_human_between]] — context on HB (3 verticals, partnership, state)
- [[feedback-hb-isolation]] — the isolation rule, recorded 2026-05-26
- [[feedback-hermes-sales]] — UX conventions ported from GN's Hermès
- [[feedback-hermes-scope]] — anti-pattern to avoid (silent trigger interception)
