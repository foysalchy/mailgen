const fs = require('fs');
const mysql = require('mysql2/promise');

const env = fs.readFileSync('.env.local', 'utf8');
let conf = {};
env.split('\n').forEach((l) => {
  const [k, ...v] = l.trim().split('=');
  if (k && v.length) {
    conf[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function check() {
  const conn = await mysql.createConnection({
    host: conf.DB_HOST || '127.0.0.1',
    port: Number(conf.DB_PORT) || 3306,
    user: conf.DB_USER || 'root',
    password: conf.DB_PASSWORD || '',
    database: conf.DB_NAME || 'mailserver',
  });

  const [tables] = await conn.query('SHOW TABLES');
  console.log('Existing tables in database:', tables.map((t) => Object.values(t)[0]));

  await conn.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      api_key VARCHAR(255) NOT NULL UNIQUE,
      sender_email VARCHAR(255) NULL,
      allowed_origins TEXT NULL,
      status ENUM('active', 'revoked') DEFAULT 'active',
      total_requests INT DEFAULT 0,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id),
      INDEX (api_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ api_keys table verified/created successfully!');
  await conn.end();
}

check().catch(console.error);
