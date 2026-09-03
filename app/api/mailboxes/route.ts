import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET mailboxes for user or specific domain
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const userId = searchParams.get('userId') || '1';
    const companyId = searchParams.get('companyId');

    let query = `
      SELECT u.id, u.email, u.full_name, u.quota_mb, u.is_active, u.created_at, d.name AS domain_name,
        (SELECT COUNT(*) FROM webmail_messages WHERE mailbox_id = u.id AND folder = 'inbox' AND is_read = 0) AS unread_count,
        (SELECT COUNT(*) FROM webmail_messages WHERE mailbox_id = u.id) AS total_messages
      FROM virtual_users u
      JOIN virtual_domains d ON u.domain_id = d.id
    `;
    const params: any[] = [];

    if (companyId) {
      query += ' WHERE u.company_id = ?';
      params.push(companyId);
    } else {
      query += ' WHERE u.user_id = ?';
      params.push(userId);
    }

    if (domainId) {
      query += ' AND u.domain_id = ?';
      params.push(domainId);
    }

    query += ' ORDER BY u.created_at DESC';

    const [mailboxes]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, mailboxes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new mailbox (e.g. foysal@domain.com)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domainId, username, password, fullName, quotaMb = 2048, userId = 1, companyId } = body;

    if (!domainId || !username || !password) {
      return NextResponse.json({ success: false, message: 'Missing required mailbox fields' }, { status: 400 });
    }

    // Resolve company_id if not explicitly provided
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && userId) {
      const [uRows]: any = await pool.query('SELECT company_id FROM users WHERE id = ?', [userId]);
      resolvedCompanyId = uRows[0]?.company_id || 1;
    }

    // Get domain info
    const [domains]: any = await pool.query('SELECT * FROM virtual_domains WHERE id = ?', [domainId]);
    if (domains.length === 0) {
      return NextResponse.json({ success: false, message: 'Domain not found' }, { status: 404 });
    }

    const domain = domains[0];
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const email = `${cleanUsername}@${domain.name}`;

    // Check if email already exists
    const [existing]: any = await pool.query('SELECT id FROM virtual_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: `The mailbox '${email}' already exists.` }, { status: 409 });
    }

    // Hash password with Dovecot compatible SHA-512 crypt or bcrypt
    // {BLF-CRYPT} or standard bcrypt is universally supported by Dovecot & Postfix
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Prefix {BLF-CRYPT} so Dovecot recognizes standard bcrypt hash in MySQL
    const dovecotPassword = `{BLF-CRYPT}${hashedPassword}`;

    const [result]: any = await pool.query(
      `INSERT INTO virtual_users (company_id, domain_id, user_id, email, password, full_name, quota_mb)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resolvedCompanyId || 1, domainId, userId, email, dovecotPassword, fullName || cleanUsername, quotaMb]
    );

    const mailboxId = result.insertId;

    // Add a welcome email in webmail_messages (Compatible with both Dark & Light Themes)
    await pool.query(
      `INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read)
       VALUES (?, 'inbox', 'support@system.local', 'Mail Server Administrator', ?, 'Welcome to your new Professional Mailbox!', ?, ?, 0)`,
      [
        mailboxId,
        email,
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; line-height: 1.6; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">✉</div>
            <h2 style="color: #60a5fa; margin: 0; font-size: 20px; font-weight: 700;">Welcome to your new Mailbox!</h2>
          </div>
          <p style="color: #cbd5e1; font-size: 14px; margin-top: 0;">Your email account <strong style="color: #ffffff; background: #1e293b; padding: 2px 8px; border-radius: 6px;">${email}</strong> has been provisioned and is 100% active for sending & receiving.</p>
          
          <div style="background-color: #1e293b; border: 1px solid #334155; padding: 18px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #93c5fd; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; font-weight: 700;">⚙️ External Mail Client Settings (Outlook, Apple Mail, Thunderbird):</h3>
            <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 13px; color: #e2e8f0; line-height: 1.8;">
              <div>• <strong>IMAP Server:</strong> <span style="color: #38bdf8;">mail.kidukart.com</span> (Port: 993, SSL/TLS)</div>
              <div>• <strong>SMTP Server:</strong> <span style="color: #38bdf8;">mail.kidukart.com</span> (Port: 587 or 465, STARTTLS/SSL)</div>
              <div>• <strong>Username:</strong> <span style="color: #a7f3d0;">${email}</span></div>
              <div>• <strong>Password:</strong> (Your mailbox password)</div>
            </div>
          </div>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Protected with End-to-End TLS Encryption & Spam Protection • MailBox Pro Platform</p>
        </div>
        `,
        `Welcome to your new mailbox: ${email}\n\nYour mailbox has been successfully provisioned.\n\nSettings:\nIMAP: mail.kidukart.com (Port: 993)\nSMTP: mail.kidukart.com (Port: 587/465)\nUsername: ${email}`,
      ]
    );

    return NextResponse.json({
      success: true,
      mailbox: {
        id: mailboxId,
        email,
        full_name: fullName,
        quota_mb: quotaMb,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
