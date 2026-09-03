const mysql = require('mysql2/promise');

async function migrateApiKeys() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mailserver',
    port: 3306,
  });

  try {
    console.log('Migrating database schema for External REST Email API Keys & Logs...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        api_key VARCHAR(128) NOT NULL UNIQUE,
        sender_email VARCHAR(255) NULL,
        allowed_origins VARCHAR(255) NULL DEFAULT '*',
        status ENUM('active', 'revoked') DEFAULT 'active',
        total_requests INT DEFAULT 0,
        last_used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_api_user (user_id),
        INDEX idx_key (api_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Table api_keys created successfully!');
  } finally {
    await connection.end();
  }
}

migrateApiKeys().catch(console.error);
