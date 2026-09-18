// pdf-generator.adapter.ts — High-fidelity GST Tax Invoice (Form GST INV-1) PDF Generator.
// Compliant with Section 31 of CGST Act, 2017 and Rule 46 of CGST Rules.
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export interface InvoiceItemDetails {
  name: string;
  sku: string;
  hsnCode?: string | undefined;
  quantity: number;
  unitPrice: number; // in paise
  lineTotal: number; // in paise
}

export interface InvoicePartyAddress {
  name?: string | undefined;
  companyName?: string | undefined;
  gstin?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  line1?: string | undefined;
  line2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  pincode?: string | undefined;
}

export interface GeneratePdfParams {
  invoiceNumber: string;
  amount: number; // paise
  currency: string;
  orderId?: string | undefined;
  orderNumber?: string | undefined;
  customerDetails?:
    | {
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        companyName?: string | undefined;
        gstin?: string | undefined;
      }
    | undefined;
  billedTo?: InvoicePartyAddress | undefined;
  shippedTo?: InvoicePartyAddress | undefined;
  items?: InvoiceItemDetails[] | undefined;
  subtotal?: number | undefined;
  discount?: number | undefined;
  shippingFee?: number | undefined;
  cgst?: number | undefined;
  sgst?: number | undefined;
  igst?: number | undefined;
  isInterState?: boolean | undefined;
  paymentMode?: string | undefined;
  paymentStatus?: string | undefined;
  placeOfSupply?: string | undefined;
  date: Date;
}

function numberToIndianWords(rupees: number): string {
  if (rupees <= 0) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n] || '';
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return `${b[ten] || ''}${unit !== 0 ? ' ' + (a[unit] || '') : ''}`.trim();
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    if (hundred > 0) {
      str += `${a[hundred]} Hundred `;
    }
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str.trim();
  }

  let num = Math.floor(rupees);
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  if (crore > 0) words += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) words += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) words += `${convertTwoDigits(thousand)} Thousand `;
  if (hundreds > 0) words += `${convertThreeDigits(hundreds)} `;

  return `Rupees ${words.trim()} Only`;
}

function formatInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  })
    .format(rupees)
    .replace('₹', 'Rs. ');
}

export class PdfGeneratorAdapter {
  /**
   * Generates a luxury, GST-compliant PDF invoice in memory and returns a Buffer.
   */
  async generateBuffer(params: GeneratePdfParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Tax Invoice - ${params.invoiceNumber}`,
            Author: 'National Furniture & Interiors',
            Subject: 'GST Tax Invoice',
            Creator: 'National Furniture & Interiors ERP Engine',
          },
        });

        const buffers: Buffer[] = [];
        const writeStream = new Writable({
          write(chunk, _encoding, callback) {
            buffers.push(chunk);
            callback();
          },
        });

        writeStream.on('finish', () => resolve(Buffer.concat(buffers)));
        writeStream.on('error', reject);
        doc.pipe(writeStream);

        const orderNum = params.orderNumber || params.orderId || 'NFI-ORD-DIRECT';
        const isInterState = params.isInterState ?? false;
        const totalPaise = params.amount;
        const subtotalPaise = params.subtotal ?? Math.round(totalPaise / 1.18);
        const discountPaise = params.discount ?? 0;
        const taxPaise = totalPaise - subtotalPaise + discountPaise;
        const cgstPaise = isInterState ? 0 : (params.cgst ?? Math.round(taxPaise / 2));
        const sgstPaise = isInterState ? 0 : (params.sgst ?? taxPaise - cgstPaise);
        const igstPaise = isInterState ? (params.igst ?? taxPaise) : 0;
        const placeOfSupply =
          params.placeOfSupply || (isInterState ? 'Inter-State' : 'Karnataka (Code 29)');
        const paymentMode = params.paymentMode || 'Online Gateway (Razorpay)';
        const paymentStatus = params.paymentStatus || 'PAID';

        // ── 1. HEADER & BRAND IDENTIFIER ──────────────────────────────────────
        doc.rect(40, 40, 515, 6).fill('#8C7355'); // Luxury gold/taupe accent bar

        // Company Information (Left)
        doc
          .fillColor('#171717')
          .fontSize(15)
          .font('Helvetica-Bold')
          .text('NATIONAL FURNITURE & INTERIORS', 40, 56);

        doc
          .fillColor('#8C7355')
          .fontSize(8)
          .font('Helvetica')
          .text('✦ Est. 1998 · Luxury Bespoke Woodcraft & Architectural Joinery', 40, 74);

        doc
          .fillColor('#525252')
          .fontSize(7.5)
          .text(
            'Atelier & Works: Sy. No. 42/1, Off Sarjapur Road, Bengaluru, Karnataka 560035',
            40,
            86,
          )
          .text(
            'Registered Office: 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
            40,
            96,
          )
          .text(
            'Contact: concierge@nationalinteriors.in | +91 80 4123 4567 | www.nationalinteriors.in',
            40,
            106,
          )
          .font('Helvetica-Bold')
          .fillColor('#171717')
          .text(
            'GSTIN: 29AABCN8291M1Z5   |   PAN: AABCN8291M   |   State: Karnataka (29)',
            40,
            118,
          );

        // Tax Invoice Metadata (Right)
        doc
          .fillColor('#8C7355')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('TAX INVOICE', 360, 56, { align: 'right', width: 195 });

        doc
          .fillColor('#737373')
          .fontSize(7)
          .font('Helvetica-Oblique')
          .text('(Form GST INV-1 · Rule 46 of CGST Rules)', 360, 72, {
            align: 'right',
            width: 195,
          });

        doc
          .fillColor('#171717')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(`Invoice No: ${params.invoiceNumber}`, 360, 84, { align: 'right', width: 195 });

        doc
          .fillColor('#525252')
          .fontSize(7.5)
          .font('Helvetica')
          .text(
            `Invoice Date: ${params.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            360,
            96,
            { align: 'right', width: 195 },
          )
          .text(`Order Reference: ${orderNum}`, 360, 106, { align: 'right', width: 195 })
          .text(`Place of Supply: ${placeOfSupply}`, 360, 116, { align: 'right', width: 195 });

        // Divider
        doc.moveTo(40, 134).lineTo(555, 134).strokeColor('#E5E5E5').lineWidth(0.8).stroke();

        // ── 2. BUYER & CONSIGNEE DETAILS ─────────────────────────────────────
        const billedName =
          params.billedTo?.companyName ||
          params.billedTo?.name ||
          params.customerDetails?.companyName ||
          params.customerDetails?.name ||
          'Valued Patron';
        const billedGstin = params.billedTo?.gstin || params.customerDetails?.gstin;
        const billedLine1 = params.billedTo?.line1 || 'Bengaluru Atelier Client';
        const billedCityState =
          `${params.billedTo?.city || 'Bengaluru'}, ${params.billedTo?.state || 'Karnataka'} ${params.billedTo?.pincode || ''}`.trim();
        const billedContact =
          params.billedTo?.phone ||
          params.customerDetails?.phone ||
          params.customerDetails?.email ||
          '';

        const shippedName = params.shippedTo?.name || billedName;
        const shippedLine1 = params.shippedTo?.line1 || billedLine1;
        const shippedCityState =
          `${params.shippedTo?.city || params.billedTo?.city || 'Bengaluru'}, ${params.shippedTo?.state || params.billedTo?.state || 'Karnataka'} ${params.shippedTo?.pincode || ''}`.trim();

        // Bill To Box (Left)
        doc.rect(40, 142, 250, 72).fillAndStroke('#FAFAF9', '#E7E5E4');
        doc
          .fillColor('#8C7355')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('BILLED TO (BUYER):', 48, 148);
        doc.fillColor('#171717').fontSize(8.5).font('Helvetica-Bold').text(billedName, 48, 160);
        if (billedGstin) {
          doc
            .fillColor('#996515')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text(`GSTIN / UIN: ${billedGstin}`, 48, 172);
        } else {
          doc
            .fillColor('#78716C')
            .fontSize(7)
            .font('Helvetica')
            .text('Category: Unregistered Consumer (B2C)', 48, 172);
        }
        doc.fillColor('#525252').fontSize(7.5).font('Helvetica').text(billedLine1, 48, 182);
        doc.text(billedCityState, 48, 192);
        if (billedContact) doc.text(`Contact: ${billedContact}`, 48, 202);

        // Ship To Box (Right)
        doc.rect(305, 142, 250, 72).fillAndStroke('#FAFAF9', '#E7E5E4');
        doc
          .fillColor('#8C7355')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('SHIPPED TO (CONSIGNEE / DELIVERY SITE):', 313, 148);
        doc.fillColor('#171717').fontSize(8.5).font('Helvetica-Bold').text(shippedName, 313, 160);
        doc
          .fillColor('#78716C')
          .fontSize(7)
          .font('Helvetica')
          .text(
            'Destination State: ' +
              (params.shippedTo?.state || params.billedTo?.state || 'Karnataka'),
            313,
            172,
          );
        doc.fillColor('#525252').fontSize(7.5).font('Helvetica').text(shippedLine1, 313, 182);
        doc.text(shippedCityState, 313, 192);
        doc.text('Delivery Mode: Dedicated White-Glove Air-Suspension Transit', 313, 202);

        // ── 3. ITEMIZED TAX TABLE ─────────────────────────────────────────────
        const tableTop = 224;
        doc.rect(40, tableTop, 515, 18).fill('#171717');

        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
        doc.text('Sl.', 48, tableTop + 5);
        doc.text('Description of Goods & Specifications', 75, tableTop + 5);
        doc.text('HSN/SAC', 290, tableTop + 5, { align: 'center', width: 45 });
        doc.text('Qty', 345, tableTop + 5, { align: 'center', width: 35 });
        doc.text('Unit Rate (INR)', 390, tableTop + 5, { align: 'right', width: 75 });
        doc.text('Taxable Amount', 475, tableTop + 5, { align: 'right', width: 70 });

        let currentY = tableTop + 22;
        const items =
          params.items && params.items.length > 0
            ? params.items
            : [
                {
                  name: 'Handcrafted Bespoke Furniture & Timber Suites',
                  sku: 'NFI-BESPOKE-01',
                  hsnCode: '9403',
                  quantity: 1,
                  unitPrice: subtotalPaise,
                  lineTotal: subtotalPaise,
                },
              ];

        items.forEach((item, index) => {
          const itemHsn = item.hsnCode || '9403';
          const isEven = index % 2 === 0;
          if (isEven) {
            doc.rect(40, currentY - 3, 515, 22).fill('#FAF9F6');
          }

          doc
            .fillColor('#171717')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text(`${index + 1}.`, 48, currentY);

          doc.text(item.name, 75, currentY, { width: 205, ellipsis: true });
          doc
            .fillColor('#737373')
            .fontSize(6.5)
            .font('Helvetica')
            .text(`SKU: ${item.sku}`, 75, currentY + 10);

          doc
            .fillColor('#525252')
            .fontSize(7.5)
            .font('Helvetica')
            .text(itemHsn, 290, currentY, { align: 'center', width: 45 });
          doc.text(item.quantity.toString(), 345, currentY, { align: 'center', width: 35 });
          doc.text(formatInr(item.unitPrice), 390, currentY, { align: 'right', width: 75 });
          doc
            .fillColor('#171717')
            .font('Helvetica-Bold')
            .text(formatInr(item.lineTotal), 475, currentY, { align: 'right', width: 70 });

          currentY += 24;
        });

        // Horizontal line under table
        doc
          .moveTo(40, currentY)
          .lineTo(555, currentY)
          .strokeColor('#E5E5E5')
          .lineWidth(0.8)
          .stroke();
        currentY += 8;

        // ── 4. SUMMARY & TAX BREAKDOWN ────────────────────────────────────────
        const summaryBoxY = currentY;

        // Left box: Amount in words + Bank details + Tax declaration
        const words = numberToIndianWords(Math.round(totalPaise / 100));
        doc.rect(40, summaryBoxY, 280, 140).fillAndStroke('#FAFAF9', '#E7E5E4');

        doc
          .fillColor('#8C7355')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('AMOUNT CHARGEABLE (IN WORDS):', 48, summaryBoxY + 8);
        doc
          .fillColor('#171717')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(words, 48, summaryBoxY + 18, { width: 264 });

        doc
          .moveTo(48, summaryBoxY + 44)
          .lineTo(312, summaryBoxY + 44)
          .strokeColor('#E7E5E4')
          .lineWidth(0.5)
          .stroke();

        doc
          .fillColor('#8C7355')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('OFFICIAL BANK TRANSFER (NEFT / RTGS) DETAILS:', 48, summaryBoxY + 50);
        doc
          .fillColor('#525252')
          .fontSize(7)
          .font('Helvetica')
          .text('Beneficiary: National Furniture & Interiors Private Limited', 48, summaryBoxY + 62)
          .text(
            'Bank Name: ICICI Bank · Branch: Indiranagar 100 Feet Road, Bengaluru',
            48,
            summaryBoxY + 72,
          )
          .text(
            'Account Number: 000205028912 (Current A/C) · IFSC Code: ICIC0000002',
            48,
            summaryBoxY + 82,
          );

        doc
          .moveTo(48, summaryBoxY + 96)
          .lineTo(312, summaryBoxY + 96)
          .strokeColor('#E7E5E4')
          .lineWidth(0.5)
          .stroke();

        doc
          .fillColor('#15803D')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(`PAYMENT RECORD: ${paymentStatus} via ${paymentMode}`, 48, summaryBoxY + 104);
        doc
          .fillColor('#737373')
          .fontSize(6.5)
          .font('Helvetica-Oblique')
          .text(
            'Electronic reconciliation reference verified under NFI Treasury Protocol.',
            48,
            summaryBoxY + 116,
          );

        // Right box: Calculation summary
        const rightBoxX = 335;
        let rightY = summaryBoxY + 4;

        function addSummaryRow(label: string, value: string, isBold = false, isAccent = false) {
          doc
            .fillColor(isAccent ? '#8C7355' : isBold ? '#171717' : '#525252')
            .fontSize(isBold ? 8.5 : 7.5)
            .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
            .text(label, rightBoxX, rightY, { width: 120 });

          doc.text(value, rightBoxX + 120, rightY, { align: 'right', width: 100 });
          rightY += 14;
        }

        addSummaryRow('Taxable Subtotal:', formatInr(subtotalPaise));
        if (discountPaise > 0) {
          addSummaryRow('Trade Discount:', `-${formatInr(discountPaise)}`, false, true);
        }
        addSummaryRow('White-Glove Delivery:', 'Complimentary (Rs. 0.00)');

        if (!isInterState) {
          addSummaryRow('CGST (9.0%):', formatInr(cgstPaise));
          addSummaryRow('SGST (9.0%):', formatInr(sgstPaise));
        } else {
          addSummaryRow('IGST (18.0%):', formatInr(igstPaise));
        }

        doc
          .moveTo(rightBoxX, rightY)
          .lineTo(555, rightY)
          .strokeColor('#D4AF37')
          .lineWidth(1)
          .stroke();
        rightY += 6;

        // Grand Total Row
        doc.rect(rightBoxX, rightY - 2, 220, 24).fill('#171717');
        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('TOTAL AMOUNT (INR):', rightBoxX + 8, rightY + 5);
        doc
          .fillColor('#D4AF37')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(formatInr(totalPaise), rightBoxX + 110, rightY + 5, { align: 'right', width: 100 });

        // ── 5. DECLARATION & AUTHORIZED SIGNATORY ──────────────────────────────
        const footerY = 460;
        doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E5E5E5').lineWidth(0.8).stroke();

        doc
          .fillColor('#525252')
          .fontSize(6.5)
          .font('Helvetica')
          .text('Declaration:', 40, footerY + 8)
          .text(
            '1. We declare that this invoice shows the actual price of goods described and that all particulars are true and correct.',
            40,
            footerY + 18,
          )
          .text(
            '2. All disputes are subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.',
            40,
            footerY + 28,
          )
          .text(
            '3. 10-Year Master Chassis warranty certificate issued separately on in-home white-glove handover.',
            40,
            footerY + 38,
          );

        // Authorised Signatory Stamp block
        doc
          .fillColor('#171717')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('For NATIONAL FURNITURE & INTERIORS', 360, footerY + 8, {
            align: 'right',
            width: 195,
          });

        doc
          .fillColor('#8C7355')
          .fontSize(7)
          .font('Helvetica-Oblique')
          .text('[Digitally Signed & Certified]', 360, footerY + 26, { align: 'right', width: 195 })
          .text('Authorized Signatory · Financial Operations', 360, footerY + 36, {
            align: 'right',
            width: 195,
          });

        // Bottom Brand Ribbon
        doc.rect(40, 520, 515, 14).fill('#FAF9F6');
        doc
          .fillColor('#8C7355')
          .fontSize(6.5)
          .font('Helvetica')
          .text(
            'Computer-generated Tax Invoice under GSTIN 29AABCN8291M1Z5 · National Furniture & Interiors Bengaluru · FSC-STD-40-004 Certified Hardwood',
            40,
            524,
            { align: 'center', width: 515 },
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
