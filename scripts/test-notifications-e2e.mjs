import crypto from 'node:crypto';

const API_BASE = 'http://localhost:4000';
const JWT_SECRET = '3adda4d3112aafcfe8a91f87f0642b30f6302559cdd917f6b34f407bdf2ba0d4';

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

async function runE2ETests() {
  console.log('\n============================================================');
  console.log('🏛️  NFI ENTERPRISE OMNICHANNEL NOTIFICATION ENGINE — E2E TEST');
  console.log('============================================================\n');

  // Step 1: Generate valid Admin JWT Token with permissions
  console.log('1. Generating Admin Bearer Token...');
  const adminToken = signJwt(
    {
      sub: 'admin_patron_01',
      userType: 'STAFF',
      roleId: 'admin_role',
      permissions: ['notifications.read', 'notifications.write', 'admin', '*'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET
  );
  console.log('   ✓ Admin JWT generated.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  // Step 2: Test Luxury Email Template Previews
  console.log('\n2. Testing Luxury Responsive Email Template Engine...');
  const templateTypes = [
    'ORDER_CONFIRMED',
    'DESIGN_PROPOSAL_READY',
    'PAYMENT_RECEIVED',
    'STUDIO_VISIT_SCHEDULED',
    'LEAD_ASSIGNED',
  ];

  for (const tType of templateTypes) {
    const previewRes = await fetch(`${API_BASE}/api/v1/notifications/preview-template`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: tType }),
    });

    if (previewRes.ok) {
      const previewData = await previewRes.json();
      const html = previewData.data?.html || '';
      const subject = previewData.data?.subject || '';
      const hasBrand = html.includes('National') && html.includes('#171717');
      if (hasBrand) {
        console.log(`   ✓ Template [${tType}] rendered: "${subject}" (${html.length} bytes HTML).`);
      } else {
        console.log(`   ⚠️ Template [${tType}] rendered without expected brand marks.`);
      }
    } else {
      const err = await previewRes.text();
      console.log(`   ✗ Template preview for ${tType} returned ${previewRes.status}: ${err}`);
    }
  }

  // Step 3: Test Resend Email Sandbox Simulation
  console.log('\n3. Testing Resend Email Sandbox Simulation...');
  const emailDispatchRes = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      channel: 'EMAIL',
      type: 'ORDER_CONFIRMED',
      recipient: 'vikram.hegde@luxuryclient.in',
      title: 'Order Confirmed: #NFI-2026-8891',
      message: 'Your bespoke solid teak dining table acquisition is confirmed and entering artisanal crafting.',
    }),
  });

  if (emailDispatchRes.ok) {
    const data = await emailDispatchRes.json();
    console.log(`   ✓ Resend Email dispatch: ${data.message} (ID: ${data.data?.id})`);
  } else {
    const err = await emailDispatchRes.text();
    console.log(`   ✗ Email dispatch failed: ${emailDispatchRes.status} - ${err}`);
  }

  // Step 4: Test WhatsApp Cloud Concierge Simulation Dispatch
  console.log('\n4. Testing WhatsApp Concierge Simulation Dispatch...');
  const waDispatchRes = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      channel: 'WHATSAPP',
      type: 'STUDIO_VISIT_SCHEDULED',
      recipient: '+919845012345',
      title: 'Private Studio Experience Confirmed',
      message: 'Namaste Mr. Hegde, your private spatial walkthrough at our Indiranagar Flagship Studio is reserved for Saturday at 11:30 AM.',
    }),
  });

  if (waDispatchRes.ok) {
    const data = await waDispatchRes.json();
    console.log(`   ✓ WhatsApp Concierge dispatch: ${data.message} (ID: ${data.data?.id})`);
  } else {
    const err = await waDispatchRes.text();
    console.log(`   ✗ WhatsApp dispatch failed: ${waDispatchRes.status} - ${err}`);
  }

  // Step 5: Test MSG91 SMS Simulation Dispatch
  console.log('\n5. Testing MSG91 SMS Simulation Dispatch...');
  const smsDispatchRes = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      channel: 'SMS',
      type: 'PAYMENT_RECEIVED',
      recipient: '+919845012345',
      title: 'Payment Acknowledged',
      message: 'National Interiors: Payment of Rs. 2,50,000 acknowledged for order NFI-8891. Official GST invoice generated.',
    }),
  });

  if (smsDispatchRes.ok) {
    const data = await smsDispatchRes.json();
    console.log(`   ✓ MSG91 SMS dispatch: ${data.message} (ID: ${data.data?.id})`);
  } else {
    const err = await smsDispatchRes.text();
    console.log(`   ✗ SMS dispatch failed: ${smsDispatchRes.status} - ${err}`);
  }

  // Step 6: Test In-App Notification Center Dispatch & Feed
  console.log('\n6. Testing In-App Notification Center Dispatch & Feed...');
  const inAppDispatchRes = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      channel: 'IN_APP',
      type: 'DESIGN_PROPOSAL_READY',
      recipient: 'admin_patron_01',
      title: 'Your 3D Spatial Layout is Ready',
      message: 'Review your Koramangala Penthouse master suite architectural proposal and material selections.',
    }),
  });

  let createdNotificationId = '';
  if (inAppDispatchRes.ok) {
    const inAppData = await inAppDispatchRes.json();
    createdNotificationId = inAppData.data?.id;
    console.log(`   ✓ In-app dispatch queued (ID: ${createdNotificationId}).`);
  } else {
    const err = await inAppDispatchRes.text();
    console.log(`   ✗ In-app dispatch failed: ${inAppDispatchRes.status} - ${err}`);
  }

  // Verify Personal Feed
  console.log('\n7. Verifying Personal In-App Feed & Unread Count...');
  const myFeedRes = await fetch(`${API_BASE}/api/v1/notifications/my`, {
    headers: authHeaders,
  });

  if (myFeedRes.ok) {
    const feedData = await myFeedRes.json();
    console.log(`   ✓ Retrieved personal in-app feed: ${feedData.data?.length || 0} notifications found.`);
  } else {
    console.log(`   ✗ Personal feed returned status: ${myFeedRes.status}`);
  }

  const unreadCountRes = await fetch(`${API_BASE}/api/v1/notifications/my/unread-count`, {
    headers: authHeaders,
  });

  if (unreadCountRes.ok) {
    const countData = await unreadCountRes.json();
    console.log(`   ✓ Unread In-App counter badge: ${countData.count} unread.`);
  }

  // Test Mark as Read
  if (createdNotificationId) {
    console.log('\n8. Testing 1-Click Mark as Read...');
    const markReadRes = await fetch(`${API_BASE}/api/v1/notifications/${createdNotificationId}/read`, {
      method: 'PUT',
      headers: authHeaders,
    });

    if (markReadRes.ok) {
      console.log(`   ✓ Notification ${createdNotificationId} marked as read successfully.`);
    } else {
      console.log(`   ✗ Mark read returned: ${markReadRes.status}`);
    }
  }

  // Step 9: Verify Delivery Stats
  console.log('\n9. Checking Delivery Statistics & Channel Breakdown...');
  const statsRes = await fetch(`${API_BASE}/api/v1/notifications/stats`, {
    headers: authHeaders,
  });

  if (statsRes.ok) {
    const statsData = await statsRes.json();
    console.log('   ✓ Delivery Statistics Breakdown:\n', JSON.stringify(statsData.data, null, 2));
  } else {
    console.log(`   ✗ Stats returned status: ${statsRes.status}`);
  }

  console.log('\n============================================================');
  console.log('✨ OMNICHANNEL NOTIFICATION ENGINE VERIFICATION COMPLETE');
  console.log('============================================================\n');
}

runE2ETests().catch(console.error);
