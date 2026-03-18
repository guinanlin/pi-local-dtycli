#!/usr/bin/env bash

set -euo pipefail

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "[PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "[FAIL] $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

check_command() {
  local cmd="$1"
  if command -v "${cmd}" >/dev/null 2>&1; then
    pass "Command available: ${cmd}"
  else
    fail "Command not found in PATH: ${cmd}"
  fi
}

echo "== Verify Pi Local DTY CLI runtime =="

check_command "pi"
if command -v pi >/dev/null 2>&1; then
  if pi --list-models >/tmp/pi_models.out 2>/tmp/pi_models.err; then
    if [[ -s /tmp/pi_models.out ]]; then
      pass "pi --list-models returned models"
    else
      fail "pi --list-models succeeded but output is empty"
    fi
  else
    fail "pi --list-models failed: $(tr '\n' ' ' </tmp/pi_models.err)"
  fi
fi

check_command "frappecli"
if command -v frappecli >/dev/null 2>&1; then
  if frappecli --help >/tmp/frappecli_help.out 2>/tmp/frappecli_help.err; then
    pass "frappecli --help works"
  else
    fail "frappecli --help failed: $(tr '\n' ' ' </tmp/frappecli_help.err)"
  fi
fi

if [[ -f "${HOME}/.config/frappecli/config.yaml" ]]; then
  pass "Found frappecli config file: ${HOME}/.config/frappecli/config.yaml"
elif [[ -n "${FRAPPECLI_URL:-}" ]] || [[ -n "${FRAPPECLI_API_KEY:-}" ]] || [[ -n "${FRAPPECLI_API_SECRET:-}" ]]; then
  pass "Detected frappecli-related env vars"
else
  fail "No frappecli config file or env-based credential hints detected"
fi

if [[ -n "${PAPERCLIP_API_URL:-}" ]] || [[ -n "${PAPERCLIP_API_KEY:-}" ]]; then
  pass "Detected PAPERCLIP_* environment hints"
else
  echo "[WARN] PAPERCLIP_* variables are not set in current shell (this can be normal outside platform runtime)"
fi

echo
echo "Summary: PASS=${PASS_COUNT}, FAIL=${FAIL_COUNT}"

if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
