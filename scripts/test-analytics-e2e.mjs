// scripts/test-analytics-e2e.mjs
// Automated End-to-End Verification for Executive Dashboard & Business Analytics Hub

import crypto from 'node:crypto';

const API_BASE = 'http://127.0.0.1:4000';
const ADMIN_BASE = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || '3adda4d3112aafcfe8a91f87f0642b30f6302559cdd917f6b34f407bdf2ba0d4';

function base64Url(str) {
  return Buffer.from(str).toString('base64url');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const adminToken = signJwt(
  {
    sub: 'admin_concierge_director',
    userType: 'STAFF',
    roleId: 'admin_role',
    permissions: ['analytics.read', 'analytics.write', 'admin', '*'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  JWT_SECRET
);

async function testEndpoint(name, url, validateFn, isAuth = false) {
  process.stdout.write(`Testing [${name}] -> ${url} ... `);
  try {
    const headers = {};
    if (isAuth) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.log(`❌ Failed with HTTP status ${res.status}`);
      return false;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      const valid = validateFn ? validateFn(json) : true;
      if (valid) {
        console.log(`✅ Passed (JSON validated)`);
        return true;
      } else {
        console.log(`❌ Validation failed for JSON:`, JSON.stringify(json).slice(0, 150));
        return false;
      }
    } else {
      const text = await res.text();
      const valid = validateFn ? validateFn(text) : true;
      if (valid) {
        console.log(`✅ Passed (HTML / text validated, length: ${text.length})`);
        return true;
      } else {
        console.log(`❌ Validation failed for response`);
        return false;
      }
    }
  } catch (err) {
    console.log(`❌ Network / Fetch Error: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('===============================================================');
  console.log('  National Interiors - Analytics & Dashboard End-to-End Suite  ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  const runTest = async (name, url, validateFn, isAuth = false) => {
    total++;
    const ok = await testEndpoint(name, url, validateFn, isAuth);
    if (ok) passed++;
  };

  // 1. Dashboard Summary
  await runTest(
    'Dashboard Summary API',
    `${API_BASE}/api/v1/admin/analytics/dashboard-summary`,
    (json) => json && json.data && json.data.leadsFunnel && json.data.salesMetrics,
    true
  );

  // 2. Executive KPIs
  await runTest(
    'Executive KPIs API',
    `${API_BASE}/api/v1/admin/analytics/executive-kpis?timeRange=30d`,
    (json) => json && json.data && typeof json.data.activePipelineValue === 'number' && typeof json.data.averageOrderValue === 'number',
    true
  );

  // 3. Revenue Trends Timeseries
  await runTest(
    'Revenue Trends API',
    `${API_BASE}/api/v1/admin/analytics/revenue-trends?timeRange=30d`,
    (json) => json && Array.isArray(json.data) && json.data.length > 0 && typeof json.data[0].totalRevenue === 'number',
    true
  );

  // 4. Customer Cohorts & LTV
  await runTest(
    'Customer Cohorts API',
    `${API_BASE}/api/v1/admin/analytics/customer-cohorts`,
    (json) => json && json.data && Array.isArray(json.data.tiers) && Array.isArray(json.data.topPatrons),
    true
  );

  // 5. Category Performance
  await runTest(
    'Category Performance API',
    `${API_BASE}/api/v1/admin/analytics/category-performance`,
    (json) => json && Array.isArray(json.data) && json.data.length > 0 && typeof json.data[0].sharePercentage === 'number',
    true
  );

  // 6. Sales Metrics
  await runTest(
    'Sales Metrics API',
    `${API_BASE}/api/v1/admin/analytics/sales`,
    (json) => json && json.data && typeof json.data.totalRevenue === 'number',
    true
  );

  // 7. Leads Funnel
  await runTest(
    'Leads Funnel API',
    `${API_BASE}/api/v1/admin/analytics/leads-funnel`,
    (json) => json && json.data && typeof json.data.totalLeads === 'number',
    true
  );

  // 8. Admin Executive Dashboard Web Route
  await runTest(
    'Admin Executive Dashboard Route',
    `${ADMIN_BASE}/dashboard`,
    (html) => html.includes('<!DOCTYPE html>') || html.includes('Dashboard') || html.includes('Executive'),
    false
  );

  // 9. Admin Analytics Hub Web Route
  await runTest(
    'Admin Analytics Hub Route',
    `${ADMIN_BASE}/analytics`,
    (html) => html.includes('<!DOCTYPE html>') || html.includes('Analytics'),
    false
  );

  console.log('\n===============================================================');
  console.log(`  End-to-End Suite Completed: ${passed}/${total} checks PASSED  `);
  console.log('===============================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
