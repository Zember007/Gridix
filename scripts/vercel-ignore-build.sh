#!/usr/bin/env bash
# Vercel Ignored Build Step helper (ignoreCommand max 256 chars — logic lives here).
# Run with cwd = Vercel Root Directory (e.g. apps/main). Args: app slug (main|auth|...).
set -euo pipefail

if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  exit 1
fi

case "${1:-}" in
  main|agent-cabinet|partners)
    pkg_paths=(
      ../../packages/config
      ../../packages/partner-program
      ../../packages/types
      ../../packages/ui
      ../../packages/utils
    )
    ;;
  auth|superadmin)
    pkg_paths=(
      ../../packages/config
      ../../packages/types
      ../../packages/ui
      ../../packages/utils
    )
    ;;
  *)
    exit 1
    ;;
esac

exec git diff --quiet HEAD^ HEAD -- . ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json "${pkg_paths[@]}"
