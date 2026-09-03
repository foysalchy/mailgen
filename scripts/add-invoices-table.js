const mysql = require('mysql2/promise');

async function migrateInvoices() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mailserver',
    port: 3306,
  });

  try {
    console.log('Migrating database schema for Invoices and Plan Upgrades...');

    // 1. Create Invoices Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        invoice_number VARCHAR(60) NOT NULL UNIQUE,
        plan_id INT NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        billing_cycle VARCHAR(30) DEFAULT 'monthly',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'card',
        transaction_id VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        INDEX idx_inv_user (user_id),
        INDEX idx_inv_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Add pending_plan_id to users table if not present
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN pending_plan_id INT NULL AFTER plan_id;
      `);
      console.log('Added pending_plan_id to users table.');
    } catch (e) {
      console.log('Column pending_plan_id already exists or ignored.');
    }

    // 3. Populate existing users' registration invoice if empty
    const [invCount] = await connection.query('SELECT COUNT(*) as cnt FROM invoices');
    if (invCount[0].cnt === 0) {
      const [users] = await connection.query(`
        SELECT u.id, u.name, u.email, u.plan_id, p.name as plan_name, p.price_monthly, u.status
        FROM users u 
        LEFT JOIN plans p ON u.plan_id = p.id
      `);

      for (const u of users) {
        if (u.plan_id) {
          const invNum = `INV-${new Date().getFullYear()}-${String(u.id).padStart(4, '0')}-01`;
          await connection.query(`
            INSERT INTO invoices (user_id, invoice_number, plan_id, plan_name, amount, status, payment_method, transaction_id, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, 'online_gateway', 'INITIAL_SIGNUP', ?)
          `, [
            u.id,
            invNum,
            u.plan_id,
            u.plan_name || 'Standard Plan',
            u.price_monthly || 19.99,
            u.status === 'active' ? 'approved' : 'pending',
            u.status === 'active' ? new Date() : null,
          ]);
        }
      }
      console.log('Initial invoices populated for existing accounts.');
    }

    console.log('Invoices and Upgrade migrations completed successfully!');
  } finally {
    await connection.end();
  }
}

migrateInvoices().catch(console.error);
