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
    console.log('Migrating database schema for Sub-Users and Granular RBAC Permissions...');

    // 1. Add parent_id & permissions columns to users table
    const [cols] = await connection.query("SHOW COLUMNS FROM users LIKE 'parent_id'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN parent_id INT NULL DEFAULT NULL;");
      await connection.query("ALTER TABLE users ADD COLUMN permissions_json LONGTEXT NULL;");
      console.log('Added parent_id and permissions_json columns to users table.');
    }

    // 2. Add permissions_json to virtual_users (mailboxes) as well for direct mailbox permissions
    const [mbCols] = await connection.query("SHOW COLUMNS FROM virtual_users LIKE 'permissions_json'");
    if (mbCols.length === 0) {
      await connection.query("ALTER TABLE virtual_users ADD COLUMN permissions_json LONGTEXT NULL;");
      console.log('Added permissions_json to virtual_users table.');
    }

    console.log('Sub-Users & Permissions database migration complete!');
  } finally {
    await connection.end();
  }
}

updateDb().catch(console.error);
