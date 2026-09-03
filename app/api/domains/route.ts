import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateDkimKeys, getRecommendedDnsRecords } from '@/lib/dns-helper';

// GET all domains for the authenticated user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1';
    const companyId = searchParams.get('companyId');

    let query = `SELECT d.*, 
        (SELECT COUNT(*) FROM virtual_users WHERE domain_id = d.id) AS mailbox_count,
        (SELECT COUNT(*) FROM virtual_aliases WHERE domain_id = d.id) AS alias_count
       FROM virtual_domains d `;
    let params: any[] = [];

    if (companyId) {
      query += `WHERE d.company_id = ? ORDER BY d.created_at DESC`;
      params = [companyId];
    } else {
      query += `WHERE d.user_id = ? ORDER BY d.created_at DESC`;
      params = [userId];
    }

    const [domains]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, domains });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Add new domain
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, userId = 1, companyId } = body;

    if (!name || !name.includes('.')) {
      return NextResponse.json({ success: false, message: 'Please provide a valid domain name (e.g. yourcompany.com)' }, { status: 400 });
    }

    const cleanName = name.toLowerCase().trim();

    // Check if domain already exists
    const [existing]: any = await pool.query('SELECT id FROM virtual_domains WHERE name = ?', [cleanName]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'This domain is already registered in the system.' }, { status: 409 });
    }

    // Resolve company_id if not provided
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && userId) {
      const [uRows]: any = await pool.query('SELECT company_id FROM users WHERE id = ?', [userId]);
      resolvedCompanyId = uRows[0]?.company_id || 1;
    }

    // Generate DKIM keys
    const { publicKeyPem, privateKeyPem, dnsRecordValue } = generateDkimKeys();
    const cleanPublic = dnsRecordValue.replace('v=DKIM1; k=rsa; p=', '');

    // Insert domain
    const [result]: any = await pool.query(
      `INSERT INTO virtual_domains (company_id, user_id, name, is_verified, dkim_selector, dkim_public_key, dkim_private_key) 
       VALUES (?, ?, ?, ?, 'mail', ?, ?)`,
      [resolvedCompanyId || 1, userId, cleanName, false, publicKeyPem, privateKeyPem]
    );

    const dnsRecords = getRecommendedDnsRecords(cleanName, cleanPublic);

    return NextResponse.json({
      success: true,
      domain: {
        id: result.insertId,
        name: cleanName,
        is_verified: false,
        dnsRecords,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete a custom domain
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json({ success: false, message: 'domainId is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM virtual_domains WHERE id = ?', [domainId]);

    return NextResponse.json({ success: true, message: 'Domain deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
