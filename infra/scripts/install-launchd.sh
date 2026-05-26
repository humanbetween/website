#!/usr/bin/env bash
# Render launchd plist templates with local paths and install them into
# ~/Library/LaunchAgents/. Bootstrap each service via launchctl.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_DIR="${REPO_ROOT}/infra/launchagents"
TARGET_DIR="${HOME}/Library/LaunchAgents"
UID_GUI="gui/$(id -u)"

mkdir -p "${TARGET_DIR}"

# ---- Helper: render + bootstrap a service ----
bootstrap_plist() {
  local label="$1"
  local rendered_path="${TARGET_DIR}/${label}.plist"

  if launchctl print "${UID_GUI}/${label}" >/dev/null 2>&1; then
    launchctl bootout "${UID_GUI}/${label}" 2>/dev/null || true
  fi
  launchctl bootstrap "${UID_GUI}" "${rendered_path}"
  launchctl enable "${UID_GUI}/${label}"
  echo "  ✓ Bootstrapped ${label}"
}

# ---- Chief of Staff (custom Python bot under apps/chief-of-staff) ----
render_chief() {
  local app_dir="$1"
  local label="com.humanbetween.chief"
  local python_bin="${app_dir}/.venv/bin/python"

  if [[ ! -x "${python_bin}" ]]; then
    echo "  ✗ No venv at ${python_bin} — run bootstrap.sh first" >&2
    return 1
  fi

  local target="${TARGET_DIR}/${label}.plist"
  sed \
    -e "s|{{USER}}|${USER}|g" \
    -e "s|{{LABEL}}|${label}|g" \
    -e "s|{{APP_DIR}}|${app_dir}|g" \
    -e "s|{{MODULE}}|chief.scripts.run_bot|g" \
    -e "s|{{PYTHON_BIN}}|${python_bin}|g" \
    -e "s|{{LOG_DIR}}|${app_dir}/logs|g" \
    -e "s|{{LOG_NAME}}|chief|g" \
    "${TEMPLATE_DIR}/com.humanbetween.chief.plist.template" > "${target}"
  echo "  ✓ Rendered ${target}"

  bootstrap_plist "${label}"
}

# ---- Hermes Agent (2nd instance with HB HERMES_HOME) ----
render_hermes_agent() {
  local hermes_home_hb="$1"
  local hermes_agent_dir="$2"          # where the Hermes Agent code lives
  local hermes_venv_dir="${hermes_agent_dir}/venv"
  local label="com.humanbetween.hermes-agent"
  local python_bin="${hermes_venv_dir}/bin/python"

  if [[ ! -x "${python_bin}" ]]; then
    echo "  ✗ Hermes Agent venv not found at ${python_bin}" >&2
    echo "    Set HB_HERMES_AGENT_DIR=/path/to/hermes-agent and re-run, or install Hermes Agent first." >&2
    return 1
  fi

  if [[ ! -f "${hermes_home_hb}/.env" ]]; then
    echo "  ⚠ ${hermes_home_hb}/.env missing — copy .env.example and fill HB credentials before the daemon will work."
  fi

  local target="${TARGET_DIR}/${label}.plist"
  sed \
    -e "s|{{HERMES_VENV_PYTHON}}|${python_bin}|g" \
    -e "s|{{HERMES_VENV_DIR}}|${hermes_venv_dir}|g" \
    -e "s|{{HERMES_AGENT_DIR}}|${hermes_agent_dir}|g" \
    -e "s|{{HERMES_HOME_HB}}|${hermes_home_hb}|g" \
    "${TEMPLATE_DIR}/com.humanbetween.hermes-agent.plist.template" > "${target}"
  echo "  ✓ Rendered ${target}"

  bootstrap_plist "${label}"
}

# ---- Drivers ----
CHIEF_DIR="${REPO_ROOT}/apps/chief-of-staff"
if [[ -d "${CHIEF_DIR}" ]]; then
  echo "── Installing com.humanbetween.chief ──"
  render_chief "${CHIEF_DIR}"
fi

HERMES_HOME_HB="${REPO_ROOT}/hermes-home"
# Default to the Hermes Agent installed by the GN setup (shared venv).
# Override by exporting HB_HERMES_AGENT_DIR before running this script.
HERMES_AGENT_DIR="${HB_HERMES_AGENT_DIR:-${HOME}/.hermes/hermes-agent}"
if [[ -d "${HERMES_HOME_HB}" ]]; then
  echo ""
  echo "── Installing com.humanbetween.hermes-agent ──"
  echo "  HERMES_HOME=${HERMES_HOME_HB}"
  echo "  Hermes Agent code: ${HERMES_AGENT_DIR}"
  render_hermes_agent "${HERMES_HOME_HB}" "${HERMES_AGENT_DIR}"
fi

echo ""
echo "→ Status:"
launchctl list | grep -E 'humanbetween' || echo "  (none yet — check logs)"
