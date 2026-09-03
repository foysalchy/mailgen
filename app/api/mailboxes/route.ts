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
      SELECT u.id, u.email, u.full_name, u.signature, u.quota_mb, u.role_id, u.permissions_json, u.is_active, u.created_at, 
        d.name AS domain_name,
        r.name as role_name,
        (SELECT COUNT(*) FROM webmail_messages WHERE mailbox_id = u.id AND folder = 'inbox' AND is_read = 0) AS unread_count,
        (SELECT COUNT(*) FROM webmail_messages WHERE mailbox_id = u.id) AS total_messages
      FROM virtual_users u
      JOIN virtual_domains d ON u.domain_id = d.id
      LEFT JOIN company_roles r ON u.role_id = r.id
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
    const { domainId, username, password, fullName, signature, quotaMb = 2048, roleId, userId = 1, companyId } = body;

    if (!domainId || !username || !password) {
      return NextResponse.json({ success: false, message: 'Missing required mailbox fields' }, { status: 400 });
    }

    // Ensure signature column exists
    try {
      await pool.query('ALTER TABLE virtual_users ADD COLUMN signature LONGTEXT NULL');
      await pool.query('ALTER TABLE virtual_users ADD COLUMN role_id INT NULL');
      await pool.query('ALTER TABLE virtual_users ADD COLUMN permissions_json LONGTEXT NULL');
    } catch (e) {}

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

    // Fetch role permissions if roleId provided
    let permissionsJson = null;
    if (roleId) {
      const [roleRows]: any = await pool.query('SELECT permissions_json FROM company_roles WHERE id = ?', [roleId]);
      if (roleRows.length > 0) {
        permissionsJson = roleRows[0].permissions_json;
      }
    }

    // Hash password with Dovecot compatible SHA-512 crypt or bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const dovecotPassword = `{BLF-CRYPT}${hashedPassword}`;

    const [result]: any = await pool.query(
      `INSERT INTO virtual_users (company_id, domain_id, user_id, email, password, full_name, signature, quota_mb, role_id, permissions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resolvedCompanyId || 1, domainId, userId, email, dovecotPassword, fullName || cleanUsername, signature || '', quotaMb, roleId || null, permissionsJson]
    );

    const mailboxId = result.insertId;

    // Add a welcome email in webmail_messages
    await pool.query(
      `INSERT INTO webmail_messages (mailbox_id, folder, sender, sender_name, recipients, subject, body_html, body_text, is_read)
       VALUES (?, 'inbox', 'support@system.local', 'Mail Server Administrator', ?, 'Welcome to your new Professional Mailbox!', ?, ?, 0)`,
      [
        mailboxId,
        email,
        `
        <div style="font-family: sans-serif; max-width: 600px; color: #f8fafc; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #60a5fa; margin-top: 0;">Welcome to ${email}!</h2>
          <p>Your mailbox has been successfully provisioned on the platform.</p>
        </div>
        `,
        `Welcome to your new mailbox: ${email}`,
      ]
    );

    return NextResponse.json({
      success: true,
      mailbox: {
        id: mailboxId,
        email,
        full_name: fullName,
        signature: signature || '',
        quota_mb: quotaMb,
        role_id: roleId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT / PATCH: Update existing mailbox settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { mailboxId, fullName, signature, quotaMb, roleId, password } = body;

    if (!mailboxId) {
      return NextResponse.json({ success: false, message: 'mailboxId is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (fullName !== undefined) {
      updates.push('full_name = ?');
      params.push(fullName);
    }
    if (signature !== undefined) {
      updates.push('signature = ?');
      params.push(signature);
    }
    if (quotaMb !== undefined) {
      updates.push('quota_mb = ?');
      params.push(Number(quotaMb));
    }
    if (roleId !== undefined) {
      updates.push('role_id = ?');
      params.push(roleId || null);

      if (roleId) {
        const [rRows]: any = await pool.query('SELECT permissions_json FROM company_roles WHERE id = ?', [roleId]);
        if (rRows.length > 0) {
          updates.push('permissions_json = ?');
          params.push(rRows[0].permissions_json);
        }
      }
    }
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      updates.push('password = ?');
      params.push(`{BLF-CRYPT}${hashedPassword}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
    }

    params.push(mailboxId);
    await pool.query(`UPDATE virtual_users SET ${updates.join(', ')} WHERE id = ?`, params);

    return NextResponse.json({ success: true, message: 'Mailbox configuration and signature updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
