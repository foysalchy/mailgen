import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST: Multi-Tenant Login with Approval & Company Status Checks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query user with joined company and plan details
    const [rows]: any = await pool.query(
      `SELECT u.id, u.company_id, u.name, u.email, u.password_hash, u.role, u.status as user_status,
              u.plan_id, u.parent_id, u.permissions_json,
              c.name as company_name, c.status as company_status,
              p.name as plan_name, p.max_domains, p.max_mailboxes, p.storage_quota_mb, p.price_monthly
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       LEFT JOIN plans p ON (c.plan_id = p.id OR u.plan_id = p.id)
       WHERE u.email = ?`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];

    // Password verification
    const isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false) || user.password_hash === password;
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Super Admin Bypass for Platform Maintenance
    const isSuperAdmin = user.role === 'admin' || user.role === 'superadmin';

    // Verification check 1: Pending Company or User Status
    if (!isSuperAdmin) {
      if (user.company_status === 'pending' || user.user_status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            isPendingApproval: true,
            message: '⏳ Your company registration is pending Super Admin review. Please wait until your account and payment are verified and approved.',
          },
          { status: 403 }
        );
      }

      // Verification check 2: Suspended Status
      if (user.company_status === 'suspended' || user.user_status === 'suspended') {
        return NextResponse.json(
          {
            success: false,
            message: '🚫 Your company account has been suspended by Super Admin. Please contact support to restore access.',
          },
          { status: 403 }
        );
      }
    }

    delete user.password_hash;
    user.permissions = user.permissions_json ? JSON.parse(user.permissions_json) : null;

    return NextResponse.json({
      success: true,
      user,
      message: 'Logged in successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
