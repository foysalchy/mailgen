#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

let dbHost = '127.0.0.1';
let dbPort = 3306;
let dbUser = 'root';
let dbPass = 'Root@2025';
let dbName = 'mailserver';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key === 'DB_HOST') dbHost = val;
        if (key === 'DB_PORT') dbPort = Number(val);
        if (key === 'DB_USER') dbUser = val;
        if (key === 'DB_PASSWORD') dbPass = val;
        if (key === 'DB_NAME') dbName = val;
      }
    }
  });
}

function parseRawEmail(raw) {
  const headerEnd = raw.indexOf('\r\n\r\n') !== -1 ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n');
  const headerSection = headerEnd !== -1 ? raw.substring(0, headerEnd) : raw;
  const bodySection = headerEnd !== -1 ? raw.substring(headerEnd).trim() : '';

  const headers = {};
  const headerLines = headerSection.split(/\r?\n/);
  let currentKey = '';

  for (const line of headerLines) {
    if (/^\s+/.test(line) && currentKey) {
      headers[currentKey] += ' ' + line.trim();
    } else {
      const colIdx = line.indexOf(':');
      if (colIdx !== -1) {
        currentKey = line.substring(0, colIdx).trim().toLowerCase();
        headers[currentKey] = line.substring(colIdx + 1).trim();
      }
    }
  }

  const fromRaw = headers['from'] || 'Unknown Sender';
  let senderName = '';
  let senderEmail = fromRaw;

  if (fromRaw.includes('<') && fromRaw.includes('>')) {
    senderName = fromRaw.substring(0, fromRaw.indexOf('<')).replace(/["']/g, '').trim();
    senderEmail = fromRaw.substring(fromRaw.indexOf('<') + 1, fromRaw.indexOf('>')).trim();
  }

  const toRaw = headers['to'] || '';
  const subject = headers['subject'] || '(No Subject)';
  
  let bodyText = bodySection;
  let bodyHtml = '';

  if (bodySection.includes('<html') || bodySection.includes('<body') || bodySection.includes('</div>') || bodySection.includes('</p>')) {
    bodyHtml = bodySection;
    bodyText = bodySection.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    bodyText = bodySection;
    bodyHtml = '<p>' + bodySection.replace(/\n/g, '<br/>') + '</p>';
  }

  return {
    sender: senderEmail,
    senderName: senderName || senderEmail,
    to: toRaw,
    subject,
    bodyText,
    bodyHtml,
    sizeKb: Math.ceil(Buffer.byteLength(raw, 'utf8') / 1024),
  };
}

async function main() {
  const chunks = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk));
  process.stdin.on('end', async () => {
    const rawEmail = Buffer.concat(chunks).toString('utf8');
    if (!rawEmail) return;

    try {
      const parsed = parseRawEmail(rawEmail);
      const recipientArg = process.argv[2] || parsed.to;
      const cleanRecipients = recipientArg.split(',').map((e) => {
        if (e.includes('<') && e.includes('>')) {
          return e.substring(e.indexOf('<') + 1, e.indexOf('>')).toLowerCase().trim();
        }
        return e.replace(/["']/g, '').toLowerCase().trim();
      });

      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPass,
        database: dbName,
      });

      for (const recEmail of cleanRecipients) {
        if (!recEmail) continue;
        const [users] = await connection.query(
          'SELECT u.id, u.company_id FROM virtual_users u WHERE u.email = ?',
          [recEmail]
        );

        if (users.length > 0) {
          const mailbox = users[0];

          await connection.query(
            "INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read, size_kb) VALUES (?, 'inbox', ?, ?, ?, ?, ?, ?, 0, ?)",
            [
              mailbox.id,
              parsed.sender,
              parsed.senderName,
              recEmail,
              parsed.subject,
              parsed.bodyHtml,
              parsed.bodyText,
              parsed.sizeKb,
            ]
          );

          if (mailbox.company_id) {
            await connection.query(
              'UPDATE companies SET month_received_count = month_received_count + 1 WHERE id = ?',
              [mailbox.company_id]
            );
          }
        }
      }

      await connection.end();
    } catch (err) {
      console.error('Mail pipe delivery error:', err);
    }
  });
}

main().catch(console.error);
