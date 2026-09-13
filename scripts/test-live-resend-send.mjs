import crypto from 'node:crypto';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), 'apps', 'api', '.env') });

const API_BASE = 'http://127.0.0.1:4000';
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

async function testLiveResend() {
  console.log('\n============================================================');
  console.log('🏛️  NFI LIVE RESEND EMAIL DISPATCH TEST');
  console.log('============================================================\n');

  const token = signJwt(
    {
      sub: 'admin_patron_01',
      userType: 'STAFF',
      roleId: 'admin_role',
      permissions: ['notifications.write', 'admin'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET
  );

  const recipient = process.env.TEST_NOTIFICATION_EMAIL || 'dileepbhargav722@gmail.com';
  console.log(`Sending live luxury confirmation email to: ${recipient}...`);

  const response = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: 'EMAIL',
      type: 'ORDER_CONFIRMED',
      recipient: recipient,
      title: 'Order Confirmed: #NFI-2026-DEMO',
      message: 'Thank you for your acquisition. Your bespoke solid teak furniture order is confirmed.',
    }),
  });

  const data = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));

  // Also trigger a WhatsApp simulation test with demo mobile number
  const demoPhone = process.env.TEST_NOTIFICATION_PHONE || '9109059791';
  console.log(`\nTesting WhatsApp Concierge simulation for demo phone: ${demoPhone}...`);
  const waResponse = await fetch(`${API_BASE}/api/v1/notifications/test-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: 'WHATSAPP',
      type: 'STUDIO_VISIT_SCHEDULED',
      recipient: `+91${demoPhone.replace(/^91/, '')}`,
      title: 'Studio Appointment Confirmed',
      message: 'Namaste, your private spatial walkthrough at National Furniture & Interiors Indiranagar Studio is reserved.',
    }),
  });

  const waData = await waResponse.json();
  console.log('WhatsApp Status:', waResponse.status);
  console.log('WhatsApp Data:', JSON.stringify(waData, null, 2));

  console.log('\n============================================================');
  console.log('✨ TEST COMPLETE');
  console.log('============================================================\n');
}

testLiveResend().catch(console.error);
