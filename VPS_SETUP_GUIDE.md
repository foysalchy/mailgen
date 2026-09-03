# MailBox Pro - Production VPS Setup & Deployment Guide

This guide provides a step-by-step walkthrough to deploy **MailBox Pro (Multi-Tenant SaaS Mail Platform)** on an **Ubuntu 22.04 / 24.04 LTS VPS** (e.g. DigitalOcean, Hetzner, Linode, AWS EC2, Contabo).

---

## 📋 Pre-requisites
1. **VPS Specifications**:
   - Ubuntu 22.04 or 24.04 LTS (64-bit).
   - Minimum 2 GB RAM (4 GB recommended for production).
   - Port 25 (SMTP Outbound) must be unblocked by your VPS provider.
2. **Domain Name**:
   - Primary domain pointing to your VPS IP:
     - `A` record: `yourdomain.com` -> `YOUR_VPS_IP`
     - `A` record: `mail.yourdomain.com` -> `YOUR_VPS_IP`
     - `MX` record: `yourdomain.com` -> Priority `10`, Target `mail.yourdomain.com`
     - `PTR / rDNS` (Reverse DNS): Configure your VPS IP's reverse DNS to `mail.yourdomain.com`.

---

## 🚀 Step 1: Connect to your VPS & Run the Setup Script

Connect to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Download and run the automated mailserver setup script:
```bash
# Clone the repository
git clone https://github.com/your-username/mailbox.git /var/www/mailbox
cd /var/www/mailbox

# Make script executable and run setup
chmod +x scripts/vps-mailserver-setup.sh
sudo ./scripts/vps-mailserver-setup.sh
```

---

## 🗄️ Step 2: Database Initialization

Initialize the database schema and default tables:
```bash
cd /var/www/mailbox

# Install project dependencies
npm install

# Run database schema migrations
node scripts/setup-db.js
node scripts/migrate-saas-multitenant.js
node scripts/migrate-mail-limits-overages.js
```

---

## ⚙️ Step 3: Configure Environment Variables

Create your production `.env.local` file:
```bash
nano /var/www/mailbox/.env.local
```

Paste and customize the following:
```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mailuser
DB_PASSWORD=StrongMailPass_2026!
DB_NAME=mailserver

NEXT_PUBLIC_APP_NAME="MailBox Pro"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
MAIL_SERVER_HOST="mail.yourdomain.com"
```

---

## 🔨 Step 4: Build & Launch with PM2 (Background Daemon)

Build the production Next.js application:
```bash
cd /var/www/mailbox
npm run build

# Start with PM2
pm2 start npm --name "mailbox" -- start

# Configure PM2 to auto-start on server reboot
pm2 startup
pm2 save
```

---

## 🌐 Step 5: Configure Nginx & Free SSL (Certbot)

Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/mailbox
```

Paste the following reverse proxy configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com mail.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and obtain free SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/mailbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain free Let's Encrypt SSL certificates
sudo certbot --nginx -d yourdomain.com -d mail.yourdomain.com
```

---

## 🛡️ Step 6: DNS Records for 10/10 Email Deliverability

Add these DNS records at your domain registrar (Cloudflare / Namecheap / GoDaddy):

| Type | Host / Name | Value / Target | Notes |
|---|---|---|---|
| **A** | `@` | `YOUR_VPS_IP` | Main App Website |
| **A** | `mail` | `YOUR_VPS_IP` | Mailserver Hostname |
| **MX** | `@` | `mail.yourdomain.com` (Priority: 10) | Mail Routing |
| **TXT** | `@` | `v=spf1 mx a ip4:YOUR_VPS_IP ~all` | SPF Record |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; sp=none; rua=mailto:admin@yourdomain.com` | DMARC Record |

---

## ✅ Step 7: Done! Access your Live SaaS Portal
Open **`https://yourdomain.com`** in your browser:
- Log in with your Super Admin account (`foysal@example.com` / `password123` or your customized admin).
- You can now register tenant companies, manage pricing packages, issue invoices, and send/receive real emails!
