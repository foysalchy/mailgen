import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export const DEFAULT_PERMISSIONS = {
  canSendBulk: false,
  canDeleteMail: true,
  canManageFolders: true,
  canManageTags: true,
  canManageDomains: false,
  canManageMailboxes: false,
};

// GET sub-users of the current main user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ success: false, message: 'parentId is required' }, { status: 400 });
    }

    const [subUsers]: any = await pool.query(
      `SELECT id, name, email, role, status, permissions_json, created_at 
       FROM users 
       WHERE parent_id = ? 
       ORDER BY created_at DESC`,
      [parentId]
    );

    const formatted = subUsers.map((u: any) => ({
      ...u,
      permissions: u.permissions_json ? JSON.parse(u.permissions_json) : DEFAULT_PERMISSIONS,
    }));

    return NextResponse.json({ success: true, subUsers: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create or update a sub-user with granular permissions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'create' } = body;

    // Action 1: Create new sub-user
    if (action === 'create') {
      const { parentId, name, email, password, permissions } = body;

      if (!parentId || !name || !email || !password) {
        return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check existing email
      const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing.length > 0) {
        return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 409 });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const permsString = JSON.stringify(permissions || DEFAULT_PERMISSIONS);

      // Fetch parent's company_id and plan_id
      const [parent]: any = await pool.query('SELECT company_id, plan_id FROM users WHERE id = ?', [parentId]);
      const planId = parent[0]?.plan_id || 1;
      const companyId = parent[0]?.company_id || 1;

      const [res]: any = await pool.query(
        `INSERT INTO users (company_id, parent_id, name, email, password_hash, plan_id, role, status, permissions_json)
         VALUES (?, ?, ?, ?, ?, ?, 'sub_user', 'active', ?)`,
        [companyId, parentId, name, cleanEmail, passwordHash, planId, permsString]
      );

      return NextResponse.json({
        success: true,
        userId: res.insertId,
        message: `Sub-user "${name}" created with assigned permissions!`,
      });
    }

    // Action 2: Update existing sub-user permissions
    if (action === 'update_permissions') {
      const { subUserId, permissions } = body;
      if (!subUserId || !permissions) {
        return NextResponse.json({ success: false, message: 'subUserId and permissions required' }, { status: 400 });
      }

      await pool.query('UPDATE users SET permissions_json = ? WHERE id = ?', [JSON.stringify(permissions), subUserId]);

      return NextResponse.json({ success: true, message: 'Sub-user permissions updated successfully!' });
    }

    // Action 3: Delete sub-user
    if (action === 'delete') {
      const { subUserId } = body;
      await pool.query('DELETE FROM users WHERE id = ?', [subUserId]);
      return NextResponse.json({ success: true, message: 'Sub-user removed successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
