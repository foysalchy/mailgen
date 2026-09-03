import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST: Multi-Tenant SaaS Registration with Company & Admin Info (Requires Super Admin Approval)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      businessEmail,
      phone = '',
      address = '',
      name,
      email,
      password,
      planId = 1,
      paymentMethod = 'card',
      transactionId = '',
    } = body;

    // Validation
    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Company Name, Admin Name, Email, and Password are required.' },
        { status: 400 }
      );
    }

    const cleanAdminEmail = email.toLowerCase().trim();
    const cleanBusinessEmail = (businessEmail || email).toLowerCase().trim();

    // Check if email already exists
    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [cleanAdminEmail]);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'An account with this administrator email already exists.' },
        { status: 409 }
      );
    }

    // Fetch Target Subscription Plan
    const [planRows]: any = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
    const plan = planRows[0] || { id: 1, name: 'Standard Plan', price_monthly: 19.99 };

    // 1. Create Company in `pending` status
    const [companyRes]: any = await pool.query(
      `INSERT INTO companies (name, business_email, phone, address, plan_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [companyName.trim(), cleanBusinessEmail, phone.trim(), address.trim(), plan.id]
    );
    const companyId = companyRes.insertId;

    // 2. Hash Password & Create Main User (Company Admin) in `pending` status
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [userRes]: any = await pool.query(
      `INSERT INTO users (company_id, name, email, password_hash, plan_id, role, status)
       VALUES (?, ?, ?, ?, ?, 'company_admin', 'pending')`,
      [companyId, name.trim(), cleanAdminEmail, passwordHash, plan.id]
    );
    const userId = userRes.insertId;

    // 3. Generate Initial Registration Invoice in `pending` status
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(companyId).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    await pool.query(
      `INSERT INTO invoices (company_id, user_id, invoice_number, plan_id, plan_name, amount, base_amount, overage_amount, status, payment_method, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 'pending', ?, ?)`,
      [
        companyId,
        userId,
        invoiceNumber,
        plan.id,
        plan.name,
        plan.price_monthly,
        plan.price_monthly,
        paymentMethod,
        transactionId.trim() || `SIGNUP-${Date.now()}`,
      ]
    );

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      companyId,
      invoiceNumber,
      message: `Company "${companyName}" registered successfully! Your account and initial invoice (${invoiceNumber}) are currently PENDING Super Admin review. You will be able to log in once approved.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
