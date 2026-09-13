const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';
const DEFAULT_PASSWORD = 'Password123!';

const SYSTEM_PERMISSIONS = [
  // Catalog
  { key: 'catalog.read', module: 'catalog', description: 'View products, categories, collections, and inventory' },
  { key: 'catalog.write', module: 'catalog', description: 'Create, update, and delete catalog products, categories, and inventory' },
  // Orders
  { key: 'orders.read_self', module: 'orders', description: 'View own orders and checkout' },
  { key: 'orders.read', module: 'orders', description: 'View all patron and atelier orders across the platform' },
  { key: 'orders.write', module: 'orders', description: 'Create, update status, cancel, and manage orders' },
  // Payments
  { key: 'payments.read', module: 'payments', description: 'View payment transactions, reconciliations, and tax invoices' },
  { key: 'payments.write', module: 'payments', description: 'Initiate refunds, generate tax invoices, and reconcile settlements' },
  // Design Projects
  { key: 'design-projects.read', module: 'design-projects', description: 'View client interior design projects, 3D renderings, and milestone progress' },
  { key: 'design-projects.write', module: 'design-projects', description: 'Create, update, assign designers, and upload 3D renders/milestones' },
  { key: 'design_projects.read', module: 'design-projects', description: 'Alias for design-projects.read' },
  { key: 'design_projects.write', module: 'design-projects', description: 'Alias for design-projects.write' },
  { key: 'payments.manage', module: 'payments', description: 'Alias for payments.write' },
  // Leads & CRM
  { key: 'leads.read', module: 'leads', description: 'View customer inquiries, sales pipeline, and CRM customer dossiers' },
  { key: 'leads.write', module: 'leads', description: 'Advance deal stages, assign sales consultants, and log customer activities' },
  // Notifications
  { key: 'notifications.read', module: 'notifications', description: 'View notification delivery logs and channel statuses' },
  { key: 'notifications.write', module: 'notifications', description: 'Send and manage user notifications' },
  { key: 'notifications.broadcast', module: 'notifications', description: 'Send broadcast alerts to all patrons' },
  // CMS
  { key: 'cms.read', module: 'cms', description: 'View architectural blog chronicles, banners, and newsletter lists' },
  { key: 'cms.write', module: 'cms', description: 'Publish, edit, and archive stories, editorial lookbooks, and homepage banners' },
  // Analytics
  { key: 'analytics.read', module: 'analytics', description: 'View executive KPIs, revenue trajectories, conversion funnels, and LTV cohorts' },
  // Users & Roles
  { key: 'users.read_self', module: 'users', description: 'Read own patron profile and addresses' },
  { key: 'users.read', module: 'users', description: 'View user accounts, staff profiles, and patron dossiers' },
  { key: 'users.write', module: 'users', description: 'Create and manage staff accounts and patron permissions' },
  { key: 'admin.manage_roles', module: 'admin', description: 'Manage RBAC roles and permission assignments' },
  { key: 'admin.view_audit_log', module: 'admin', description: 'Inspect immutable system audit trail' },
  // Reviews
  { key: 'reviews.read', module: 'reviews', description: 'Read customer reviews and ratings' },
  { key: 'reviews.write', module: 'reviews', description: 'Moderate, approve, or hide customer product reviews' },
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('\n--- 1. UPSERTING ALL PERMISSIONS ---');
  const permMap = new Map();
  for (const perm of SYSTEM_PERMISSIONS) {
    const res = await db.collection('permissions').findOneAndUpdate(
      { key: perm.key },
      { $set: { ...perm, isDeleted: false, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    permMap.set(perm.key, res._id || res.value?._id);
    console.log(`  ✓ Permission: ${perm.key}`);
  }

  console.log('\n--- 2. UPSERTING ROLES ---');
  const ROLES = [
    {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator — Universal access to all system features, records, settings, and code operations',
      permissionKeys: SYSTEM_PERMISSIONS.map(p => p.key),
      isSystemRole: true,
    },
    {
      name: 'ADMIN',
      description: 'Platform Administrator — Full administrative privileges across catalog, operations, orders, and users',
      permissionKeys: SYSTEM_PERMISSIONS.map(p => p.key),
      isSystemRole: true,
    },
    {
      name: 'SALES_MANAGER',
      description: 'Operations Manager (Sales & CRM) — Inquiries, consultations, pipeline, lead assignment, and customer dossiers',
      permissionKeys: ['users.read_self', 'leads.read', 'leads.write', 'analytics.read', 'notifications.read', 'users.read', 'orders.read'],
      isSystemRole: true,
    },
    {
      name: 'DESIGN_MANAGER',
      description: 'Operations Manager (Design & 3D Atelier) — Turnkey residential projects, 3D VR concepts, and bespoke furniture specs',
      permissionKeys: ['users.read_self', 'design-projects.read', 'design-projects.write', 'design_projects.read', 'design_projects.write', 'leads.read', 'notifications.read', 'catalog.read'],
      isSystemRole: true,
    },
    {
      name: 'CATALOG_MANAGER',
      description: 'Operations Manager (Catalog & Inventory) — Furniture collections, SKUs, inventory levels, pricing, and reviews',
      permissionKeys: ['users.read_self', 'catalog.read', 'catalog.write', 'reviews.read', 'reviews.write', 'notifications.read'],
      isSystemRole: true,
    },
    {
      name: 'ORDER_MANAGER',
      description: 'Operations Manager (Orders & Fulfillment) — Order production pipeline, invoicing, payment settlements, and logistics',
      permissionKeys: ['users.read_self', 'orders.read', 'orders.write', 'payments.read', 'payments.write', 'payments.manage', 'notifications.read', 'users.read'],
      isSystemRole: true,
    },
    {
      name: 'CMS_MANAGER',
      description: 'Operations Manager (CMS & Editorial) — Design journal, chronicles, lookbooks, press, and homepage banners',
      permissionKeys: ['users.read_self', 'cms.read', 'cms.write', 'notifications.read', 'catalog.read'],
      isSystemRole: true,
    },
  ];

  const roleMap = new Map();
  for (const r of ROLES) {
    const pIds = r.permissionKeys.map(k => permMap.get(k)).filter(Boolean);
    const res = await db.collection('roles').findOneAndUpdate(
      { name: r.name },
      {
        $set: {
          name: r.name,
          description: r.description,
          permissionIds: pIds,
          isSystemRole: r.isSystemRole,
          isDeleted: false,
          updatedAt: new Date(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    const roleId = res._id || res.value?._id;
    roleMap.set(r.name, roleId);
    console.log(`  ✓ Role: ${r.name.padEnd(16)} (${pIds.length} permissions) -> ID: ${roleId}`);
  }

  console.log('\n--- 3. UPSERTING USERS (2 Super Admins, 3 Admins, Operation-wise Managers) ---');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const USERS_TO_SEED = [
    // 2 Super Admins
    {
      email: 'superadmin@nationalinteriors.com',
      firstName: 'Chief',
      lastName: 'Super Admin',
      roleName: 'SUPER_ADMIN',
      userType: 'ADMIN',
      phone: '+919663628301',
    },
    {
      email: 'director@nationalinteriors.com',
      firstName: 'Executive',
      lastName: 'Director',
      roleName: 'SUPER_ADMIN',
      userType: 'ADMIN',
      phone: '+919663628302',
    },
    // Also keep development aliases working
    {
      email: 'admin@nationalinteriors.local',
      firstName: 'Dev',
      lastName: 'Super Admin',
      roleName: 'SUPER_ADMIN',
      userType: 'ADMIN',
      phone: '+919663628303',
    },
    {
      email: 'admin@nfi.com',
      firstName: 'NFI',
      lastName: 'Super Admin',
      roleName: 'SUPER_ADMIN',
      userType: 'ADMIN',
      phone: '+919663628304',
    },

    // 3 Admins
    {
      email: 'admin1@nationalinteriors.com',
      firstName: 'Aarav',
      lastName: 'Deshmukh (Admin)',
      roleName: 'ADMIN',
      userType: 'ADMIN',
      phone: '+919663628311',
    },
    {
      email: 'admin2@nationalinteriors.com',
      firstName: 'Meera',
      lastName: 'Sen (Admin)',
      roleName: 'ADMIN',
      userType: 'ADMIN',
      phone: '+919663628312',
    },
    {
      email: 'admin3@nationalinteriors.com',
      firstName: 'Karan',
      lastName: 'Kapoor (Admin)',
      roleName: 'ADMIN',
      userType: 'ADMIN',
      phone: '+919663628313',
    },

    // Operation-wise Managers
    {
      email: 'sales.manager@nationalinteriors.com',
      firstName: 'Vikram',
      lastName: 'Mehta',
      roleName: 'SALES_MANAGER',
      userType: 'STAFF',
      phone: '+919663628321',
    },
    {
      email: 'design.manager@nationalinteriors.com',
      firstName: 'Ar. Priya',
      lastName: 'Sharma',
      roleName: 'DESIGN_MANAGER',
      userType: 'STAFF',
      phone: '+919663628322',
    },
    {
      email: 'catalog.manager@nationalinteriors.com',
      firstName: 'Rahul',
      lastName: 'Verma',
      roleName: 'CATALOG_MANAGER',
      userType: 'STAFF',
      phone: '+919663628323',
    },
    {
      email: 'order.manager@nationalinteriors.com',
      firstName: 'Ananya',
      lastName: 'Iyer',
      roleName: 'ORDER_MANAGER',
      userType: 'STAFF',
      phone: '+919663628324',
    },
    {
      email: 'cms.manager@nationalinteriors.com',
      firstName: 'Kavita',
      lastName: 'Nair',
      roleName: 'CMS_MANAGER',
      userType: 'STAFF',
      phone: '+919663628325',
    },
  ];

  for (const u of USERS_TO_SEED) {
    const roleId = roleMap.get(u.roleName);
    const fullName = `${u.firstName} ${u.lastName}`;

    const updateDoc = {
      email: u.email,
      fullName,
      firstName: u.firstName,
      lastName: u.lastName,
      passwordHash,
      roleId,
      userType: u.userType,
      phone: u.phone,
      status: 'ACTIVE',
      isActive: true,
      isDeleted: false,
      mfaEnabled: false, // Allows direct password sign in
      failedLoginAttempts: 0,
      lockedUntil: null,
      authProviders: ['local'],
      isEmailVerified: true,
      updatedAt: new Date(),
    };

    const res = await db.collection('users').findOneAndUpdate(
      { email: u.email },
      {
        $set: updateDoc,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const userId = res._id || res.value?._id;
    console.log(`  ✓ User: ${u.email.padEnd(36)} | Role: ${u.roleName.padEnd(16)} | ID: ${userId}`);
  }

  console.log('\n======================================================================');
  console.log('✓ ALL ENTERPRISE ROLES & ACCOUNTS SEEDED SUCCESSFULLY');
  console.log(`✓ All passwords set to: ${DEFAULT_PASSWORD}`);
  console.log('======================================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
