const mysql = require('mysql2/promise');

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('Connecting to MySQL and setting up mailserver database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS `mailserver` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE `mailserver`;');

    // 1. Subscription Plans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        max_domains INT NOT NULL DEFAULT 1,
        max_mailboxes INT NOT NULL DEFAULT 5,
        storage_quota_mb INT NOT NULL DEFAULT 2048,
        bulk_mail_daily_limit INT NOT NULL DEFAULT 500,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        parent_id INT NULL,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        plan_id INT DEFAULT 1,
        pending_plan_id INT NULL,
        role ENUM('superadmin', 'admin', 'company_admin', 'user') DEFAULT 'company_admin',
        status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
        permissions_json LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // Ensure users columns exist if table was created previously
    const userColumnsToAdd = [
      { name: 'company_id', type: 'INT NULL' },
      { name: 'parent_id', type: 'INT NULL' },
      { name: 'pending_plan_id', type: 'INT NULL' },
      { name: 'permissions_json', type: 'LONGTEXT NULL' },
    ];
    for (const col of userColumnsToAdd) {
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }
    try {
      await connection.query(`ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'admin', 'company_admin', 'user') DEFAULT 'company_admin'`);
    } catch (e) {}

    // 3. Virtual Domains Table (Compatible with Postfix / Dovecot VPS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS virtual_domains (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(191) UNIQUE NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(100) NULL,
        dkim_selector VARCHAR(50) DEFAULT 'mail',
        dkim_public_key TEXT NULL,
        dkim_private_key TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Virtual Users / Mailboxes Table (Compatible with Postfix / Dovecot VPS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS virtual_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain_id INT NOT NULL,
        user_id INT NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        quota_mb INT DEFAULT 2048,
        is_active BOOLEAN DEFAULT TRUE,
        full_name VARCHAR(150) DEFAULT '',
        signature LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES virtual_domains(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    try {
      await connection.query('ALTER TABLE virtual_users ADD COLUMN signature LONGTEXT NULL AFTER full_name');
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE virtual_users ADD COLUMN role VARCHAR(50) DEFAULT 'user'");
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE virtual_users ADD COLUMN permissions_json LONGTEXT NULL');
    } catch (e) {}

    // 5. Virtual Aliases & Forwarders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS virtual_aliases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain_id INT NOT NULL,
        source VARCHAR(191) NOT NULL,
        destination VARCHAR(191) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES virtual_domains(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 6. Webmail Messages Store
    await connection.query(`
      CREATE TABLE IF NOT EXISTS webmail_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mailbox_id INT NOT NULL,
        folder ENUM('inbox', 'sent', 'drafts', 'spam', 'trash', 'archive') DEFAULT 'inbox',
        custom_folder_id INT NULL DEFAULT NULL,
        sender VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NULL,
        recipients TEXT NOT NULL,
        subject VARCHAR(500) DEFAULT '(No Subject)',
        body_text LONGTEXT NULL,
        body_html LONGTEXT NULL,
        has_attachments BOOLEAN DEFAULT FALSE,
        attachments_json LONGTEXT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        is_scheduled BOOLEAN DEFAULT FALSE,
        scheduled_at DATETIME NULL DEFAULT NULL,
        size_kb INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mailbox_id) REFERENCES virtual_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Ensure extra message columns exist
    const msgColsToAdd = [
      { name: 'custom_folder_id', type: 'INT NULL DEFAULT NULL' },
      { name: 'scheduled_at', type: 'DATETIME NULL DEFAULT NULL' },
      { name: 'is_scheduled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'size_kb', type: 'INT DEFAULT 15' },
      { name: 'headers_raw', type: 'LONGTEXT NULL' },
    ];
    for (const col of msgColsToAdd) {
      try {
        await connection.query(`ALTER TABLE webmail_messages ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }

    // Custom Folders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS custom_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mailbox_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(30) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mailbox_id) REFERENCES virtual_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Custom Labels Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS custom_labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(30) DEFAULT '#10b981',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Message Labels Mapping Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS message_labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        label_id INT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES webmail_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES custom_labels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 7. Bulk Mail / Marketing Campaigns
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        list_id INT NOT NULL,
        email VARCHAR(191) NOT NULL,
        name VARCHAR(150) NULL,
        is_unsubscribed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bulk_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        mailbox_id INT NOT NULL,
        list_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html LONGTEXT NOT NULL,
        status ENUM('draft', 'queued', 'sending', 'completed', 'failed') DEFAULT 'draft',
        total_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mailbox_id) REFERENCES virtual_users(id) ON DELETE CASCADE,
        FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 8. Invoices Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        user_id INT NULL,
        invoice_number VARCHAR(60) NOT NULL UNIQUE,
        plan_id INT NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        base_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        overage_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        extra_sent_count INT NOT NULL DEFAULT 0,
        extra_received_count INT NOT NULL DEFAULT 0,
        billing_cycle VARCHAR(30) DEFAULT 'monthly',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'card',
        transaction_id VARCHAR(100) NULL,
        notes TEXT NULL,
        due_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        INDEX idx_inv_company (company_id),
        INDEX idx_inv_user (user_id),
        INDEX idx_inv_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Email Templates Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        user_id INT NULL,
        name VARCHAR(150) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html LONGTEXT NOT NULL,
        body_text LONGTEXT NULL,
        category VARCHAR(50) DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tpl_company (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. API Keys Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        user_id INT NULL,
        name VARCHAR(100) NOT NULL,
        api_key VARCHAR(100) NOT NULL UNIQUE,
        sender_email VARCHAR(191) NULL,
        status ENUM('active', 'revoked') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP NULL,
        INDEX idx_key_company (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default plans if not exists
    const [plans] = await connection.query('SELECT COUNT(*) as cnt FROM plans');
    if (plans[0].cnt === 0) {
      await connection.query(`
        INSERT INTO plans (name, slug, price_monthly, max_domains, max_mailboxes, storage_quota_mb, bulk_mail_daily_limit)
        VALUES 
        ('Starter Plan', 'starter', 9.99, 1, 5, 2048, 500),
        ('Business Pro', 'business-pro', 29.99, 5, 25, 10240, 5000),
        ('Enterprise Mail', 'enterprise', 79.99, 20, 100, 51200, 25000);
      `);
      console.log('Seeded default plans.');
    }

    // Seed Demo User if not exists
    const [users] = await connection.query('SELECT COUNT(*) as cnt FROM users');
    if (users[0].cnt === 0) {
      await connection.query(`
        INSERT INTO users (name, email, password_hash, plan_id, role)
        VALUES ('Foysal Ahmed', 'foysal@example.com', 'password123', 2, 'admin');
      `);
      console.log('Seeded demo user.');
    }

    console.log('Database tables verified and ready!');
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
