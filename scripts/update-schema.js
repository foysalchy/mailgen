const mysql = require('mysql2/promise');

async function updateDb() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mailserver',
    port: 3306,
  });

  try {
    console.log('Migrating database schema for Super Admin, Labels, Folders, Schedules & Storage warnings...');

    // 1. Add Custom Folders table
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

    // 2. Add Custom Labels table
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

    // 3. Add message labels mapping
    await connection.query(`
      CREATE TABLE IF NOT EXISTS message_labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        label_id INT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES webmail_messages(id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES custom_labels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Add columns if not exists
    const [cols] = await connection.query("SHOW COLUMNS FROM webmail_messages LIKE 'custom_folder_id'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE webmail_messages ADD COLUMN custom_folder_id INT NULL DEFAULT NULL;");
      await connection.query("ALTER TABLE webmail_messages ADD COLUMN scheduled_at DATETIME NULL DEFAULT NULL;");
      await connection.query("ALTER TABLE webmail_messages ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE;");
      await connection.query("ALTER TABLE webmail_messages ADD COLUMN size_kb INT DEFAULT 15;");
    }

    // 5. Ensure Super Admin account exists
    const [superAdmin] = await connection.query("SELECT id FROM users WHERE email = 'admin@mailserver.local'");
    if (superAdmin.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(`
        INSERT INTO users (name, email, password_hash, plan_id, role, status)
        VALUES ('Super Admin', 'admin@mailserver.local', ?, 3, 'admin', 'active')
      `, [hash]);
      console.log('Super Admin account created: admin@mailserver.local / admin123');
    }

    console.log('Database upgrade completed successfully!');
  } finally {
    await connection.end();
  }
}

updateDb().catch(console.error);
