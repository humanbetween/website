# Human Between — conventions

Ported from the validated GN Motion stack. Apply by default to every HB app
unless explicitly overridden.

## Telegram bots

- **4-button drafts**: ✅ Send / ✏️ Tweak / 📤 Sent manually / 🔄 Re-draft.
  Never include a "Skip" — if no action makes sense, surface a different
  framing (re-draft or sent manually).
- **Manual validation everywhere**. No write to Notion / Gmail / Slack
  without an explicit Telegram button click.
- **Strict trigger routing**: `tweak_pending → registered triggers → free-form chat`.
  This order is enforced inside `hb_core.TelegramDispatcher._route_text`.
  Tampering with it causes silent interception (the GN bug, 2026-05-18).
- **`remember:` → learnings.md**. A user-written rule is appended to
  `learnings.md` and reloaded on every Claude call via prompt caching.
  Romain can change behavior without redeploying.
- **EOD reminder** (default 21h local) pings the chat if pending validations
  remain. Configurable per bot.

## Claude

- Default model: `claude-sonnet-4-6`.
- Pass static prompts (system, learnings, schema) as
  `cached_system_blocks=[...]` to benefit from ephemeral prompt caching.
- Force structured outputs with `ClaudeClient.run_tool(tool, messages)`. Do
  not parse JSON out of plain text.

## Notion

- API version 2025-09-03 — `data_source_id` pattern. `hb_core.NotionClient`
  handles discovery + cache.
- Each app keeps its own dataclass + property map (`NOTION_PROPS`-style dict)
  next to the entity. No business schema in `hb_core`.

## Design (dashboards)

- Montserrat 400/500. Sentence case throughout. No `uppercase tracking-wider`.
- Dense paddings: `p-4` or `p-5`. Header height `h-12`. Gap `gap-3` between
  cards.
- Numbers `text-3xl` max, weight 500. KPI tiles `text-xl medium`.
- Borders subtle: `border-border/40` or `border-border/60`. No `ring-*` by
  default (reserve rings for critical-threshold states).
- Card backgrounds `bg-card/40` to stay airy.

## Architecture (dashboards)

Progressive disclosure in 3 levels:

1. **Morning** (30s, ~5 KPIs) — what does Romain need to see before coffee?
2. **Weekly** (5min, by department) — sales / projects / finance / content.
3. **Monthly** (deep dive) — cohorts, LTV, comparison N vs N-1.

The most critical KPI dominates visually (top-left, larger, ringed-red if
below threshold).

## Commits

- One feature per commit. Split unrelated WIP into separate commits.
- TS apps: `bunx tsc --noEmit` clean before commit.
- Python apps: `pytest -q` clean before commit.
- Conventional subjects: `feat(chief): ...`, `fix(core): ...`, `docs: ...`.

## Avoid

- ❌ Building a "do-everything" mega-bot. One bot per workflow.
- ❌ "Skip" buttons or no-op actions in Telegram flows.
- ❌ Auto-sending messages / emails / Notion writes (always validate).
- ❌ Hard-coding GN business IDs anywhere. Run an audit before each commit.
