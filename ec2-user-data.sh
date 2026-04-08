#!/bin/bash
# =============================================================================
# EC2 User Data — AuthEngine bootstrap script
# Tested on: Ubuntu 22.04 LTS / 24.04 LTS
#
# What this does:
#   1. Updates the system and installs Docker + Docker Compose v2 + Git
#   2. Clones the repo
#   3. Writes the .env file from instance metadata / environment substitution
#   4. Builds and starts all containers via docker compose
#   5. Enables the stack to restart on reboot via systemd
# =============================================================================
set -euo pipefail
exec > /var/log/user-data.log 2>&1   # log everything for debugging

# ── 1. System update + Docker install ────────────────────────────────────────
apt-get update -y
apt-get install -y ca-certificates curl gnupg git

# Add Docker's official GPG key and repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl enable --now docker

# Allow ubuntu user to run docker without sudo
usermod -aG docker ubuntu

# ── 2. Clone the repository ───────────────────────────────────────────────────
REPO_URL="https://github.com/KirkYagami/auth-system.git"
APP_DIR="/opt/auth-system"

git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# ── 3. Write backend .env ─────────────────────────────────────────────────────
# ⚠️  Replace every value below before launching the instance,
#     or inject them via EC2 Parameter Store / Secrets Manager.
#     Never commit real secrets to the repo.

cat > "$APP_DIR/backend/.env" <<'ENV'
# MongoDB
MONGO_URI=mongodb://admin:secret@mongo:27017/auth_db?authSource=admin
DATABASE_NAME=auth_db

# JWT  ← CHANGE THIS to a long random string
JWT_SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=REPLACE_WITH_YOUR_EMAIL
SMTP_PASSWORD=REPLACE_WITH_APP_PASSWORD
EMAIL_FROM=REPLACE_WITH_YOUR_EMAIL

# AWS S3 (leave blank to disable profile image upload)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=
S3_PROFILE_IMAGE_PREFIX=profile-images

# CORS — add your EC2 public IP or domain here
CORS_ORIGINS=http://localhost,http://localhost:80
ENV

# ── 4. Build and start the full stack ─────────────────────────────────────────
cd "$APP_DIR"
docker compose build --no-cache
docker compose up -d

# ── 5. Systemd service — restart the stack on instance reboot ─────────────────
cat > /etc/systemd/system/auth-engine.service <<SERVICE
[Unit]
Description=AuthEngine Docker Compose stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/auth-system
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable auth-engine.service

echo "========================================"
echo "AuthEngine bootstrap complete."
echo "Frontend : http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Logs     : docker compose -f /opt/auth-system/docker-compose.yml logs -f"
echo "========================================"
