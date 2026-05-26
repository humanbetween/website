"""Chief of Staff config — typed env loader on top of hb_core.env_config.

Loads `.env` from the app root. Exposes required + optional vars. Static
paths (system_prompt.md, learnings.md, state/, logs/, secrets/) are
project-root-relative.
"""
from __future__ import annotations

from pathlib import Path

from hb_core import env_config

APP_ROOT = Path(__file__).resolve().parent.parent
env_config.load_env(APP_ROOT / ".env")

# --- Required ---
TELEGRAM_BOT_TOKEN = env_config.required("TELEGRAM_BOT_TOKEN")
ANTHROPIC_API_KEY = env_config.required("ANTHROPIC_API_KEY")

# --- Optional ---
CLAUDE_MODEL = env_config.optional("CLAUDE_MODEL", "claude-sonnet-4-6") or "claude-sonnet-4-6"
TELEGRAM_ADMIN_CHAT_ID_RAW = env_config.optional("TELEGRAM_ADMIN_CHAT_ID")
ADMIN_CHAT_ID = int(TELEGRAM_ADMIN_CHAT_ID_RAW) if TELEGRAM_ADMIN_CHAT_ID_RAW else None

NOTION_API_KEY = env_config.optional("NOTION_API_KEY")
NOTION_DB_CONTACTS_ID = env_config.optional("NOTION_DB_CONTACTS_ID")

OPENAI_API_KEY = env_config.optional("OPENAI_API_KEY")
WHISPER_MODEL = env_config.optional("WHISPER_MODEL", "whisper-1") or "whisper-1"

CHIEF_TZ = env_config.optional("CHIEF_TZ", "Europe/Paris") or "Europe/Paris"
CHIEF_LOG_LEVEL = env_config.optional("CHIEF_LOG_LEVEL", "INFO") or "INFO"
EOD_REMINDER_HOUR = env_config.optional_int("CHIEF_EOD_REMINDER_HOUR", 21)

# --- Paths ---
STATE_DIR = APP_ROOT / "state"
LOGS_DIR = APP_ROOT / "logs"
SECRETS_DIR = APP_ROOT / "secrets"
STATE_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)
SECRETS_DIR.mkdir(parents=True, exist_ok=True)

SYSTEM_PROMPT_PATH = APP_ROOT / "chief" / "system_prompt.md"
LEARNINGS_PATH = APP_ROOT / "chief" / "learnings.md"

VALIDATIONS_PATH = STATE_DIR / "validations.json"
