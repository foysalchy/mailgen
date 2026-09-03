import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Ensure table exists on first run
async function initRolesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        permissions_json LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    try {
      await pool.query('ALTER TABLE virtual_users ADD COLUMN role_id INT NULL');
      await pool.query('ALTER TABLE virtual_users ADD COLUMN permissions_json LONGTEXT NULL');
    } catch (e) {}
  } catch (err) {}
}

// GET: List all custom roles for a company
export async function GET(request: Request) {
  try {
    await initRolesTable();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '1';

    const [roles]: any = await pool.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM virtual_users v WHERE v.role_id = r.id) as user_count
       FROM company_roles r
       WHERE r.company_id = ?
       ORDER BY r.id DESC`,
      [companyId]
    );

    const parsedRoles = roles.map((r: any) => ({
      ...r,
      permissions: r.permissions_json ? JSON.parse(r.permissions_json) : {},
    }));

    return NextResponse.json({ success: true, roles: parsedRoles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create, Update, or Delete a custom Role
export async function POST(request: Request) {
  try {
    await initRolesTable();
    const body = await request.json();
    const { action, roleId, companyId = 1, name, description, permissions } = body;

    // 1. DELETE ROLE
    if (action === 'delete') {
      if (!roleId) {
        return NextResponse.json({ success: false, message: 'Role ID required' }, { status: 400 });
      }
      // Unlink users having this role
      await pool.query('UPDATE virtual_users SET role_id = NULL, permissions_json = NULL WHERE role_id = ?', [roleId]);
      await pool.query('DELETE FROM company_roles WHERE id = ?', [roleId]);
      return NextResponse.json({ success: true, message: 'Role deleted successfully!' });
    }

    // 2. CREATE or UPDATE ROLE
    if (!name) {
      return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
    }

    const permissionsJson = JSON.stringify(permissions || {
      canSwitchMailbox: false,
      canSendBulk: false,
      canDeleteMail: true,
      canManageFolders: true,
      canManageTemplates: false,
      canManageSettings: false,
      canManageMailboxes: false,
    });

    if (action === 'update' && roleId) {
      await pool.query(
        'UPDATE company_roles SET name = ?, description = ?, permissions_json = ? WHERE id = ?',
        [name, description || '', permissionsJson, roleId]
      );

      // Propagate updated permissions to all mailboxes assigned to this role
      await pool.query(
        'UPDATE virtual_users SET permissions_json = ? WHERE role_id = ?',
        [permissionsJson, roleId]
      );

      return NextResponse.json({ success: true, message: `Role '${name}' updated successfully!` });
    } else {
      const [res]: any = await pool.query(
        'INSERT INTO company_roles (company_id, name, description, permissions_json) VALUES (?, ?, ?, ?)',
        [companyId, name, description || '', permissionsJson]
      );
      return NextResponse.json({ success: true, roleId: res.insertId, message: `Role '${name}' created successfully!` });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
