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

async function migrateMultiTenantSaaS() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'mailserver',
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('--- Starting Multi-Tenant SaaS Migration ---');

    // 1. Create `companies` table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        business_email VARCHAR(191) NOT NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        plan_id INT NOT NULL DEFAULT 1,
        pending_plan_id INT NULL,
        status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company_status (status),
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Verified `companies` table.');

    // 2. Ensure default company for initial/existing users
    const [compRows] = await connection.query('SELECT id FROM companies WHERE id = 1');
    if (compRows.length === 0) {
      await connection.query(`
        INSERT INTO companies (id, name, business_email, phone, plan_id, status)
        VALUES (1, 'System HQ / Default Corp', 'admin@mailserver.local', '+1 (555) 000-1111', 3, 'active');
      `);
      console.log('Seeded initial System HQ company.');
    }

    // 3. Add `company_id` to `users` table if not present
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id;
      `);
      console.log('Added `company_id` to `users` table.');
    } catch (e) {
      console.log('`company_id` already exists on `users`.');
    }

    // Update user roles to reflect SaaS roles: superadmin, company_admin, sub_user
    try {
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'user', 'superadmin', 'company_admin', 'sub_user') DEFAULT 'company_admin';
      `);
      // Update admin to superadmin
      await connection.query(`UPDATE users SET role = 'superadmin' WHERE email = 'admin@mailserver.local'`);
      console.log('Updated users role enum.');
    } catch (e) {
      console.log('Users role enum already updated.');
    }

    // 4. Add `company_id` to `virtual_domains`
    try {
      await connection.query(`
        ALTER TABLE virtual_domains 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `virtual_domains`.');
    } catch (e) {
      console.log('`company_id` in `virtual_domains` already exists.');
    }

    // 5. Add `company_id` to `virtual_users`
    try {
      await connection.query(`
        ALTER TABLE virtual_users 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `virtual_users`.');
    } catch (e) {
      console.log('`company_id` in `virtual_users` already exists.');
    }

    // 6. Add `company_id` to `invoices`
    try {
      await connection.query(`
        ALTER TABLE invoices 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `invoices`.');
    } catch (e) {
      console.log('`company_id` in `invoices` already exists.');
    }

    // 7. Add `company_id` to `email_templates`
    try {
      await connection.query(`
        ALTER TABLE email_templates 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `email_templates`.');
    } catch (e) {
      console.log('`company_id` in `email_templates` already exists.');
    }

    // 8. Add `company_id` to `api_keys`
    try {
      await connection.query(`
        ALTER TABLE api_keys 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `api_keys`.');
    } catch (e) {
      console.log('`company_id` in `api_keys` already exists.');
    }

    // 9. Add `company_id` to `contact_lists` and `bulk_campaigns`
    try {
      await connection.query(`
        ALTER TABLE contact_lists 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `contact_lists`.');
    } catch (e) {
      console.log('`company_id` in `contact_lists` already exists.');
    }

    try {
      await connection.query(`
        ALTER TABLE bulk_campaigns 
        ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id;
      `);
      console.log('Added `company_id` to `bulk_campaigns`.');
    } catch (e) {
      console.log('`company_id` in `bulk_campaigns` already exists.');
    }

    // 10. Sync existing users' company_id
    await connection.query(`UPDATE users SET company_id = 1 WHERE company_id IS NULL OR company_id = 0`);
    await connection.query(`UPDATE virtual_domains SET company_id = 1 WHERE company_id IS NULL OR company_id = 0`);
    await connection.query(`UPDATE virtual_users SET company_id = 1 WHERE company_id IS NULL OR company_id = 0`);
    await connection.query(`UPDATE invoices SET company_id = 1 WHERE company_id IS NULL OR company_id = 0`);

    console.log('--- Multi-Tenant SaaS Migration Finished Successfully! ---');
  } finally {
    await connection.end();
  }
}

migrateMultiTenantSaaS().catch(console.error);
