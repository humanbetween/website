"""Wire the TelegramDispatcher with HB-specific triggers and the orchestrator."""
from __future__ import annotations

import re

from hb_core.telegram_dispatcher import TelegramDispatcher, TriggerPattern
from hb_core.state import ValidationStore
from hb_core.claude_client import ClaudeClient

from . import config
from .orchestrator import ChiefOrchestrator


TRIGGERS: list[TriggerPattern] = [
    TriggerPattern(re.compile(r"^remember\s*[:\-]\s*(.+)$", re.I | re.DOTALL), "remember"),
    TriggerPattern(re.compile(r"^reset\s+(chat|conversation)\b", re.I), "reset_chat"),
]


def build_dispatcher() -> TelegramDispatcher:
    claude = ClaudeClient(api_key=config.ANTHROPIC_API_KEY, model=config.CLAUDE_MODEL)
    orchestrator = ChiefOrchestrator(claude=claude)
    store = ValidationStore(config.VALIDATIONS_PATH)
    return TelegramDispatcher(
        token=config.TELEGRAM_BOT_TOKEN,
        chat_id=config.ADMIN_CHAT_ID,
        triggers=TRIGGERS,
        orchestrator=orchestrator,
        store=store,
        voice_tmp_dir=config.STATE_DIR,
    )
