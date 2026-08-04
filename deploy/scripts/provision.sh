#!/usr/bin/env bash
#
# One-time provisioning for a fresh Ubuntu 24.04 EC2 instance.
#
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/deploy/scripts/provision.sh | bash
# or, after cloning:
#   bash deploy/scripts/provision.sh
#
# Installs Node.js 20, PM2, Nginx and Certbot, then prepares the application
# directory and log paths. Safe to re-run.

set -euo pipefail

APP_NAME="meditrack"
APP_DIR="/var/www/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
NODE_MAJOR="20"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$1"; }

if [[ $EUID -eq 0 ]]; then
  echo "Run this as the ubuntu user, not root; it calls sudo where needed." >&2
  exit 1
fi

log "Updating package index"
sudo apt-get update -y
sudo apt-get upgrade -y

log "Installing base packages"
sudo apt-get install -y curl git ufw ca-certificates gnupg

# t2.micro and t3.micro have 1 GB of RAM, which is not enough for `next build`.
if ! sudo swapon --show | grep -q '/swapfile'; then
  log "Creating a 2 GB swap file"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

if ! command -v node >/dev/null 2>&1; then
  log "Installing Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing PM2"
  sudo npm install -g pm2
fi

log "Installing Nginx and Certbot"
sudo apt-get install -y nginx certbot python3-certbot-nginx

log "Preparing ${APP_DIR} and ${LOG_DIR}"
sudo mkdir -p "${APP_DIR}" "${LOG_DIR}"
sudo chown -R "${USER}:${USER}" "${APP_DIR}" "${LOG_DIR}"

log "Configuring the host firewall"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

log "Enabling services on boot"
sudo systemctl enable --now nginx

cat <<'NEXT'

Provisioning finished.

Next steps:
  1. git clone <repo> /var/www/meditrack
  2. cp .env.example /var/www/meditrack/.env and fill in the Supabase values
  3. bash deploy/scripts/deploy.sh
  4. Point the DNS A record at this instance's Elastic IP
  5. sudo certbot --nginx -d your.domain

NEXT
