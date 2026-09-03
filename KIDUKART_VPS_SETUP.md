# KIDUKART.COM - Production VPS Setup Sheet (IP: 62.72.12.195)

Follow these exact steps to connect **kidukart.com** with VPS IP **`62.72.12.195`**.

---

## 🌐 PART 1: Cloudflare DNS Configuration

Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) ➔ Select **`kidukart.com`** ➔ Go to **DNS Records** and add/edit the following:

| Type | Name / Host | IPv4 / Target | Proxy status | TTL | Purpose |
|---|---|---|---|---|---|
| **A** | `@` | `62.72.12.195` | **DNS Only (Gray Cloud ☁️)** | Auto | Main Webmail UI |
| **A** | `mail` | `62.72.12.195` | **DNS Only (Gray Cloud ☁️)** | Auto | Mail Server Hostname |
| **MX** | `@` | `mail.kidukart.com` | N/A (Priority: `10`) | Auto | Email Routing |
| **TXT** | `@` | `v=spf1 mx a ip4:62.72.12.195 ~all` | N/A | Auto | SPF Sender Policy |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; sp=none; rua=mailto:admin@kidukart.com` | N/A | Auto | DMARC Anti-Spoofing |

> ⚠️ **IMPORTANT**: In Cloudflare, for `mail` and `@` (Root), set the Proxy status to **DNS Only (Gray Cloud)** so that mail ports (25, 587, 993) and SSL issuance are not blocked by Cloudflare's HTTP proxy.

---

## 💻 PART 2: VPS Terminal Commands (Run as root)

### Step 1: SSH into your VPS
```bash
ssh root@62.72.12.195
```

### Step 2: Download & Run Mail Server Setup
```bash
# Clone the repository
git clone https://github.com/your-username/mailbox.git /var/www/mailbox
cd /var/www/mailbox

# Run setup script (Installs Node.js 20, MariaDB, Postfix, Dovecot, Nginx)
chmod +x scripts/vps-mailserver-setup.sh
sudo ./scripts/vps-mailserver-setup.sh
```

### Step 3: Initialize Database Tables
```bash
cd /var/www/mailbox
npm install
node scripts/setup-db.js
node scripts/migrate-saas-multitenant.js
node scripts/migrate-mail-limits-overages.js
```

### Step 4: Configure Production Environment (`.env.local`)
```bash
cat <<EOF > /var/www/mailbox/.env.local
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mailuser
DB_PASSWORD=KiduKartPass_2026!
DB_NAME=mailserver

NEXT_PUBLIC_APP_NAME="MailBox Pro"
NEXT_PUBLIC_APP_URL="https://kidukart.com"
MAIL_SERVER_HOST="mail.kidukart.com"
EOF
```

### Step 5: Build & Run Web Application with PM2
```bash
cd /var/www/mailbox
npm run build
pm2 start npm --name "mailbox" -- start
pm2 startup
pm2 save
```

### Step 6: Configure Nginx & SSL for kidukart.com
```bash
cat <<EOF > /etc/nginx/sites-available/mailbox
server {
    listen 80;
    server_name kidukart.com mail.kidukart.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/mailbox /etc/nginx/sites-enabled/ || true
nginx -t
systemctl restart nginx

# Issue Free Let's Encrypt SSL
certbot --nginx -d kidukart.com -d mail.kidukart.com --non-interactive --agree-tos -m admin@kidukart.com
```

---

## 🎯 Verification
After running the steps above, open your browser and visit:
👉 **`https://kidukart.com`**
- Super Admin Login: `foysal@example.com` / `password123`
