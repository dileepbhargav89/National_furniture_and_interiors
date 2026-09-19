import fs from 'node:fs';
import path from 'node:path';
import { IEmailService, SendEmailOptions, EmailAttachment } from '../../application/ports';
import {
  renderGeneralNotificationEmail,
  renderOrderConfirmedEmail,
  renderOrderAdvanceConfirmedEmail,
  renderMilestoneBalanceDueEmail,
  renderAdminLeadAlertEmail,
  renderDesignProposalReadyEmail,
  renderPaymentReceiptEmail,
  renderStudioVisitScheduledEmail,
  renderLeadWelcomeEmail,
  EmailTemplateRenderResult,
} from '../templates/email-templates';
import { NotificationType } from '../../domain/notifications.types';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: NotificationType;
  payload?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export class ResendEmailAdapter implements IEmailService {
  private readonly previewDir: string;
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(
    apiKey?: string,
    fromAddress = process.env.EMAIL_FROM_ADDRESS || 'National Interiors <onboarding@resend.dev>',
  ) {
    this.apiKey = apiKey || process.env.EMAIL_PROVIDER_API_KEY || '';
    this.fromAddress = fromAddress;
    this.previewDir = path.resolve(process.cwd(), 'temp', 'email-previews');

    // Ensure preview folder exists for sandbox simulation
    try {
      if (!fs.existsSync(this.previewDir)) {
        fs.mkdirSync(this.previewDir, { recursive: true });
      }
    } catch {
      // ignore
    }
  }

  isConfigured(): boolean {
    return (
      Boolean(this.apiKey) &&
      !this.apiKey.includes('placeholder') &&
      !this.apiKey.startsWith('email_dev_')
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: SendEmailOptions,
  ): Promise<boolean> {
    const rendered = this.resolveContent(subject, body, options?.type, options?.payload);

    const attachments = options?.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
    }));

    if (!this.isConfigured()) {
      return this.simulateSend(to, rendered, undefined, options?.attachments);
    }

    try {
      const payload: Record<string, unknown> = {
        from: this.fromAddress,
        to: [to],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorData = await response.text();

        console.error(`[ResendEmailAdapter] API Error (${response.status}):`, errorData);
        // Fallback to simulation log in dev so system doesn't break
        return this.simulateSend(
          to,
          rendered,
          `Resend API returned ${response.status}`,
          options?.attachments,
        );
      }

      const result = (await response.json()) as { id: string };

      console.log(
        `[ResendEmailAdapter] Email sent successfully to ${to} (ID: ${result.id})${attachments && attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''}`,
      );
      return true;
    } catch (err) {
      console.error('[ResendEmailAdapter] Network error sending email:', err);
      return this.simulateSend(to, rendered, 'Network error', options?.attachments);
    }
  }

  private resolveContent(
    subject: string,
    body: string,
    type?: NotificationType,
    payload?: Record<string, unknown>,
  ): EmailTemplateRenderResult {
    const data = payload || {};

    switch (type) {
      case NotificationType.ORDER_CONFIRMED:
        return renderOrderConfirmedEmail({
          orderId: (data.orderId as string) || 'NFI-ORD',
          customerName: (data.customerName as string) || 'Valued Patron',
          totalAmount: (data.totalAmount as string | number) || '0',
          items: data.items as Array<{ name: string; quantity: number; price?: string | number }>,
          deliveryAddress: data.deliveryAddress as string,
          actionUrl: data.actionUrl as string,
        });

      case NotificationType.ORDER_ADVANCE_CONFIRMED:
        return renderOrderAdvanceConfirmedEmail({
          orderId: (data.orderId as string) || 'NFI-ORD',
          customerName: (data.customerName as string) || 'Valued Patron',
          advanceAmount: (data.advanceAmount as string | number) || '0',
          balanceAmount: (data.balanceAmount as string | number) || '0',
          totalAmount: (data.totalAmount as string | number) || '0',
          items: data.items as Array<{ name: string; quantity: number; price?: string | number }>,
          deliveryAddress: data.deliveryAddress as string,
          actionUrl: data.actionUrl as string,
        });

      case NotificationType.MILESTONE_BALANCE_DUE:
        return renderMilestoneBalanceDueEmail({
          orderId: (data.orderId as string) || 'NFI-ORD',
          customerName: (data.customerName as string) || 'Valued Patron',
          balanceAmount: (data.balanceAmount as string | number) || '0',
          totalAmount: (data.totalAmount as string | number) || '0',
          items: data.items as Array<{ name: string; quantity: number }>,
          actionUrl: (data.actionUrl as string) || 'https://nationalinteriors.in/orders',
        });

      case NotificationType.DESIGN_PROPOSAL_READY:
        return renderDesignProposalReadyEmail({
          projectName: (data.projectName as string) || 'Bespoke Residence',
          clientName: (data.clientName as string) || 'Patron',
          designerName: data.designerName as string,
          actionUrl: (data.actionUrl as string) || 'https://nationalinteriors.in/client-portal',
          teaserNote: data.teaserNote as string,
        });

      case NotificationType.PAYMENT_RECEIVED:
        return renderPaymentReceiptEmail({
          paymentId: (data.paymentId as string) || 'PAY-REF',
          orderId: (data.orderId as string) || 'ORD-REF',
          customerName: (data.customerName as string) || 'Valued Patron',
          amount: (data.amount as string | number) || '0',
          invoiceUrl: data.invoiceUrl as string,
          method: data.method as string,
        });

      case NotificationType.STUDIO_VISIT_SCHEDULED:
        return renderStudioVisitScheduledEmail({
          clientName: (data.clientName as string) || 'Patron',
          studioLocation:
            (data.studioLocation as string) || 'Indiranagar Flagship Studio, Bengaluru',
          scheduledTime: (data.scheduledTime as string) || 'Saturday, 11:00 AM',
          conciergeName: data.conciergeName as string,
          actionUrl: data.actionUrl as string,
        });

      case NotificationType.LEAD_CUSTOMER_WELCOME:
      case NotificationType.LEAD_ASSIGNED:
        return renderLeadWelcomeEmail({
          clientName: (data.clientName as string) || (data.name as string) || 'Patron',
          requirementType: (data.requirementType as string) || (data.interestType as string),
          assignedConsultant: data.assignedConsultant as string,
          phone: data.phone as string,
        });

      case NotificationType.LEAD_CONCIERGE_ALERT:
        return renderAdminLeadAlertEmail({
          leadId: (data.leadId as string) || 'NFI-LEAD',
          name: (data.name as string) || 'Prospective Patron',
          phone: (data.phone as string) || '',
          email: data.email as string | undefined,
          interestType: (data.interestType as string) || 'INTERIOR_DESIGN',
          projectType: data.projectType as string | undefined,
          budgetRange: data.budgetRange as { min: number; max: number } | undefined,
          timeline: data.timeline as string | undefined,
          priority: (data.priority as string) || 'WARM',
          score: (data.score as number) || 50,
          actionUrl: (data.actionUrl as string) || '/crm',
        });

      default:
        return renderGeneralNotificationEmail({
          title: subject,
          message: body,
          actionLabel: (data.actionLabel as string) || undefined,
          actionUrl: (data.actionUrl as string) || undefined,
        });
    }
  }

  private simulateSend(
    to: string,
    rendered: EmailTemplateRenderResult,
    note?: string,
    attachments?: EmailAttachment[],
  ): boolean {
    const timestamp = Date.now();
    const safeTo = to.replace(/[^a-zA-Z0-9@.-]/g, '_');
    const filename = `email-${timestamp}-${safeTo}.html`;
    const filePath = path.join(this.previewDir, filename);

    try {
      fs.writeFileSync(filePath, rendered.html, 'utf-8');
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          const attPath = path.join(this.previewDir, `${timestamp}-${att.filename}`);
          const buffer = Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(att.content, 'base64');
          fs.writeFileSync(attPath, buffer);
        }
      }
    } catch {
      // ignore preview file write errors
    }

    console.log(`\n================== [NFI LUXURY EMAIL SIMULATION] ==================`);

    console.log(`To: ${to}`);

    console.log(`Subject: ${rendered.subject}`);
    if (attachments && attachments.length > 0) {
      console.log(`Attachments: ${attachments.map((a) => a.filename).join(', ')}`);
    }
    if (note) {
      console.log(`Notice: ${note} (operating in simulated sandbox mode)`);
    } else {
      console.log(`Status: Simulated Sandbox Mode (zero-config, pending live Resend API key)`);
    }

    console.log(`HTML Preview saved at: file://${filePath.replace(/\\/g, '/')}`);

    console.log(`===================================================================\n`);

    return true;
  }
}
