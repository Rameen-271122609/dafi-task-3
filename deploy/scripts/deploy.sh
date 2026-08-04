#!/usr/bin/env bash
#
# Pull, build and restart MediTrack on the EC2 host.
#
#   cd /var/www/meditrack && bash deploy/scripts/deploy.sh
#
# Run it for every release. Provisioning is handled separately by
# deploy/scripts/provision.sh.

set -euo pipefail

APP_NAME="meditrack"
APP_DIR="/var/www/${APP_NAME}"
BRANCH="${BRANCH:-main}"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }
fail() { printf '\n\033[1;31mError:\033[0m %s\n' "$1" >&2; exit 1; }

cd "${APP_DIR}" || fail "${APP_DIR} does not exist. Run provision.sh first."

[[ -f .env ]] || fail "No .env in ${APP_DIR}. Copy .env.example and fill it in."

log "Fetching ${BRANCH}"
git fetch --all --prune
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

log "Installing dependencies"
npm ci

log "Building"
# next build reads NEXT_PUBLIC_* at build time, so the file is loaded here too.
set -a
# shellcheck disable=SC1091
source .env
set +a
npm run build

log "Restarting under PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production --update-env
else
  pm2 start ecosystem.config.js --env production
fi

pm2 save

log "Waiting for the health check"
for attempt in {1..15}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then
    log "MediTrack is up"
    pm2 status "${APP_NAME}"
    exit 0
  fi
  sleep 2
done

pm2 logs "${APP_NAME}" --lines 40 --nostream || true
fail "The app did not answer /api/health within 30 seconds."
