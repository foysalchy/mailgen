# 🚀 MailBox Pro — Complete Production VPS Deployment Guide

This guide details how to deploy **MailBox Pro (Multi-Tenant SaaS Webmail & VPS Mail Engine)** onto any fresh **Ubuntu 22.04 / 24.04 LTS** server (e.g., Hostinger, DigitalOcean, Hetzner, AWS) without manual hassle.

---

## 📋 Prerequisites & DNS Records
Before starting, point your domain records in **Cloudflare** (or your DNS registrar) to your VPS IP:

| Record Type | Host / Name | Target / Value | Proxy Status | Priority | Purpose |
|---|---|---|---|---|---|
| **A** | `@` | `YOUR_VPS_IP` | **DNS only (Gray Cloud ☁️)** | - | Main Web Platform |
| **A** | `mail` | `YOUR_VPS_IP` | **DNS only (Gray Cloud ☁️)** | - | Mail Engine Hostname |
| **MX** | `@` | `mail.yourdomain.com` | **DNS only (Gray Cloud ☁️)** | `10` | Inbound Mail Routing |
| **TXT (SPF)** | `@` | `v=spf1 ip4:YOUR_VPS_IP ~all` | **DNS only (Gray Cloud ☁️)** | - | SPF Authentication |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=none; sp=none;` | **DNS only (Gray Cloud ☁️)** | - | Anti-Spoofing Policy |

> ⚠️ **Hostinger PTR / Reverse DNS Note**: In your VPS Control Panel ➔ IP Management, set PTR for `YOUR_VPS_IP` to `mail.yourdomain.com` to prevent Gmail spam.

---

## ⚡ Step-by-Step Installation (On Fresh VPS)

### 1️⃣ Clone Repository
```bash
# Clone to /var/www/html/mailbox
git clone https://github.com/foysalchy/mailgen.git /var/www/html/mailbox
cd /var/www/html/mailbox
```

### 2️⃣ Run Automated VPS Mail Engine Setup
This script automatically installs Postfix, Dovecot, OpenDKIM, Node.js 20, PM2, UFW firewall rules, and configures the incoming pipe delivery daemon:
```bash
chmod +x scripts/vps-mailserver-setup.sh
sudo ./scripts/vps-mailserver-setup.sh
```

### 3️⃣ Configure Environment Variables (`.env.local`)
```bash
cat <<EOF > /var/www/html/mailbox/.env.local
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourDatabasePassword
DB_NAME=mailserver

NEXT_PUBLIC_APP_NAME="MailBox Pro"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
MAIL_SERVER_HOST="mail.yourdomain.com"
EOF
```

### 4️⃣ Install Dependencies & Initialize Database Schema
```bash
cd /var/www/html/mailbox
npm install

# Run database setup & SaaS multitenant migrations
node scripts/setup-db.js
node scripts/migrate-saas-multitenant.js
node scripts/migrate-mail-limits-overages.js
```

### 5️⃣ Build Next.js & Start with PM2
```bash
npm run build
pm2 start npm --name "mailbox-app" -- start
pm2 startup
pm2 save
```

---

## 🌐 Web Server & Reverse Proxy Setup

### Option A: If using Apache (with phpMyAdmin / LAMP)
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers

sudo tee /etc/apache2/sites-available/mailbox.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias mail.yourdomain.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # WebSockets Support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:3000/\$1" [P,L]

    ErrorLog \${APACHE_LOG_DIR}/mailbox_error.log
    CustomLog \${APACHE_LOG_DIR}/mailbox_access.log combined
</VirtualHost>
EOF

sudo a2ensite mailbox.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### Option B: If using Nginx (LEMP)
```bash
sudo tee /etc/nginx/sites-available/mailbox > /dev/null <<EOF
server {
    listen 80;
    server_name yourdomain.com mail.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/mailbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Install Free SSL Certificate (HTTPS)
```bash
# If using Apache:
sudo certbot --apache -d yourdomain.com -d mail.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com

# If using Nginx:
sudo certbot --nginx -d yourdomain.com -d mail.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
```

---

## 🔑 Default Super Admin Login Credentials
- **Email**: `foysal@example.com`
- **Password**: `password123`

---

## 🔄 Updating to Latest Changes in Future
Whenever updates are pushed to GitHub, run:
```bash
cd /var/www/html/mailbox
git pull origin main
node scripts/setup-db.js
npm run build
pm2 restart mailbox-app
```

