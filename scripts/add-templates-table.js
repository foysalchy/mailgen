const mysql = require('mysql2/promise');

async function migrateTemplates() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mailserver',
    port: 3306,
  });

  try {
    console.log('Migrating database schema for Email Templates...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'General',
        body_html LONGTEXT NOT NULL,
        body_text TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tpl_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert some helpful starter templates if empty
    const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM email_templates');
    if (existing[0].cnt === 0) {
      await connection.query(`
        INSERT INTO email_templates (user_id, name, subject, category, body_html, body_text)
        VALUES 
        (1, 'Welcome Onboarding Email', 'Welcome to {{company}}! We are thrilled to have you', 'Onboarding', 
         '<h2>Welcome, {{name}}!</h2><p>Thank you for joining <strong>{{company}}</strong>. We are thrilled to partner with you.</p><p>If you have any questions, reply directly to this email or visit our help center.</p><br/><p>Best regards,<br/>Team {{company}}</p>',
         'Welcome {{name}}! Thank you for joining {{company}}.'),
        (1, 'Invoice / Payment Receipt', 'Your payment receipt for {{company}}', 'Billing',
         '<h2>Payment Received</h2><p>Dear {{name}},</p><p>We have received your recent payment. Your subscription is active.</p><p>Thank you for your business!</p>',
         'Dear {{name}}, we have received your recent payment.'),
        (1, 'Product Feature Announcement', 'Introducing our latest updates for {{name}}', 'Marketing',
         '<h2>Exciting News for {{company}}!</h2><p>Hi {{name}}, we have just launched several high-impact features designed to streamline your daily workflows.</p><p><a href="#" style="background:#2563eb;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;">Discover What is New</a></p>',
         'Hi {{name}}, we launched new features designed for you.')
      `);
      console.log('Sample starter templates added!');
    }

    console.log('Table email_templates ready!');
  } finally {
    await connection.end();
  }
}

migrateTemplates().catch(console.error);
