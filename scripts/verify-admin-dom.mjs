// scripts/verify-admin-dom.mjs
// Inspects rendered HTML of Admin Dashboard and Analytics routes

const endpoints = [
  {
    name: 'Executive Dashboard',
    url: 'http://localhost:3001/dashboard',
    requiredStrings: [
      'Executive Command Dashboard',
      'Revenue Trajectory',
      'Operations &amp; Atelier Pulse',
      'Target Progress Gauges',
      'Recent High-Ticket VIP Activity',
    ],
  },
  {
    name: 'Analytics Hub',
    url: 'http://localhost:3001/analytics',
    requiredStrings: [
      'Business Analytics &amp; Intelligence',
      'Revenue &amp; Cash Flow',
      'Consultation &amp; Funnel',
      'Patron Cohorts &amp; LTV',
      'Collection &amp; Margins',
      'Export CSV',
    ],
  },
];

async function check() {
  console.log('=== DOM & Render Verification for Admin Portal ===\n');
  let allOk = true;

  for (const ep of endpoints) {
    process.stdout.write(`Inspecting [${ep.name}] (${ep.url}) ... `);
    try {
      const res = await fetch(ep.url);
      if (!res.ok) {
        console.log(`❌ HTTP status: ${res.status}`);
        allOk = false;
        continue;
      }
      const html = await res.text();
      const missing = ep.requiredStrings.filter((s) => !html.includes(s));
      if (missing.length === 0) {
        console.log(`✅ All ${ep.requiredStrings.length} expected markers found! (HTML length: ${html.length})`);
      } else {
        console.log(`⚠️ Missing markers:`, missing);
        allOk = false;
      }
    } catch (err) {
      console.log(`❌ Fetch error: ${err.message}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\n🎉 ALL DOM & RENDER MARKERS VERIFIED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️ Some markers were missing in server-rendered shell.');
  }
}

check();
