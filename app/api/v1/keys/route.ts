import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// Ensure table exists helper
async function ensureApiKeysTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      api_key VARCHAR(255) NOT NULL UNIQUE,
      sender_email VARCHAR(255) NULL,
      allowed_origins TEXT NULL,
      status ENUM('active', 'revoked') DEFAULT 'active',
      total_requests INT DEFAULT 0,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id),
      INDEX (api_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// GET: Retrieve all API keys for the current user
export async function GET(request: Request) {
  try {
    await ensureApiKeysTable();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const [keys]: any = await pool.query(
      `SELECT id, name, api_key, sender_email, allowed_origins, status, total_requests, last_used_at, created_at 
       FROM api_keys 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

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
    const { action = 'create', userId, name, senderEmail, keyId } = body;

    if (action === 'create') {
      if (!userId || !name) {
        return NextResponse.json({ success: false, message: 'User ID and Key Name are required' }, { status: 400 });
      }

      // Generate a secure, production-grade API key: mbx_live_<32 hex>
      const rawToken = crypto.randomBytes(24).toString('hex');
      const apiKey = `mbx_live_${rawToken}`;

      const [res]: any = await pool.query(
        `INSERT INTO api_keys (user_id, name, api_key, sender_email) VALUES (?, ?, ?, ?)`,
        [userId, name.trim(), apiKey, senderEmail ? senderEmail.trim() : null]
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

