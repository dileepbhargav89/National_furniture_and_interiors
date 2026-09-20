// boq-pdf.adapter.ts — High-fidelity National Furniture & Interiors Luxury BOQ & Quotation PDF Generator
import PDFDocument from 'pdfkit';
import { IDesignProject, IQuotation } from '../../domain/design-projects.types';

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
    const word = a[n];
    if (word !== undefined && word !== '') return word;
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    const tenWord = b[ten] || '';
    const unitWord = a[unit] || '';
    return `${tenWord}${unitWord ? ' ' + unitWord : ''}`.trim();
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(rupees)
    .replace('₹', 'Rs. ');
}

export class BoqPdfGeneratorAdapter {
  /**
   * Generates a luxury, bespoke Quotation & BOQ PDF in memory and returns a Buffer.
   */
  async generateBuffer(project: IDesignProject, quotation: IQuotation): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `National Furniture & Interiors — Quotation ${project.projectCode} v${quotation.version}`,
          Author: 'National Furniture & Interiors',
          Subject: 'Interior Design Bill of Quantities & Quotation',
          Creator: 'NFI Bespoke Joinery Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const MARGIN_LEFT = 36;
      const PAGE_WIDTH = 595.28;
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2; // ~523.28 pt

      // ── Palette Constants ──
      const COLOR_OBSIDIAN = '#171717';
      const COLOR_GOLD = '#C5A059';
      const COLOR_TAUPE = '#8C7355';
      const COLOR_MUTED = '#666666';
      const COLOR_LIGHT_BG = '#F9F8F6';
      const COLOR_BORDER = '#E5E2DC';

      // ── 1. Luxury Header Bar ──
      doc.rect(MARGIN_LEFT, 36, CONTENT_WIDTH, 4).fill(COLOR_GOLD);

      // ── 2. Brand Identity & Document Title ──
      doc.fontSize(16).fillColor(COLOR_OBSIDIAN).font('Helvetica-Bold');
      doc.text('NATIONAL FURNITURE & INTERIORS', MARGIN_LEFT, 48);

      doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_TAUPE);
      doc.text(
        'Bespoke Architectural Joinery · 40,000 Sq.Ft Factory · Century BWP & Burma Teak',
        MARGIN_LEFT,
        68,
      );
      doc.text(
        '12th Main Road, Indiranagar, Bengaluru, Karnataka 560038 | GSTIN: 29AABCN1234F1Z8',
        MARGIN_LEFT,
        79,
      );

      // Quotation Title Right-Aligned
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
      doc.text('BILL OF QUANTITIES (BOQ)', MARGIN_LEFT, 48, {
        align: 'right',
        width: CONTENT_WIDTH,
      });
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_GOLD);
      doc.text(`VERSION ${quotation.version}.0`, MARGIN_LEFT, 64, {
        align: 'right',
        width: CONTENT_WIDTH,
      });
      doc.fontSize(8).font('Helvetica').fillColor(COLOR_MUTED);
      doc.text(
        `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        MARGIN_LEFT,
        77,
        { align: 'right', width: CONTENT_WIDTH },
      );
      doc.text('Validity: 30 Days from Issue', MARGIN_LEFT, 88, {
        align: 'right',
        width: CONTENT_WIDTH,
      });

      doc
        .moveTo(MARGIN_LEFT, 102)
        .lineTo(MARGIN_LEFT + CONTENT_WIDTH, 102)
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.75)
        .stroke();

      // ── 3. Client & Project Overview Box ──
      const metaBoxY = 110;
      doc.rect(MARGIN_LEFT, metaBoxY, CONTENT_WIDTH, 56).fillColor(COLOR_LIGHT_BG).fill();
      doc
        .rect(MARGIN_LEFT, metaBoxY, CONTENT_WIDTH, 56)
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.5)
        .stroke();

      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_TAUPE);
      doc.text('PROJECT PARTICULARS', MARGIN_LEFT + 12, metaBoxY + 8);
      doc.text('PROPERTY & CLIENT DETAILS', MARGIN_LEFT + CONTENT_WIDTH / 2, metaBoxY + 8);

      doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_OBSIDIAN);
      doc.text(`Project Code: ${project.projectCode}`, MARGIN_LEFT + 12, metaBoxY + 22);
      doc.text(
        `Scope Type: ${project.projectType.replace(/_/g, ' ')}`,
        MARGIN_LEFT + 12,
        metaBoxY + 34,
      );
      doc.text(
        `Carpet Area: ${project.propertyDetails.areaSqft} sq.ft (${project.propertyDetails.bhk ? `${project.propertyDetails.bhk} BHK` : 'Custom Suite'})`,
        MARGIN_LEFT + 12,
        metaBoxY + 44,
      );

      doc.text(
        `Property: ${project.propertyAddress.street}, ${project.propertyAddress.city}`,
        MARGIN_LEFT + CONTENT_WIDTH / 2,
        metaBoxY + 22,
      );
      doc.text(
        `State / PIN: ${project.propertyAddress.state} - ${project.propertyAddress.postalCode}`,
        MARGIN_LEFT + CONTENT_WIDTH / 2,
        metaBoxY + 34,
      );
      doc.text(
        'Design Guarantee: 45-Day Factory Handover · 10-Year BWP Warranty',
        MARGIN_LEFT + CONTENT_WIDTH / 2,
        metaBoxY + 44,
      );

      // ── 4. Itemized BOQ Table ──
      let currentY = 176;

      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
      doc.text('ITEMIZED ARCHITECTURAL JOINERY & SPECIFICATIONS', MARGIN_LEFT, currentY);
      currentY += 14;

      // Table Header
      const colRoom = MARGIN_LEFT;
      const colRoomWidth = 85;
      const colDesc = colRoom + colRoomWidth;
      const colDescWidth = 230;
      const colQty = colDesc + colDescWidth;
      const colQtyWidth = 45;
      const colRate = colQty + colQtyWidth;
      const colRateWidth = 75;
      const colTotal = colRate + colRateWidth;
      const colTotalWidth = 85;

      doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 18).fillColor(COLOR_OBSIDIAN).fill();
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('ROOM / AREA', colRoom + 6, currentY + 5);
      doc.text('ITEM DESCRIPTION & SPECIFICATIONS', colDesc + 6, currentY + 5);
      doc.text('QTY / AREA', colQty, currentY + 5, { align: 'right', width: colQtyWidth - 6 });
      doc.text('RATE (INR)', colRate, currentY + 5, { align: 'right', width: colRateWidth - 6 });
      doc.text('TOTAL (INR)', colTotal, currentY + 5, { align: 'right', width: colTotalWidth - 6 });

      currentY += 18;

      // Table Rows
      const items = quotation.boqItems || [];
      items.forEach((item, index) => {
        // Page break guard
        if (currentY > 660) {
          doc.addPage();
          currentY = 40;
          doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 18).fillColor(COLOR_OBSIDIAN).fill();
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
          doc.text('ROOM / AREA', colRoom + 6, currentY + 5);
          doc.text('ITEM DESCRIPTION & SPECIFICATIONS', colDesc + 6, currentY + 5);
          doc.text('QTY / AREA', colQty, currentY + 5, { align: 'right', width: colQtyWidth - 6 });
          doc.text('RATE (INR)', colRate, currentY + 5, {
            align: 'right',
            width: colRateWidth - 6,
          });
          doc.text('TOTAL (INR)', colTotal, currentY + 5, {
            align: 'right',
            width: colTotalWidth - 6,
          });
          currentY += 18;
        }

        const isEven = index % 2 === 0;
        const rowBg = isEven ? '#FFFFFF' : COLOR_LIGHT_BG;
        doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 26).fillColor(rowBg).fill();
        doc
          .rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 26)
          .strokeColor(COLOR_BORDER)
          .lineWidth(0.3)
          .stroke();

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
        doc.text(item.roomName || 'General Interior', colRoom + 6, currentY + 5, {
          width: colRoomWidth - 8,
        });

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
        doc.text(item.description, colDesc + 6, currentY + 4, { width: colDescWidth - 10 });

        // Subtitle specifications
        const specs = [
          item.coreMaterial ? `Substrate: ${item.coreMaterial.replace(/_/g, ' ')}` : null,
          item.finish ? `Finish: ${item.finish.replace(/_/g, ' ')}` : null,
          item.hardwareBrand ? `Hardware: ${item.hardwareBrand}` : null,
        ]
          .filter(Boolean)
          .join(' | ');

        if (specs) {
          doc.fontSize(6.5).font('Helvetica').fillColor(COLOR_TAUPE);
          doc.text(specs, colDesc + 6, currentY + 14, { width: colDescWidth - 10 });
        }

        const qtyDisplay = item.dimensions?.areaSqft
          ? `${item.dimensions.areaSqft} sq.ft`
          : `${item.quantity} nos`;

        doc.fontSize(7.5).font('Helvetica').fillColor(COLOR_OBSIDIAN);
        doc.text(qtyDisplay, colQty, currentY + 7, { align: 'right', width: colQtyWidth - 6 });
        doc.text(formatInr(item.unitPrice), colRate, currentY + 7, {
          align: 'right',
          width: colRateWidth - 6,
        });

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
        doc.text(formatInr(item.total), colTotal, currentY + 7, {
          align: 'right',
          width: colTotalWidth - 6,
        });

        currentY += 26;
      });

      // ── 5. Financial Summary & Tax Schedule ──
      currentY += 10;
      if (currentY > 620) {
        doc.addPage();
        currentY = 40;
      }

      const summaryWidth = 240;
      const summaryX = MARGIN_LEFT + CONTENT_WIDTH - summaryWidth;

      const breakdown = quotation.financialBreakdown;
      const subtotalPaise =
        breakdown?.baseJoineryAmount || items.reduce((s, it) => s + it.total, 0);
      const hardwarePaise = breakdown?.hardwareAmount || 0;
      const designFeePaise = breakdown?.designFeeAmount || 0;
      const gstPaise =
        breakdown?.gstAmount || Math.round((subtotalPaise + hardwarePaise + designFeePaise) * 0.18);
      const grandTotalPaise = breakdown?.grandTotal || quotation.totalAmount;

      doc.rect(summaryX, currentY, summaryWidth, 90).fillColor(COLOR_LIGHT_BG).fill();
      doc
        .rect(summaryX, currentY, summaryWidth, 90)
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.5)
        .stroke();

      let sumY = currentY + 8;
      const printSumLine = (label: string, value: number, isBold: boolean = false) => {
        doc
          .fontSize(7.5)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(COLOR_OBSIDIAN);
        doc.text(label, summaryX + 10, sumY);
        doc.text(formatInr(value), summaryX + 10, sumY, {
          align: 'right',
          width: summaryWidth - 20,
        });
        sumY += 12;
      };

      printSumLine('Base Joinery & Cabinetry Subtotal:', subtotalPaise);
      if (hardwarePaise > 0) printSumLine('Blum / Hettich Hardware Package:', hardwarePaise);
      if (designFeePaise > 0)
        printSumLine(
          `3D Concept & Site Management (${breakdown?.designFeePercent || 10}%):`,
          designFeePaise,
        );
      printSumLine('GST (CGST 9% + SGST 9% / IGST 18%):', gstPaise);

      doc
        .moveTo(summaryX + 8, sumY)
        .lineTo(summaryX + summaryWidth - 8, sumY)
        .strokeColor(COLOR_GOLD)
        .lineWidth(1)
        .stroke();
      sumY += 4;

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLOR_GOLD);
      doc.text('NET INVESTMENT (INR):', summaryX + 10, sumY);
      doc.text(formatInr(grandTotalPaise), summaryX + 10, sumY, {
        align: 'right',
        width: summaryWidth - 20,
      });

      // Left column: In Words and Milestone Schedule
      const leftColWidth = CONTENT_WIDTH - summaryWidth - 16;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_TAUPE);
      doc.text('TOTAL AMOUNT IN WORDS:', MARGIN_LEFT, currentY + 4);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
      doc.text(numberToIndianWords(grandTotalPaise / 100), MARGIN_LEFT, currentY + 16, {
        width: leftColWidth,
      });

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLOR_TAUPE);
      doc.text(
        'MILESTONE PAYMENT SCHEDULE (4-STAGE ARCHITECTURAL DISBURSEMENT):',
        MARGIN_LEFT,
        currentY + 38,
      );
      doc.fontSize(7).font('Helvetica').fillColor(COLOR_MUTED);
      doc.text(
        '• 10% Advance Token: Floor Plan & 3D Photorealistic Visualizations',
        MARGIN_LEFT + 6,
        currentY + 49,
      );
      doc.text(
        '• 40% Factory Carcase Procurement: Century BWP Ply & Hardware Assembly',
        MARGIN_LEFT + 6,
        currentY + 59,
      );
      doc.text(
        '• 40% Site Execution: Cabinet Erection, Veneer PU Polishing & Fitting',
        MARGIN_LEFT + 6,
        currentY + 69,
      );
      doc.text(
        '• 10% Final Handover: Quality Audit, 10-Yr Warranty Issue & Deep Clean',
        MARGIN_LEFT + 6,
        currentY + 79,
      );

      // ── 6. Terms, Warranty & Signature Block ──
      currentY += 105;
      if (currentY > 670) {
        doc.addPage();
        currentY = 40;
      }

      doc
        .rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 48)
        .fillColor('#FFFFFF')
        .strokeColor(COLOR_BORDER)
        .lineWidth(0.5)
        .stroke();
      doc.fontSize(6.5).font('Helvetica').fillColor(COLOR_MUTED);
      doc.text(
        'WARRANTY & ASSURANCE: All marine-grade joinery carries a 10-year replacement warranty against borer, termite, and delamination. Blum Austria and Hettich Germany hardware carry lifetime mechanical operating warranties. 45-day turnkey delivery timeline commences from completion of factory 3D design approval.',
        MARGIN_LEFT + 8,
        currentY + 8,
        { width: CONTENT_WIDTH - 16 },
      );

      currentY += 60;

      // Signatures
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLOR_OBSIDIAN);
      doc.text('PREPARED BY: NATIONAL FURNITURE & INTERIORS', MARGIN_LEFT, currentY);
      doc.text('ACCEPTED & APPROVED BY PATRON:', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY);

      doc.fontSize(7).font('Helvetica').fillColor(COLOR_MUTED);
      doc.text('Principal Architect & Project Lead', MARGIN_LEFT, currentY + 12);
      doc.text('(Signature / Digital Acceptance)', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 12);

      doc
        .moveTo(MARGIN_LEFT, currentY + 36)
        .lineTo(MARGIN_LEFT + 160, currentY + 36)
        .strokeColor(COLOR_MUTED)
        .lineWidth(0.5)
        .stroke();
      doc
        .moveTo(MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 36)
        .lineTo(MARGIN_LEFT + CONTENT_WIDTH / 2 + 160, currentY + 36)
        .strokeColor(COLOR_MUTED)
        .lineWidth(0.5)
        .stroke();

      doc.end();
    });
  }
}
