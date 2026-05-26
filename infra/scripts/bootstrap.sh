#!/usr/bin/env bash
# Bootstrap a fresh human-between checkout : create venvs, install editable
# core, copy .env.example → .env, render launchd plists.
#
# Idempotent — safe to re-run.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CORE_REPO="$(cd "${REPO_ROOT}/../human-between-core" 2>/dev/null && pwd || true)"

if [[ -z "${CORE_REPO}" ]]; then
  echo "ERROR: human-between-core not found at ${REPO_ROOT}/../human-between-core" >&2
  echo "Clone it side by side first:" >&2
  echo "  git clone git@github.com:human-between/human-between-core.git ${REPO_ROOT}/../human-between-core" >&2
  exit 1
fi

echo "→ Bootstrapping human-between in ${REPO_ROOT}"
echo "→ Using hb_core from ${CORE_REPO}"

# Root .env
if [[ ! -f "${REPO_ROOT}/.env" ]]; then
  cp "${REPO_ROOT}/.env.example" "${REPO_ROOT}/.env"
  echo "→ Created ${REPO_ROOT}/.env (fill from docs/secrets-checklist.md)"
fi

# Each app
for app_dir in "${REPO_ROOT}"/apps/*/; do
  app_name=$(basename "${app_dir}")
  echo ""
  echo "── App: ${app_name} ──"

  # venv
  if [[ ! -d "${app_dir}.venv" ]]; then
    python3.12 -m venv "${app_dir}.venv"
    echo "  ✓ venv created"
  fi

  # Install hb_core editable then app editable
  "${app_dir}.venv/bin/pip" install -q --upgrade pip
  "${app_dir}.venv/bin/pip" install -q -e "${CORE_REPO}/python"
  if [[ -f "${app_dir}pyproject.toml" ]]; then
    "${app_dir}.venv/bin/pip" install -q -e "${app_dir}"
  fi
  echo "  ✓ deps installed (hb_core + app)"

  # .env
  if [[ -f "${app_dir}.env.example" && ! -f "${app_dir}.env" ]]; then
    cp "${app_dir}.env.example" "${app_dir}.env"
    echo "  ✓ ${app_name}/.env created (fill it before running)"
  fi

  # State + logs dirs
  mkdir -p "${app_dir}state" "${app_dir}logs" "${app_dir}secrets"
done

echo ""
echo "→ Done. Next steps:"
echo "  1. Provision the accounts in docs/secrets-checklist.md"
echo "  2. Fill the .env files (root + per app)"
echo "  3. Run: bash infra/scripts/install-launchd.sh"
