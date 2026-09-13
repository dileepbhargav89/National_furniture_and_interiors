/**
 * National Furniture & Interiors — Luxury Email Template Engine
 * Master-crafted responsive HTML templates using National palette:
 * Obsidian (#171717), Warm Gold (#C5A059 / #D4AF37), Taupe (#8C7355), Alabaster (#FAF9F6).
 */

export interface EmailTemplateRenderResult {
  subject: string;
  html: string;
  text: string;
}

function baseEmailLayout(title: string, preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF9F6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #171717;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #FAF9F6;
      padding: 40px 0 60px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #EAE6DF;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
    .header {
      background-color: #171717;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 2px solid #C5A059;
    }
    .brand-title {
      font-size: 18px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #FFFFFF;
      margin: 0;
      font-weight: 400;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: #C5A059;
      margin-top: 6px;
      font-weight: 500;
    }
    .body-content {
      padding: 36px 32px;
    }
    .heading {
      font-size: 22px;
      line-height: 1.35;
      font-weight: 500;
      color: #171717;
      margin: 0 0 16px 0;
      letter-spacing: -0.01em;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.65;
      color: #4A4A4A;
      margin: 0 0 20px 0;
    }
    .btn-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn-gold {
      display: inline-block;
      background-color: #171717;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
      border-radius: 2px;
      border: 1px solid #C5A059;
    }
    .card {
      background-color: #FBF9F5;
      border: 1px solid #EFEAE2;
      border-left: 3px solid #C5A059;
      padding: 18px 20px;
      margin: 24px 0;
      border-radius: 2px;
    }
    .footer {
      background-color: #171717;
      padding: 28px 24px;
      text-align: center;
      border-top: 1px solid #2B2B2B;
    }
    .footer-text {
      font-size: 11px;
      line-height: 1.7;
      color: #8C8C8C;
      margin: 0;
    }
    .footer-gold {
      color: #C5A059;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <span class="preheader">${preheader}</span>
    <table class="container" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <h1 class="brand-title">National</h1>
          <div class="brand-sub">Furniture &amp; Interior Design &bull; Bengaluru</div>
        </td>
      </tr>
      <tr>
        <td class="body-content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            National Furniture &amp; Interior Architecture Studio<br>
            Indiranagar &amp; Whitefield Studios, Bengaluru, Karnataka, India<br>
            Direct Concierge: +91 80 4123 4567 &bull; <a href="mailto:concierge@nationalinteriors.in" class="footer-gold">concierge@nationalinteriors.in</a>
          </p>
          <p class="footer-text" style="margin-top: 12px; font-size: 10px; color: #555555;">
            &copy; ${new Date().getFullYear()} National Furniture &amp; Interiors. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function renderOrderConfirmedEmail(data: {
  orderId: string;
  customerName: string;
  totalAmount: string | number;
  items?: Array<{ name: string; quantity: number; price?: string | number | undefined }> | undefined;
  deliveryAddress?: string | undefined;
  actionUrl?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `Order Confirmed: ${data.orderId} — National Furniture & Interiors`;
  const preheader = `Your order ${data.orderId} is confirmed and reserved for artisanal crafting.`;

  const itemsHtml = data.items && data.items.length > 0
    ? `<table width="100%" cellpadding="8" cellspacing="0" style="margin: 16px 0; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #E5E5E5; text-align: left; color: #8C7355; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">
            <th>Artisanal Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 10px 8px; color: #171717; font-weight: 500;">${item.name}</td>
              <td style="padding: 10px 8px; text-align: center; color: #666;">${item.quantity}</td>
              <td style="padding: 10px 8px; text-align: right; color: #171717;">${item.price ? `₹${item.price}` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : '';

  const content = `
    <h2 class="heading">Thank you for your acquisition, ${data.customerName}.</h2>
    <p class="paragraph">
      We are delighted to confirm your order <strong>#${data.orderId}</strong>. Our master craftsmen and logistics team are now preparing your pieces with the utmost precision.
    </p>

    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7355; font-weight: 600; margin-bottom: 6px;">Order Summary</div>
      <div style="font-size: 20px; font-weight: 600; color: #171717;">Total: ₹${data.totalAmount}</div>
      ${data.deliveryAddress ? `<p style="font-size: 12px; color: #555; margin: 8px 0 0 0;"><strong>Delivery Destination:</strong> ${data.deliveryAddress}</p>` : ''}
    </div>

    ${itemsHtml}

    <p class="paragraph" style="font-size: 13px; color: #666;">
      Our white-glove delivery concierge will reach out to schedule an arrival time that harmonizes seamlessly with your schedule.
    </p>

    ${data.actionUrl ? `
      <div class="btn-container">
        <a href="${data.actionUrl}" class="btn-gold">Track Order Status</a>
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `Thank you for your order #${data.orderId}, ${data.customerName}.\nTotal: ₹${data.totalAmount}.\nTrack your order here: ${data.actionUrl || 'https://nationalinteriors.in/orders'}`,
  };
}

export function renderDesignProposalReadyEmail(data: {
  projectName: string;
  clientName: string;
  designerName?: string | undefined;
  actionUrl: string;
  teaserNote?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `Your Luxury Design Concept is Ready: ${data.projectName}`;
  const preheader = `Step inside your bespoke 3D visualization and design proposal curated by National Interiors.`;

  const content = `
    <h2 class="heading">Your bespoke vision has been brought to life.</h2>
    <p class="paragraph">
      Dear ${data.clientName}, our design studio has completed the conceptualization for <strong>${data.projectName}</strong>${data.designerName ? ` under the direction of Lead Designer ${data.designerName}` : ''}.
    </p>

    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7355; font-weight: 600; margin-bottom: 6px;">Concept Highlights</div>
      <div style="font-size: 15px; font-weight: 500; color: #171717;">${data.teaserNote || 'Full 3D spatial render, material selections (solid teak & Italian marble), and customized lighting schematics.'}</div>
    </div>

    <p class="paragraph">
      You can now review your high-definition floor plans, elevation renders, and material board directly on your private client portal.
    </p>

    <div class="btn-container">
      <a href="${data.actionUrl}" class="btn-gold">Experience Design Proposal</a>
    </div>

    <p class="paragraph" style="font-size: 12px; color: #777; text-align: center;">
      Need adjustments? You can annotate directly in the viewer or schedule a design review with your architect.
    </p>
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `Dear ${data.clientName},\nYour design concept for ${data.projectName} is ready for review.\nView your proposal: ${data.actionUrl}`,
  };
}

export function renderPaymentReceiptEmail(data: {
  paymentId: string;
  orderId: string;
  customerName: string;
  amount: string | number;
  invoiceUrl?: string | undefined;
  method?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `Payment Acknowledged — Receipt #${data.paymentId}`;
  const preheader = `Receipt of payment ₹${data.amount} for order #${data.orderId}.`;

  const content = `
    <h2 class="heading">Payment Receipt</h2>
    <p class="paragraph">
      Dear ${data.customerName}, we have successfully received your payment for order <strong>#${data.orderId}</strong>.
    </p>

    <div class="card">
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #333;">
        <tr>
          <td style="color: #8C7355; font-weight: 600;">Transaction Reference:</td>
          <td style="text-align: right; font-family: monospace; font-size: 12px;">${data.paymentId}</td>
        </tr>
        <tr>
          <td style="color: #8C7355; font-weight: 600;">Amount Received:</td>
          <td style="text-align: right; font-weight: bold; font-size: 16px; color: #171717;">₹${data.amount}</td>
        </tr>
        ${data.method ? `
          <tr>
            <td style="color: #8C7355; font-weight: 600;">Payment Mode:</td>
            <td style="text-align: right;">${data.method}</td>
          </tr>
        ` : ''}
        <tr>
          <td style="color: #8C7355; font-weight: 600;">Status:</td>
          <td style="text-align: right; color: #2E7D32; font-weight: 600;">SETTLED</td>
        </tr>
      </table>
    </div>

    ${data.invoiceUrl ? `
      <div class="btn-container">
        <a href="${data.invoiceUrl}" class="btn-gold">Download Tax Invoice</a>
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `Payment Receipt: ₹${data.amount} received for order #${data.orderId}. Reference: ${data.paymentId}.`,
  };
}

export function renderStudioVisitScheduledEmail(data: {
  clientName: string;
  studioLocation: string;
  scheduledTime: string;
  conciergeName?: string | undefined;
  actionUrl?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `Your Experience Studio Visit is Confirmed`;
  const preheader = `We look forward to welcoming you at our ${data.studioLocation} Studio on ${data.scheduledTime}.`;

  const content = `
    <h2 class="heading">An Invitation to Spatial Artistry</h2>
    <p class="paragraph">
      Dear ${data.clientName}, your private appointment at the National Furniture &amp; Interiors Experience Studio has been confirmed.
    </p>

    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7355; font-weight: 600; margin-bottom: 6px;">Studio Appointment</div>
      <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #171717;">${data.scheduledTime}</p>
      <p style="margin: 0; font-size: 13px; color: #555;"><strong>Location:</strong> ${data.studioLocation}</p>
      ${data.conciergeName ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #555;"><strong>Host Concierge:</strong> ${data.conciergeName}</p>` : ''}
    </div>

    <p class="paragraph">
      Enjoy reserved valet parking, artisan espresso, and dedicated one-on-one time with our lead interior architects examining full-scale room vignettes and material libraries.
    </p>

    ${data.actionUrl ? `
      <div class="btn-container">
        <a href="${data.actionUrl}" class="btn-gold">View Appointment &amp; Directions</a>
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `Studio visit confirmed: ${data.scheduledTime} at ${data.studioLocation}.`,
  };
}

export function renderLeadWelcomeEmail(data: {
  clientName: string;
  requirementType?: string | undefined;
  assignedConsultant?: string | undefined;
  phone?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `Welcome to National Furniture & Interiors — Consultation Initiated`;
  const preheader = `Thank you for consulting with National Interiors. Your dedicated designer has been appointed.`;

  const content = `
    <h2 class="heading">Where visionary architecture meets heirloom craftsmanship.</h2>
    <p class="paragraph">
      Dear ${data.clientName}, thank you for reaching out to National Furniture &amp; Interiors${data.requirementType ? ` regarding your ${data.requirementType} project` : ''}.
    </p>

    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7355; font-weight: 600; margin-bottom: 6px;">Next Steps</div>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #333;">
        ${data.assignedConsultant ? `Your project advisor <strong>${data.assignedConsultant}</strong> is reviewing your floor plan and spatial needs.` : 'A Senior Architectural Consultant has been assigned to your brief.'}
        We will contact you within 2 business hours on ${data.phone || 'your phone'} to coordinate your initial mood board discussion.
      </p>
    </div>

    <div class="btn-container">
      <a href="https://nationalinteriors.in/portfolio" class="btn-gold">Explore Our Portfolio</a>
    </div>
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `Dear ${data.clientName},\nThank you for reaching out to National Furniture & Interiors. Your design consultation is initiated.`,
  };
}

export function renderGeneralNotificationEmail(data: {
  title: string;
  message: string;
  actionLabel?: string | undefined;
  actionUrl?: string | undefined;
}): EmailTemplateRenderResult {
  const subject = `${data.title} — National Furniture & Interiors`;
  const preheader = data.message.slice(0, 100);

  const content = `
    <h2 class="heading">${data.title}</h2>
    <p class="paragraph">${data.message}</p>

    ${data.actionUrl && data.actionLabel ? `
      <div class="btn-container">
        <a href="${data.actionUrl}" class="btn-gold">${data.actionLabel}</a>
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: baseEmailLayout(subject, preheader, content),
    text: `${data.title}\n\n${data.message}\n\n${data.actionUrl || ''}`,
  };
}
