import { describe, it, expect } from 'vitest';
import type { User, UnregisteredLead } from '@nfi/api-client';

describe('Admin Users Suite Logic Harness', () => {
  describe('Bulk Onboarding CSV Parser Algorithm', () => {
    interface ParsedUserRow {
      fullName: string;
      email: string;
      phone?: string | null;
      userType: 'CUSTOMER' | 'STAFF' | 'ADMIN';
      companyName?: string | null;
      gstin?: string | null;
      valid: boolean;
      error?: string;
    }

    function parseCsvText(text: string): { rows: ParsedUserRow[]; error?: string } {
      const rawLines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (rawLines.length === 0) {
        return { rows: [], error: 'The uploaded CSV file is empty.' };
      }

      const firstLineCols = rawLines[0]!.split(',').map((c) =>
        c
          .trim()
          .replace(/^["']|["']$/g, '')
          .toLowerCase(),
      );

      let emailIdx = firstLineCols.findIndex((c) => c.includes('email') || c.includes('mail'));
      let nameIdx = firstLineCols.findIndex((c) => c.includes('name'));
      let phoneIdx = firstLineCols.findIndex((c) => c.includes('phone') || c.includes('mobile'));
      let typeIdx = firstLineCols.findIndex((c) => c.includes('type') || c.includes('role'));
      let firmIdx = firstLineCols.findIndex((c) => c.includes('firm') || c.includes('company'));
      let gstinIdx = firstLineCols.findIndex((c) => c.includes('gst'));

      let startLine = 1;
      if (rawLines[0]!.includes('@') && emailIdx === -1) {
        startLine = 0;
        emailIdx = 0;
        nameIdx = 1;
        phoneIdx = 2;
      } else if (emailIdx === -1) {
        if (firstLineCols.length === 1) {
          emailIdx = 0;
        } else {
          nameIdx = 0;
          emailIdx = 1;
          phoneIdx = 2;
          typeIdx = 3;
          firmIdx = 4;
          gstinIdx = 5;
        }
      }

      const rows: ParsedUserRow[] = [];
      for (let i = startLine; i < rawLines.length; i++) {
        const line = rawLines[i]!;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

        const emailRaw = (emailIdx >= 0 ? cols[emailIdx] : '') || '';
        const email = emailRaw.toLowerCase().trim();

        const nameRaw = (nameIdx >= 0 ? cols[nameIdx] : '') || '';
        const phoneRaw = (phoneIdx >= 0 ? cols[phoneIdx] : '') || '';
        const typeRaw = (typeIdx >= 0 ? cols[typeIdx] : '') || 'CUSTOMER';
        const firmRaw = (firmIdx >= 0 ? cols[firmIdx] : '') || '';
        const gstinRaw = (gstinIdx >= 0 ? cols[gstinIdx] : '') || '';

        const userTypeUpper = typeRaw.toUpperCase();
        const validUserType: 'CUSTOMER' | 'STAFF' | 'ADMIN' =
          userTypeUpper === 'STAFF' || userTypeUpper === 'ADMIN' ? userTypeUpper : 'CUSTOMER';

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        let rowError = '';
        if (!email) {
          rowError = 'Missing email address';
        } else if (!emailValid) {
          rowError = 'Invalid email syntax';
        }

        const derivedName = nameRaw.trim() || email.split('@')[0] || 'Patron';

        rows.push({
          fullName: derivedName,
          email,
          phone: phoneRaw.trim() ? phoneRaw.trim() : null,
          userType: validUserType,
          companyName: firmRaw.trim() ? firmRaw.trim() : null,
          gstin: gstinRaw.trim() ? gstinRaw.trim() : null,
          valid: emailValid,
          error: rowError,
        });
      }

      return { rows };
    }

    it('parses valid CSV lines into structured patron records', () => {
      const sampleCsv =
        'fullName,email,phone,userType,companyName,gstin\n' +
        'Vikramaditya Singhania,singhania@luxuryresidences.in,+919876543210,CUSTOMER,Singhania Estates,29AAAAA0000A1Z5\n' +
        'Ananya Deshmukh,ananya@atelierdesign.in,+919876543211,STAFF,Atelier Interiors,';

      const result = parseCsvText(sampleCsv);
      expect(result.error).toBeUndefined();
      expect(result.rows).toHaveLength(2);

      const row1 = result.rows[0]!;
      expect(row1.fullName).toBe('Vikramaditya Singhania');
      expect(row1.email).toBe('singhania@luxuryresidences.in');
      expect(row1.userType).toBe('CUSTOMER');
      expect(row1.companyName).toBe('Singhania Estates');
      expect(row1.gstin).toBe('29AAAAA0000A1Z5');
      expect(row1.valid).toBe(true);

      const row2 = result.rows[1]!;
      expect(row2.userType).toBe('STAFF');
      expect(row2.gstin).toBeNull();
      expect(row2.valid).toBe(true);
    });

    it('parses email-only rosters and derives names automatically', () => {
      const emailOnlyCsv =
        'email\n' + 'riya.rathore@example.com\n' + 'mohit.sharma@example.com\n' + 'bad-email\n';

      const result = parseCsvText(emailOnlyCsv);
      expect(result.rows).toHaveLength(3);

      expect(result.rows[0]!.valid).toBe(true);
      expect(result.rows[0]!.fullName).toBe('riya.rathore');
      expect(result.rows[0]!.email).toBe('riya.rathore@example.com');

      expect(result.rows[1]!.valid).toBe(true);
      expect(result.rows[1]!.fullName).toBe('mohit.sharma');

      expect(result.rows[2]!.valid).toBe(false);
      expect(result.rows[2]!.error).toBe('Invalid email syntax');
    });

    it('returns empty rows if CSV is empty', () => {
      const emptyCsv = '';
      const result = parseCsvText(emptyCsv);
      expect(result.rows).toHaveLength(0);
      expect(result.error).toContain('empty');
    });
  });

  describe('Lead to Patron Conversion Initial Data Formatter', () => {
    function prepareOnboardFromLead(lead: UnregisteredLead) {
      return {
        fullName: lead.fullName || lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        companyName: '',
      };
    }

    it('correctly maps unregistered lead properties into onboarding form state', () => {
      const lead: UnregisteredLead = {
        id: 'lead-1',
        name: 'Rohan Mehra',
        email: 'rohan.mehra@example.com',
        phone: '+919845012345',
        source: 'DESIGN_INQUIRY',
        interestType: 'PENTHOUSE_INTERIORS',
        score: 90,
        priority: 'HOT',
        status: 'NEW',
        createdAt: '2026-09-18T00:00:00.000Z',
      };

      const formData = prepareOnboardFromLead(lead);
      expect(formData.fullName).toBe('Rohan Mehra');
      expect(formData.email).toBe('rohan.mehra@example.com');
      expect(formData.phone).toBe('+919845012345');
      expect(formData.companyName).toBe('');
    });

    it('falls back to empty string if email or phone is null/undefined', () => {
      const lead: UnregisteredLead = {
        id: 'lead-2',
        name: 'Guest Inquirer',
        email: null,
        phone: '',
        source: 'CONSULTATION',
        interestType: 'LIVING_ROOM',
        score: 50,
        priority: 'WARM',
        status: 'NEW',
        createdAt: '2026-09-18T00:00:00.000Z',
      };

      const formData = prepareOnboardFromLead(lead);
      expect(formData.fullName).toBe('Guest Inquirer');
      expect(formData.email).toBe('');
      expect(formData.phone).toBe('');
    });
  });

  describe('Patron Avatar & Localization Helpers', () => {
    function getInitials(name?: string) {
      if (!name) return 'U';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }

    function formatPaiseToRupees(paise?: number | null): string {
      const rupees = paise ? paise / 100 : 0;
      return `₹${rupees.toLocaleString('en-IN')}`;
    }

    it('extracts uppercase initials for multi-part and single names', () => {
      expect(getInitials('Vikramaditya Singhania')).toBe('VS');
      expect(getInitials('Ananya')).toBe('AN');
      expect(getInitials('Dr. Rajesh Verma')).toBe('DR');
      expect(getInitials('')).toBe('U');
      expect(getInitials(undefined)).toBe('U');
    });

    it('converts commercial spend from paise integers to formatted INR', () => {
      expect(formatPaiseToRupees(15000000)).toBe('₹1,50,000');
      expect(formatPaiseToRupees(6800000)).toBe('₹68,000');
      expect(formatPaiseToRupees(0)).toBe('₹0');
      expect(formatPaiseToRupees(null)).toBe('₹0');
    });
  });

  describe('User Status Transition Matrix', () => {
    function getNextToggleStatus(currentStatus?: User['status']): 'ACTIVE' | 'SUSPENDED' {
      const isSuspended = currentStatus === 'SUSPENDED' || currentStatus === 'BANNED';
      return isSuspended ? 'ACTIVE' : 'SUSPENDED';
    }

    it('transitions SUSPENDED or BANNED users to ACTIVE', () => {
      expect(getNextToggleStatus('SUSPENDED')).toBe('ACTIVE');
      expect(getNextToggleStatus('BANNED')).toBe('ACTIVE');
    });

    it('transitions ACTIVE, INACTIVE, or LOCKED users to SUSPENDED', () => {
      expect(getNextToggleStatus('ACTIVE')).toBe('SUSPENDED');
      expect(getNextToggleStatus('INACTIVE')).toBe('SUSPENDED');
      expect(getNextToggleStatus('LOCKED')).toBe('SUSPENDED');
    });
  });
});
