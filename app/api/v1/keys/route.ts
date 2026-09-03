import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// Ensure table exists helper
async function ensureApiKeysTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      company_id INT NULL,
      name VARCHAR(150) NOT NULL,
      api_key VARCHAR(255) NOT NULL UNIQUE,
      sender_email VARCHAR(255) NULL,
      allowed_origins TEXT NULL,
      status ENUM('active', 'revoked') DEFAULT 'active',
      total_requests INT DEFAULT 0,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id),
      INDEX (company_id),
      INDEX (api_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await pool.query('ALTER TABLE api_keys ADD COLUMN company_id INT NULL AFTER user_id');
  } catch (e) {}

  try {
    await pool.query('ALTER TABLE api_keys ADD COLUMN sender_email VARCHAR(255) NULL AFTER api_key');
  } catch (e) {}

  try {
    await pool.query('ALTER TABLE api_keys ADD COLUMN allowed_origins TEXT NULL AFTER sender_email');
  } catch (e) {}

  try {
    await pool.query('ALTER TABLE api_keys ADD COLUMN total_requests INT DEFAULT 0 AFTER status');
  } catch (e) {}

  try {
    await pool.query('ALTER TABLE api_keys ADD COLUMN last_used_at TIMESTAMP NULL AFTER total_requests');
  } catch (e) {}
}

// GET: Retrieve all API keys for the current user or company
export async function GET(request: Request) {
  try {
    await ensureApiKeysTable();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && userId) {
      const [uRows]: any = await pool.query('SELECT company_id FROM users WHERE id = ?', [userId]);
      if (uRows.length > 0 && uRows[0].company_id) {
        resolvedCompanyId = uRows[0].company_id;
      }
    }

    let query = `
      SELECT k.id, k.user_id, k.company_id, k.name, k.api_key, k.sender_email, k.allowed_origins, k.status, k.total_requests, k.last_used_at, k.created_at 
      FROM api_keys k
      WHERE 1=1
    `;
    const params: any[] = [];

    if (resolvedCompanyId && userId) {
      query += ` AND (k.company_id = ? OR k.user_id = ? OR k.company_id IS NULL)`;
      params.push(resolvedCompanyId, userId);
    } else if (resolvedCompanyId) {
      query += ` AND (k.company_id = ? OR k.company_id IS NULL)`;
      params.push(resolvedCompanyId);
    } else if (userId) {
      query += ` AND k.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY k.created_at DESC`;

    const [keys]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, apiKeys: keys });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Generate or Revoke API keys
export async function POST(request: Request) {
  try {
    await ensureApiKeysTable();
    const body = await request.json();
    const { action = 'create', userId, companyId, name, senderEmail, keyId } = body;

    if (action === 'create') {
      if (!name) {
        return NextResponse.json({ success: false, message: 'Key Name is required' }, { status: 400 });
      }

      let resolvedCompanyId = companyId;
      if (!resolvedCompanyId && userId) {
        const [uRows]: any = await pool.query('SELECT company_id FROM users WHERE id = ?', [userId]);
        if (uRows.length > 0 && uRows[0].company_id) {
          resolvedCompanyId = uRows[0].company_id;
        }
      }

      // Generate a secure, production-grade API key: mbx_live_<32 hex>
      const rawToken = crypto.randomBytes(24).toString('hex');
      const apiKey = `mbx_live_${rawToken}`;

      const [res]: any = await pool.query(
        `INSERT INTO api_keys (user_id, company_id, name, api_key, sender_email) VALUES (?, ?, ?, ?, ?)`,
        [userId || 1, resolvedCompanyId || 1, name.trim(), apiKey, senderEmail ? senderEmail.trim() : null]
      );

      return NextResponse.json({
        success: true,
        apiKey: {
          id: res.insertId,
          name: name.trim(),
          api_key: apiKey,
          sender_email: senderEmail || 'Any verified mailbox',
          created_at: new Date(),
        },
        message: 'New API Key generated successfully! Keep it secret.',
      });
    }

    if (action === 'revoke') {
      if (!keyId) {
        return NextResponse.json({ success: false, message: 'keyId is required' }, { status: 400 });
      }
      await pool.query('UPDATE api_keys SET status = "revoked" WHERE id = ?', [keyId]);
      return NextResponse.json({ success: true, message: 'API Key revoked successfully' });
    }

    if (action === 'delete') {
      if (!keyId) {
        return NextResponse.json({ success: false, message: 'keyId is required' }, { status: 400 });
      }
      await pool.query('DELETE FROM api_keys WHERE id = ?', [keyId]);
      return NextResponse.json({ success: true, message: 'API Key deleted' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

