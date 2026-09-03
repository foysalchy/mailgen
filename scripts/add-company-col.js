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
    console.log('Ensuring company column exists in contacts table...');
    const [cols] = await connection.query("SHOW COLUMNS FROM contacts LIKE 'company'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE contacts ADD COLUMN company VARCHAR(150) NULL DEFAULT '';");
      console.log('Added company column to contacts table.');
    }
  } finally {
    await connection.end();
  }
}

updateDb().catch(console.error);
