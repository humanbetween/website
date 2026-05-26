#!/usr/bin/env bash
# Render launchd plist templates with local paths and install them into
# ~/Library/LaunchAgents/. Bootstrap each service via launchctl.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_DIR="${REPO_ROOT}/infra/launchagents"
TARGET_DIR="${HOME}/Library/LaunchAgents"
UID_GUI="gui/$(id -u)"

mkdir -p "${TARGET_DIR}"

render() {
  local template="$1"
  local label="$2"
  local app_dir="$3"
  local module="$4"
  local log_name="$5"
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
    -e "s|{{MODULE}}|${module}|g" \
    -e "s|{{PYTHON_BIN}}|${python_bin}|g" \
    -e "s|{{LOG_DIR}}|${app_dir}/logs|g" \
    -e "s|{{LOG_NAME}}|${log_name}|g" \
    "${template}" > "${target}"
  echo "  ✓ Rendered ${target}"

  # Bootstrap (or kickstart if already loaded)
  if launchctl print "${UID_GUI}/${label}" >/dev/null 2>&1; then
    launchctl bootout "${UID_GUI}/${label}" 2>/dev/null || true
  fi
  launchctl bootstrap "${UID_GUI}" "${target}"
  launchctl enable "${UID_GUI}/${label}"
  echo "  ✓ Bootstrapped ${label}"
}

# Chief of Staff
CHIEF_DIR="${REPO_ROOT}/apps/chief-of-staff"
if [[ -d "${CHIEF_DIR}" ]]; then
  echo "── Installing com.humanbetween.chief ──"
  render \
    "${TEMPLATE_DIR}/com.humanbetween.chief.plist.template" \
    "com.humanbetween.chief" \
    "${CHIEF_DIR}" \
    "chief.scripts.run_bot" \
    "chief"
fi

echo ""
echo "→ Status:"
launchctl list | grep -E '^[^	]+\thumanbetween' || echo "  (none yet — check logs)"
