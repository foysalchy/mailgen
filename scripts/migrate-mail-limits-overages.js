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

async function migrateMailLimitsAndOverages() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'mailserver',
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('--- Migrating Mail Limits, Overages & Company Usage ---');

    // 1. Add send_limit, receive_limit, extra_send_rate, extra_receive_rate to plans table
    const planCols = [
      { name: 'send_limit', type: 'INT NOT NULL DEFAULT 500' },
      { name: 'receive_limit', type: 'INT NOT NULL DEFAULT 1000' },
      { name: 'extra_send_rate', type: 'DECIMAL(6,4) NOT NULL DEFAULT 0.0500' }, // e.g., $0.05 per extra sent mail
      { name: 'extra_receive_rate', type: 'DECIMAL(6,4) NOT NULL DEFAULT 0.0200' }, // e.g., $0.02 per extra received mail
    ];

    for (const col of planCols) {
      try {
        await connection.query(`ALTER TABLE plans ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} to plans table.`);
      } catch (e) {
        console.log(`${col.name} already exists in plans.`);
      }
    }

    // 2. Update existing default plans with realistic tiers
    await connection.query(`
      UPDATE plans 
      SET send_limit = 500, receive_limit = 1000, extra_send_rate = 0.05, extra_receive_rate = 0.02
      WHERE id = 1;
    `);
    await connection.query(`
      UPDATE plans 
      SET send_limit = 2500, receive_limit = 5000, extra_send_rate = 0.03, extra_receive_rate = 0.015
      WHERE id = 2;
    `);
    await connection.query(`
      UPDATE plans 
      SET send_limit = 10000, receive_limit = 20000, extra_send_rate = 0.02, extra_receive_rate = 0.01
      WHERE id = 3;
    `);

    // 3. Add current month send/receive tracking & overage charges to companies table
    const companyCols = [
      { name: 'month_sent_count', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'month_received_count', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'accumulated_overage_charge', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00' },
      { name: 'billing_cycle_start', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ];

    for (const col of companyCols) {
      try {
        await connection.query(`ALTER TABLE companies ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} to companies table.`);
      } catch (e) {
        console.log(`${col.name} already exists in companies.`);
      }
    }

    // 4. Update invoices table to support itemized breakdown (plan base price, overage charges, overage counts)
    const invoiceCols = [
      { name: 'base_amount', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00' },
      { name: 'overage_amount', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00' },
      { name: 'extra_sent_count', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'extra_received_count', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'due_date', type: 'DATE NULL' },
    ];

    for (const col of invoiceCols) {
      try {
        await connection.query(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} to invoices table.`);
      } catch (e) {
        console.log(`${col.name} already exists in invoices.`);
      }
    }

    // Synchronize base_amount with amount for existing records
    await connection.query(`UPDATE invoices SET base_amount = amount WHERE base_amount = 0.00`);

    console.log('--- Mail Limits, Overages & Usage Migration Completed Successfully! ---');
  } finally {
    await connection.end();
  }
}

migrateMailLimitsAndOverages().catch(console.error);
