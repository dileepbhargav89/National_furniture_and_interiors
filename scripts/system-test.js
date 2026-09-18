// scripts/system-test.js — Automated Live System Testing against running services
const http = require('http');

async function testEndpoint(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runSystemTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       NATIONAL FURNITURE & INTERIORS — LIVE SYSTEM TEST SUITE     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // Test 1: API /health probe
  try {
    const res = await testEndpoint('http://localhost:4000/health');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.status === 'ok') {
      console.log('✓ [SYSTEM TEST 1] API /health probe — Status 200 OK, status: ok');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 1] API /health probe failed:', res.statusCode, res.body);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 1] API /health error:', err.message);
    failed++;
  }

  // Test 2: API /api/v1/auth/forgot-password endpoint
  try {
    const payload = JSON.stringify({ email: 'patron@example.com' });
    const res = await testEndpoint('http://localhost:4000/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      body: payload,
    });
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.success === true) {
      console.log('✓ [SYSTEM TEST 2] API /api/v1/auth/forgot-password — Status 200 OK, non-enumerating message returned');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 2] API forgot-password failed:', res.statusCode, res.body);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 2] API forgot-password error:', err.message);
    failed++;
  }

  // Test 3: Storefront / (Home)
  try {
    const res = await testEndpoint('http://localhost:3000/');
    if (res.statusCode === 200) {
      console.log('✓ [SYSTEM TEST 3] Storefront Home (/) — Status 200 OK');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 3] Storefront Home failed:', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 3] Storefront Home error:', err.message);
    failed++;
  }

  // Test 4: Storefront /login
  try {
    const res = await testEndpoint('http://localhost:3000/login');
    if (res.statusCode === 200) {
      console.log('✓ [SYSTEM TEST 4] Storefront /login — Status 200 OK');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 4] Storefront /login failed:', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 4] Storefront /login error:', err.message);
    failed++;
  }

  // Test 5: Storefront /forgot-password
  try {
    const res = await testEndpoint('http://localhost:3000/forgot-password');
    if (res.statusCode === 200) {
      console.log('✓ [SYSTEM TEST 5] Storefront /forgot-password — Status 200 OK');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 5] Storefront /forgot-password failed:', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 5] Storefront /forgot-password error:', err.message);
    failed++;
  }

  // Test 6: Storefront /reset-password
  try {
    const res = await testEndpoint('http://localhost:3000/reset-password');
    if (res.statusCode === 200) {
      console.log('✓ [SYSTEM TEST 6] Storefront /reset-password — Status 200 OK');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 6] Storefront /reset-password failed:', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 6] Storefront /reset-password error:', err.message);
    failed++;
  }

  // Test 7: Admin Portal /login
  try {
    const res = await testEndpoint('http://localhost:3001/login');
    if (res.statusCode === 200) {
      console.log('✓ [SYSTEM TEST 7] Admin Portal /login — Status 200 OK');
      passed++;
    } else {
      console.error('✗ [SYSTEM TEST 7] Admin Portal /login failed:', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.error('✗ [SYSTEM TEST 7] Admin Portal /login error:', err.message);
    failed++;
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(`SYSTEM TESTING SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
