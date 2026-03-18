#!/usr/bin/env bash

set -euo pipefail

DOCTYPE="User"
LIMIT="5"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/run_frappe_task_smoke.sh [--doctype <DOCTYPE>] [--limit <N>] [--site-doctypes]

Examples:
  bash scripts/run_frappe_task_smoke.sh --doctype User --limit 5
  bash scripts/run_frappe_task_smoke.sh --site-doctypes
EOF
}

RUN_SITE_DOCTYPES="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --doctype)
      DOCTYPE="${2:-}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-}"
      shift 2
      ;;
    --site-doctypes)
      RUN_SITE_DOCTYPES="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v frappecli >/dev/null 2>&1; then
  echo "[ERROR] frappecli is not available in PATH" >&2
  exit 1
fi

echo "== Frappe CLI smoke test =="
if [[ "${RUN_SITE_DOCTYPES}" == "true" ]]; then
  echo "[INFO] Running: frappecli site doctypes"
  frappecli site doctypes
else
  echo "[INFO] Running: frappecli doc list --doctype \"${DOCTYPE}\" --limit ${LIMIT}"
  frappecli doc list --doctype "${DOCTYPE}" --limit "${LIMIT}"
fi

echo "[OK] Smoke command completed"
