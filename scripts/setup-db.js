const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: 3306,
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
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        plan_id INT DEFAULT 1,
        role ENUM('admin', 'user') DEFAULT 'user',
        status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES virtual_domains(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mailbox_id) REFERENCES virtual_users(id) ON DELETE CASCADE
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
