#!/usr/bin/env bash
# Produce a tar archive of human-between/ suitable for restoring on another
# Mac. Excludes runtime state, secrets, venvs, and .env files.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP=$(date +%Y%m%d)
ARCHIVE="${REPO_ROOT}/human-between-export-${STAMP}.tar.gz"

cd "${REPO_ROOT}/.."

tar -czf "${ARCHIVE}" \
  --exclude='human-between/apps/*/.venv' \
  --exclude='human-between/apps/*/state' \
  --exclude='human-between/apps/*/logs' \
  --exclude='human-between/apps/*/secrets' \
  --exclude='human-between/apps/*/.env' \
  --exclude='human-between/apps/*/.env.local' \
  --exclude='human-between/.env' \
  --exclude='human-between/.env.local' \
  --exclude='human-between/node_modules' \
  --exclude='human-between/.next' \
  --exclude='human-between/dist' \
  --exclude='human-between/build' \
  --exclude='human-between/.git' \
  --exclude='human-between/__pycache__' \
  --exclude='*.pyc' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  human-between/

echo "→ Wrote ${ARCHIVE}"
echo "  Size: $(du -h "${ARCHIVE}" | awk '{print $1}')"
echo ""
echo "On the target machine:"
echo "  cd ~/Projects && tar -xzf ${ARCHIVE##*/}"
echo "  git clone git@github.com:human-between/human-between-core.git"
echo "  cd human-between && bash infra/scripts/bootstrap.sh"
