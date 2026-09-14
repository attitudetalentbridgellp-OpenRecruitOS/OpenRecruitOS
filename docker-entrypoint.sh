#!/bin/sh
# OpenRecruitOS Community Edition — container entrypoint
set -e

echo "[entrypoint] Syncing database schema (prisma db push)…"
bunx prisma db push --accept-data-loss --skip-generate

if [ "$SEED_DEMO_DATA" = "true" ]; then
  echo "[entrypoint] Seeding demo data (SEED_DEMO_DATA=true)…"
  bun scripts/seed.ts || echo "[entrypoint] Seed skipped (may already exist)"
fi

echo "[entrypoint] Starting OpenRecruitOS on port ${PORT:-3000}…"
exec bun server.js
