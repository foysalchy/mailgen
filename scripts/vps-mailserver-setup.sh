#!/bin/bash
# ==============================================================================
# MailBox Pro - Production VPS Setup Script (Ubuntu 22.04 / 24.04 LTS)
# Installs: Node.js 20, PM2, Nginx, MariaDB, Postfix, Dovecot, OpenDKIM, Certbot
# Fully integrates dynamic virtual domains & mailboxes with MailBox Pro SaaS DB
# ==============================================================================

set -e

# Configuration Variables - Tailored for kidukart.com
DB_NAME="mailserver"
DB_USER="root"
DB_PASS="Root@2025"
MAIN_DOMAIN="kidukart.com"
MAIL_HOSTNAME="mail.kidukart.com"

echo "====================================================================="
echo "   Starting MailBox Pro Complete Production VPS Installation"
echo "====================================================================="

# 1. System Update
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies (MariaDB, Nginx, Postfix, Dovecot, OpenDKIM, Certbot, Git, Curl)
echo "[2/8] Installing Web, Database, and Mail server packages..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl \
  git \
  nginx \
  mariadb-server \
  mariadb-client \
  postfix \
  postfix-mysql \
  dovecot-core \
  dovecot-imapd \
  dovecot-pop3d \
  dovecot-lmtpd \
  dovecot-mysql \
  opendkim \
  opendkim-tools \
  certbot \
  python3-certbot-nginx \
  ufw

# 3. Install Node.js 20 LTS & PM2
echo "[3/8] Installing Node.js 20 LTS and PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 4. Create vmail user for storing all tenant emails
echo "[4/8] Configuring vmail storage user..."
sudo groupadd -g 5000 vmail || true
sudo useradd -g vmail -u 5000 vmail -d /var/mail/vmail -m || true
sudo chown -R vmail:vmail /var/mail/vmail
sudo chmod -R 770 /var/mail/vmail

# 5. Configure MariaDB Database & Users
echo "[5/8] Setting up MariaDB database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 6. Configure Postfix for MySQL Virtual Domains & Users
echo "[6/8] Configuring Postfix virtual lookup maps..."

# Postfix: Virtual Domains Lookup
sudo tee /etc/postfix/mysql-virtual-mailbox-domains.cf > /dev/null <<EOF
user = ${DB_USER}
password = ${DB_PASS}
hosts = 127.0.0.1
dbname = ${DB_NAME}
query = SELECT 1 FROM virtual_domains WHERE name='%s' AND is_verified=1
EOF

# Postfix: Virtual Mailboxes Lookup
sudo tee /etc/postfix/mysql-virtual-mailbox-maps.cf > /dev/null <<EOF
user = ${DB_USER}
password = ${DB_PASS}
hosts = 127.0.0.1
dbname = ${DB_NAME}
query = SELECT 1 FROM virtual_users WHERE email='%s'
EOF

sudo chmod 640 /etc/postfix/mysql-virtual-*.cf
sudo chgrp postfix /etc/postfix/mysql-virtual-*.cf

# Main Postfix config
sudo tee -a /etc/postfix/main.cf > /dev/null <<EOF

# MailBox Pro Virtual Mailbox Settings
myhostname = ${MAIL_HOSTNAME}
mydestination = localhost
virtual_mailbox_domains = mysql:/etc/postfix/mysql-virtual-mailbox-domains.cf
virtual_mailbox_maps = mysql:/etc/postfix/mysql-virtual-mailbox-maps.cf
virtual_transport = lmtp:unix:private/dovecot-lmtp
smtputf8_enable = no
EOF

# 7. Configure Dovecot for MySQL Auth & Storage
echo "[7/8] Configuring Dovecot SQL authentication..."
sudo tee /etc/dovecot/dovecot-sql.conf.ext > /dev/null <<EOF
driver = mysql
connect = "host=127.0.0.1 dbname=${DB_NAME} user=${DB_USER} password=${DB_PASS}"
default_pass_scheme = BLF-CRYPT
password_query = SELECT email as user, password_hash as password FROM virtual_users WHERE email='%u'
user_query = SELECT '/var/mail/vmail/%d/%n' as home, 5000 as uid, 5000 as gid, concat('*:storage=', quota_mb, 'M') as quota_rule FROM virtual_users WHERE email='%u'
EOF

sudo chmod 600 /etc/dovecot/dovecot-sql.conf.ext

# 8. Firewall Configuration (UFW)
echo "[8/8] Configuring firewall rules (SSH, HTTP, HTTPS, SMTP, IMAP)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 465/tcp   # SMTPS
sudo ufw allow 587/tcp   # Submission
sudo ufw allow 993/tcp   # IMAPS
sudo ufw allow 995/tcp   # POP3S
sudo ufw --force enable

# Restart services
sudo systemctl restart mariadb
sudo systemctl restart postfix
sudo systemctl restart dovecot
sudo systemctl restart nginx

echo "====================================================================="
echo "   VPS Environment Setup Completed Successfully!"
echo "   Next Steps:"
echo "   1. Clone repository to /var/www/mailbox"
echo "   2. Run 'npm install && npm run build'"
echo "   3. Start with PM2: 'pm2 start npm --name mailbox -- start'"
echo "   4. Configure Nginx Reverse Proxy with Certbot SSL"
echo "====================================================================="
