"""Chief of Staff orchestrator — implements the hb_core Orchestrator protocol.

Minimal scaffold: free-form chat with Claude (HB context), `remember:`
learning capture, basic trigger dispatch. Add-contact / voice / vision flows
are stubs you wire in as the bot evolves.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from hb_core.claude_client import ClaudeClient
from hb_core.state import PendingItem
from telegram import Update

from . import config

log = logging.getLogger(__name__)

# Per-chat conversation history (in-memory; lost on restart by design — Romain
# can clear it explicitly via `reset chat`).
ChatHistory = dict[int, list[dict]]


def _read_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


class ChiefOrchestrator:
    def __init__(self, claude: ClaudeClient) -> None:
        self.claude = claude
        self.history: ChatHistory = {}

    # ---- system blocks (cached) ----

    def _cached_blocks(self) -> list[str]:
        system = _read_text(config.SYSTEM_PROMPT_PATH)
        learnings = _read_text(config.LEARNINGS_PATH)
        return [system, learnings] if learnings.strip() else [system]

    # ---- Orchestrator protocol ----

    async def handle_chat(self, text: str, chat_id: int, bot: Any) -> None:
        turns = self.history.setdefault(chat_id, [])
        turns.append({"role": "user", "content": text})
        # Keep history bounded.
        if len(turns) > 40:
            del turns[: len(turns) - 40]
        try:
            answer = self.claude.chat(turns, cached_system_blocks=self._cached_blocks())
        except Exception as e:
            log.exception("Claude chat failed")
            await bot.send(f"⚠️ Claude error: {e}")
            return
        turns.append({"role": "assistant", "content": answer})
        await bot.send(answer)

    async def dispatch_trigger(self, kind: str, match: re.Match, update: Update, bot: Any) -> None:
        if kind == "remember":
            rule = match.group(1).strip()
            await self._remember(rule, bot)
        elif kind == "reset_chat":
            chat_id = update.effective_chat.id if update.effective_chat else 0
            self.history.pop(chat_id, None)
            await bot.send("🧹 Conversation history cleared.")
        else:
            await bot.send(f"Trigger {kind!r} not yet implemented.")

    async def on_tweak_text(self, item: PendingItem, text: str, bot: Any) -> None:
        # No tweak flow wired yet — placeholder for add-contact / draft flows.
        await bot.send(f"(tweak received for {item.id}: {text[:80]} — handler not wired)")

    async def on_callback(self, scope: str, action: str, item: PendingItem, query: Any, bot: Any) -> None:
        # No callbacks wired yet — placeholder.
        try:
            await query.edit_message_reply_markup(reply_markup=None)
        except Exception:
            pass
        await bot.send(f"(callback {scope}:{action} for {item.id} — handler not wired)")

    # ---- helpers ----

    async def _remember(self, rule: str, bot: Any) -> None:
        if not rule:
            await bot.send("`remember:` needs a rule after the colon.")
            return
        path = config.LEARNINGS_PATH
        existing = _read_text(path).rstrip()
        from datetime import date
        new_line = f"- {date.today().isoformat()} : {rule}"
        new_body = f"{existing}\n{new_line}\n" if existing else f"{new_line}\n"
        path.write_text(new_body)
        await bot.send(f"📝 Saved to learnings.md:\n— {rule}")
