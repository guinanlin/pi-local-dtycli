#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_SKILL="${REPO_ROOT}/skills/frappecli/SKILL.md"
TARGET_ROOT="${HOME}/.pi/agent/skills/frappecli"
TARGET_SKILL="${TARGET_ROOT}/SKILL.md"

if [[ ! -f "${SOURCE_SKILL}" ]]; then
  echo "[ERROR] Source skill not found: ${SOURCE_SKILL}" >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}"
cp "${SOURCE_SKILL}" "${TARGET_SKILL}"

echo "[OK] Installed frappecli skill:"
echo "     ${TARGET_SKILL}"
