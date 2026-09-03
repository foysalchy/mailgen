import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: Retrieve company details and current user profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id, u.status as user_status,
              c.name as company_name, c.business_email, c.phone, c.address, c.status as company_status,
              p.name as plan_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       LEFT JOIN plans p ON (c.plan_id = p.id OR u.plan_id = p.id)
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const user = rows[0];

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        planName: user.plan_name,
      },
      company: {
        id: user.company_id,
        name: user.company_name,
        businessEmail: user.business_email,
        phone: user.phone,
        address: user.address,
        status: user.company_status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Update Company Information or User Profile (Name, Email, Password)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    // 1. Fetch user to verify permissions
    const [uRows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (uRows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const currentUser = uRows[0];
    const companyId = currentUser.company_id;

    // -------------------------------------------------------------
    // ACTION 1: UPDATE USER PROFILE (Name, Email, Password)
    // -------------------------------------------------------------
    if (action === 'update_profile') {
      const { name, email, currentPassword, newPassword } = body;

      if (!name || !email) {
        return NextResponse.json({ success: false, message: 'Name and Email are required' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if email changed and if new email already in use
      if (cleanEmail !== currentUser.email) {
        const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [cleanEmail, userId]);
        if (existing.length > 0) {
          return NextResponse.json({ success: false, message: 'This email is already in use by another account' }, { status: 409 });
        }
      }

      // If user wants to change password
      let updatedPasswordHash = currentUser.password_hash;
      if (newPassword && newPassword.trim()) {
        if (!currentPassword) {
          return NextResponse.json({ success: false, message: 'Current password is required to set a new password' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, currentUser.password_hash).catch(() => false) || currentUser.password_hash === currentPassword;
        if (!isMatch) {
          return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 403 });
        }

        if (newPassword.length < 6) {
          return NextResponse.json({ success: false, message: 'New password must be at least 6 characters' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        updatedPasswordHash = await bcrypt.hash(newPassword, salt);
      }

      // Update users table
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?',
        [name.trim(), cleanEmail, updatedPasswordHash, userId]
      );

      // Fetch fresh updated record
      const [freshRows]: any = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.company_id, c.name as company_name, p.name as plan_name,
                p.max_domains, p.max_mailboxes, p.storage_quota_mb
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         LEFT JOIN plans p ON (c.plan_id = p.id OR u.plan_id = p.id)
         WHERE u.id = ?`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        user: freshRows[0],
        message: 'Personal profile and security credentials updated successfully!',
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: UPDATE COMPANY INFORMATION (Name, Business Email, Phone, Address)
    // -------------------------------------------------------------
    if (action === 'update_company') {
      const { companyName, businessEmail, phone, address } = body;

      if (!companyName) {
        return NextResponse.json({ success: false, message: 'Company Name is required' }, { status: 400 });
      }

      if (!companyId) {
        return NextResponse.json({ success: false, message: 'No company associated with this account' }, { status: 400 });
      }

      // Update companies table
      await pool.query(
        `UPDATE companies 
         SET name = ?, business_email = ?, phone = ?, address = ? 
         WHERE id = ?`,
        [companyName.trim(), (businessEmail || '').trim(), (phone || '').trim(), (address || '').trim(), companyId]
      );

      // Fetch fresh user record with updated company name
      const [freshRows]: any = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.company_id, c.name as company_name, p.name as plan_name,
                p.max_domains, p.max_mailboxes, p.storage_quota_mb
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         LEFT JOIN plans p ON (c.plan_id = p.id OR u.plan_id = p.id)
         WHERE u.id = ?`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        user: freshRows[0],
        message: 'Company organization details updated successfully!',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
