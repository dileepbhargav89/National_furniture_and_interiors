import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), 'apps', 'api', '.env') });

const key = process.env.EMAIL_PROVIDER_API_KEY;

async function verifyResend() {
  if (!key || !key.startsWith('re_')) {
    console.error('No valid Resend API key found in apps/api/.env');
    process.exit(1);
  }

  const recipient = process.env.TEST_NOTIFICATION_EMAIL || 'dileepbhargav722@gmail.com';
  console.log(`Dispatching test luxury email via Resend to ${recipient}...`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'National Interiors <onboarding@resend.dev>',
      to: [recipient],
      subject: 'Order Confirmed: #NFI-2026-8891 — National Furniture & Interiors',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF9F6; padding: 30px; border-radius: 4px;">
          <div style="background: #171717; padding: 24px; text-align: center; border-bottom: 2px solid #C5A059;">
            <h1 style="color: #FFFFFF; font-size: 18px; letter-spacing: 0.25em; text-transform: uppercase; margin: 0;">National</h1>
            <div style="color: #C5A059; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; margin-top: 4px;">Furniture &amp; Interior Architecture &bull; Bengaluru</div>
          </div>
          <div style="background: #FFFFFF; padding: 30px; border: 1px solid #EAE6DF; border-top: none;">
            <h2 style="color: #171717; font-size: 20px; margin-top: 0;">Thank you for your acquisition, Valued Patron.</h2>
            <p style="color: #4A4A4A; font-size: 14px; line-height: 1.6;">
              We are delighted to confirm your bespoke woodwork order <strong>#NFI-2026-8891</strong>. Our master craftsmen and white-glove logistics team are preparing your pieces with the utmost precision.
            </p>
            <div style="background: #FBF9F5; border-left: 3px solid #C5A059; padding: 14px 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #8C7355; font-weight: 600;">Status Update</div>
              <div style="font-size: 15px; font-weight: bold; color: #171717; margin-top: 2px;">Reserved for Artisanal Crafting</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Experience Studio: Indiranagar Flagship, Bengaluru</div>
            </div>
            <p style="color: #777; font-size: 12px; margin-bottom: 0;">
              Your dedicated design concierge will coordinate delivery schedules directly with your estate manager.
            </p>
          </div>
          <div style="background: #171717; padding: 20px; text-align: center; color: #888; font-size: 11px;">
            National Furniture &amp; Interior Architecture Studio &bull; Bengaluru, India<br>
            Direct Concierge: +91 80 4123 4567 &bull; concierge@nationalinteriors.in
          </div>
        </div>
      `,
    }),
  });

  const responseText = await res.text();
  console.log('Resend Response Status:', res.status);
  console.log('Resend Response Body:', responseText);
}

verifyResend().catch(console.error);
