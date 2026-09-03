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

function decodeQuotedPrintable(str) {
  if (!str) return '';
  // Convert soft line breaks (= followed by \r\n or \n)
  let decoded = str.replace(/=(?:\r\n|\n)/g, '');
  // Convert hex characters =XX
  try {
    decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    // Decode UTF-8 bytes if needed
    return Buffer.from(decoded, 'binary').toString('utf8');
  } catch (e) {
    return decoded.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
}

function decodeHeader(val) {
  if (!val) return '';
  return val.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, enc, text) => {
    try {
      if (enc.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString(charset || 'utf8');
      } else if (enc.toUpperCase() === 'Q') {
        return decodeQuotedPrintable(text.replace(/_/g, ' '));
      }
    } catch (e) {
      return text;
    }
    return match;
  });
}

function parsePart(partBody, partHeaders) {
  const enc = (partHeaders['content-transfer-encoding'] || '').toLowerCase().trim();
  let decoded = partBody;

  if (enc === 'base64') {
    try {
      decoded = Buffer.from(partBody.replace(/\s+/g, ''), 'base64').toString('utf8');
    } catch (e) {
      decoded = partBody;
    }
  } else if (enc === 'quoted-printable') {
    decoded = decodeQuotedPrintable(partBody);
  }

  return decoded;
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

  const fromRaw = decodeHeader(headers['from'] || 'Unknown Sender');
  let senderName = '';
  let senderEmail = fromRaw;

  if (fromRaw.includes('<') && fromRaw.includes('>')) {
    senderName = fromRaw.substring(0, fromRaw.indexOf('<')).replace(/["']/g, '').trim();
    senderEmail = fromRaw.substring(fromRaw.indexOf('<') + 1, fromRaw.indexOf('>')).trim();
  }

  const toRaw = decodeHeader(headers['to'] || '');
  const subject = decodeHeader(headers['subject'] || '(No Subject)');
  
  let bodyText = '';
  let bodyHtml = '';

  // Extract boundary if multipart email (like from Gmail/Yahoo/Apple Mail)
  const contentType = headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary="?([^";\r\n]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = bodySection.split(new RegExp(`--${boundary}(?:--)?`, 'g'));

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      const partSplit = trimmedPart.indexOf('\r\n\r\n') !== -1 ? trimmedPart.indexOf('\r\n\r\n') : trimmedPart.indexOf('\n\n');
      const rawPartHeaders = partSplit !== -1 ? trimmedPart.substring(0, partSplit) : '';
      const partBody = partSplit !== -1 ? trimmedPart.substring(partSplit).trim() : trimmedPart;

      const pHeaders = {};
      rawPartHeaders.split(/\r?\n/).forEach(l => {
        const c = l.indexOf(':');
        if (c !== -1) pHeaders[l.substring(0, c).trim().toLowerCase()] = l.substring(c + 1).trim();
      });

      const pContentType = pHeaders['content-type'] || '';
      const decodedBody = parsePart(partBody, pHeaders);

      if (pContentType.includes('text/html')) {
        bodyHtml = decodedBody;
      } else if (pContentType.includes('text/plain')) {
        bodyText = decodedBody;
      } else if (!bodyHtml && !bodyText && !pContentType.includes('application/')) {
        bodyText = decodedBody;
      }
    }
  } else {
    // Single part
    const decodedSingleBody = parsePart(bodySection, headers);

    if (contentType.includes('text/html')) {
      bodyHtml = decodedSingleBody;
      bodyText = decodedSingleBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      bodyText = decodedSingleBody;
      
      // If it is a System Bounce / Undelivered Mail
      if (fromRaw.toLowerCase().includes('daemon') || fromRaw.toLowerCase().includes('postmaster') || subject.toLowerCase().includes('undelivered')) {
        bodyHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; color: #f8fafc; max-width: 650px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid #334155; padding-bottom: 12px;">
            <div style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">⚠️</div>
            <h3 style="margin: 0; font-size: 15px; color: #fca5a5; font-weight: 700;">Mail Delivery System Notice</h3>
          </div>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin-top: 0;">Your email message could not be delivered to one or more recipients due to a remote mailserver policy or routing failure.</p>
          
          <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; margin: 15px 0; font-family: monospace; font-size: 12px; color: #e2e8f0; line-height: 1.7; overflow-x: auto; white-space: pre-wrap;">
${decodedSingleBody.trim()}
          </div>
        </div>
        `;
      } else {
        bodyHtml = '<div style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6;">' + decodedSingleBody.replace(/\n/g, '<br/>') + '</div>';
      }
    }
  }

  if (!bodyHtml && bodyText) {
    bodyHtml = '<div style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6;">' + bodyText.replace(/\n/g, '<br/>') + '</div>';
  }
  if (!bodyText && bodyHtml) {
    bodyText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return {
    sender: senderEmail,
    senderName: senderName || senderEmail,
    to: toRaw,
    subject,
    bodyText: bodyText.trim(),
    bodyHtml: bodyHtml.trim(),
    headersRaw: headerSection.trim(),
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
            "INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, headers_raw, is_read, size_kb) VALUES (?, 'inbox', ?, ?, ?, ?, ?, ?, ?, 0, ?)",
            [
              mailbox.id,
              parsed.sender,
              parsed.senderName,
              recEmail,
              parsed.subject,
              parsed.bodyHtml,
              parsed.bodyText,
              parsed.headersRaw,
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
