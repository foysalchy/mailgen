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

    // Add a welcome email in webmail_messages
    await pool.query(
      `INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, is_read)
       VALUES (?, 'inbox', 'support@system.local', 'Mail Server Administrator', ?, 'Welcome to your new Professional Mailbox!', ?, 0)`,
      [
        mailboxId,
        email,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #2563eb; margin-bottom: 12px;">Welcome to your new mailbox: ${email}</h2>
          <p>Your mailbox has been successfully provisioned and is ready for sending and receiving professional emails.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="color: #0f172a; font-size: 16px;">External Mail Client Settings (Outlook, Apple Mail, Thunderbird, Mobile):</h3>
          <ul style="background: #f8fafc; padding: 15px 30px; border-radius: 8px; font-family: monospace; font-size: 13px;">
            <li><strong>IMAP Server:</strong> mail.${domain.name} (Port: 993, SSL/TLS)</li>
            <li><strong>SMTP Server:</strong> mail.${domain.name} (Port: 465 or 587, STARTTLS/SSL)</li>
            <li><strong>Username:</strong> ${email}</li>
            <li><strong>Password:</strong> (Your mailbox password)</li>
          </ul>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Enjoy uninterrupted business communications!</p>
        </div>
        `,
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
