"""Entry point for the Chief of Staff bot.

Usage:
    python -m chief.scripts.run_bot           # run the bot (long-polling)
    python -m chief.scripts.run_bot --check   # validate env and exit
"""
from __future__ import annotations

import sys

from hb_core.logger import setup_logging


def main() -> int:
    if "--check" in sys.argv:
        return _check_env()

    from .. import config  # imports config (raises on missing required vars)
    from ..bot import build_dispatcher

    setup_logging(config.CHIEF_LOG_LEVEL)
    dispatcher = build_dispatcher()
    dispatcher.run()
    return 0


def _check_env() -> int:
    """Validate env without starting the bot. Useful in CI / bootstrap."""
    print("→ Checking Chief of Staff env...")
    missing: list[tuple[str, str]] = []
    try:
        from .. import config  # noqa: F401
    except RuntimeError as e:
        msg = str(e)
        print(f"  ✗ {msg}")
        if "TELEGRAM_BOT_TOKEN" in msg:
            missing.append(("TELEGRAM_BOT_TOKEN", "BotFather → /newbot"))
        if "ANTHROPIC_API_KEY" in msg:
            missing.append(("ANTHROPIC_API_KEY", "https://console.anthropic.com/"))
        print("\nProvision the missing accounts in docs/secrets-checklist.md.")
        return 1

    from .. import config

    print(f"  ✓ TELEGRAM_BOT_TOKEN present (...{config.TELEGRAM_BOT_TOKEN[-6:]})")
    print(f"  ✓ ANTHROPIC_API_KEY present (...{config.ANTHROPIC_API_KEY[-6:]})")
    print(f"  ✓ CLAUDE_MODEL = {config.CLAUDE_MODEL}")
    print(f"  ✓ CHIEF_TZ = {config.CHIEF_TZ}")
    print(f"  {'✓' if config.ADMIN_CHAT_ID else '○'} ADMIN_CHAT_ID = {config.ADMIN_CHAT_ID}")
    print(f"  {'✓' if config.NOTION_API_KEY else '○'} NOTION_API_KEY {'present' if config.NOTION_API_KEY else '(empty — Notion features disabled)'}")
    print(f"  {'✓' if config.OPENAI_API_KEY else '○'} OPENAI_API_KEY {'present' if config.OPENAI_API_KEY else '(empty — voice transcription disabled)'}")
    print("→ Env OK. Run without --check to start the bot.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
