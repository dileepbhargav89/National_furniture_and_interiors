'use client';

import React, { useState, useRef } from 'react';
import { AdminService, User } from '@nfi/api-client';
import { NfiButton } from '@/components/ui/nfi-button';

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

interface BulkOnboardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (users: User[]) => void;
}

export function BulkOnboardModal({ open, onClose, onSuccess }: BulkOnboardModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultSummary, setResultSummary] = useState<{
    successCount: number;
    errorCount: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      'fullName,email,phone,userType,companyName,gstin\n' +
      'Vikramaditya Singhania,singhania@luxuryresidences.in,+919876543210,CUSTOMER,Singhania Estates,29AAAAA0000A1Z5\n' +
      'Ananya Deshmukh,ananya@atelierdesign.in,+919876543211,CUSTOMER,Atelier Interiors,27BBBBB1111B2Z6\n' +
      'Rajesh Verma,rajesh.verma@nationalinteriors.in,+919876543212,STAFF,National Studio Bengaluru,';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nfi_patron_bulk_onboarding_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      setError('The uploaded CSV is empty or only contains a header row.');
      return;
    }

    const rows: ParsedUserRow[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const [
        fullName = '',
        email = '',
        phone = '',
        userTypeRaw = 'CUSTOMER',
        companyName = '',
        gstin = '',
      ] = cols;

      const userTypeUpper = userTypeRaw.toUpperCase();
      const validUserType: 'CUSTOMER' | 'STAFF' | 'ADMIN' =
        userTypeUpper === 'STAFF' || userTypeUpper === 'ADMIN' ? userTypeUpper : 'CUSTOMER';

      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const hasName = fullName.length >= 2;

      let rowError = '';
      if (!hasName) rowError = 'Missing valid full name';
      else if (!emailValid) rowError = 'Invalid email syntax';

      rows.push({
        fullName,
        email,
        phone: phone || null,
        userType: validUserType,
        companyName: companyName || null,
        gstin: gstin || null,
        valid: hasName && emailValid,
        error: rowError,
      });
    }

    setParsedRows(rows);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        parseCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkOnboarding = async () => {
    const validOnes = parsedRows.filter((r) => r.valid);
    if (validOnes.length === 0) {
      setError('No valid rows found to onboard.');
      return;
    }

    setSubmitting(true);
    setError('');
    setResultSummary(null);

    try {
      const res = await AdminService.bulkOnboardUsers(
        validOnes.map((r) => ({
          fullName: r.fullName,
          email: r.email,
          phone: r.phone ?? null,
          userType: r.userType,
          companyName: r.companyName ?? null,
          gstin: r.gstin ?? null,
        })),
      );

      if (res.data) {
        setResultSummary({
          successCount: res.data.successCount,
          errorCount: res.data.errorCount,
          errors: res.data.errors,
        });

        if (res.data.created && res.data.created.length > 0) {
          onSuccess(res.data.created);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="backdrop-blur-xs absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border bg-white shadow-2xl"
        style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{
            borderColor: 'var(--nfi-border, #DDD0BE)',
            backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-stone-900">Bulk Patron & Trade Onboarding</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Upload CSV roster to provision corporate clients, architectural firms, and interior
              design partners.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[80vh] space-y-5 overflow-y-auto p-6">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Action Row: Template & File Input */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-dashed border-[#DDD0BE] bg-[#FAF9F6] p-4 sm:flex-row">
            <div>
              <p className="text-xs font-semibold text-stone-900">Need the official format?</p>
              <p className="text-[11px] text-stone-500">
                Includes columns for Name, Email, Phone, Type, Firm, and GSTIN.
              </p>
            </div>
            <NfiButton variant="secondary" size="sm" onClick={handleDownloadTemplate}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Sample CSV
            </NfiButton>
          </div>

          {/* Upload Area */}
          <div>
            <label
              htmlFor="csvFileInput"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 p-6 transition-colors hover:border-amber-500"
            >
              <svg
                className="mb-2 h-8 w-8 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-xs font-semibold text-stone-800">Click to select CSV file</span>
              <span className="mt-0.5 text-[11px] text-stone-500">
                Supports comma-delimited UTF-8 files
              </span>
              <input
                id="csvFileInput"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-900">
                  Parsed Entries ({parsedRows.length} total •{' '}
                  <span className="font-bold text-emerald-700">{validCount} valid</span>)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] text-stone-400 underline hover:text-stone-700"
                >
                  Clear Roster
                </button>
              </div>

              <div
                className="max-h-48 overflow-hidden overflow-y-auto rounded-lg border text-xs"
                style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
              >
                <table className="min-w-full divide-y divide-stone-200">
                  <thead className="sticky top-0 bg-[#FAF9F6] text-stone-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Firm / GSTIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.valid ? '' : 'bg-rose-50/60'}>
                        <td className="whitespace-nowrap px-3 py-2">
                          {r.valid ? (
                            <span className="font-medium text-emerald-600">✓ Ready</span>
                          ) : (
                            <span className="font-medium text-rose-600" title={r.error}>
                              ✕ {r.error}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2 font-medium text-stone-900">
                          {r.fullName}
                        </td>
                        <td className="max-w-[150px] truncate px-3 py-2 text-stone-600">
                          {r.email}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-700">
                            {r.userType}
                          </span>
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2 text-stone-500">
                          {r.companyName || r.gstin || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {resultSummary && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <span>✓ Bulk Onboarding Completed!</span>
              </div>
              <p className="text-stone-700">
                Successfully onboarded{' '}
                <span className="font-bold text-emerald-800">{resultSummary.successCount}</span>{' '}
                patrons.
                {resultSummary.errorCount > 0 && (
                  <span className="ml-1 text-rose-700">
                    ({resultSummary.errorCount} skipped due to duplicates or invalid records).
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Footer */}
          <div
            className="flex justify-end gap-3 border-t pt-3"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <NfiButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              {resultSummary ? 'Done' : 'Cancel'}
            </NfiButton>

            {!resultSummary && (
              <NfiButton
                type="button"
                variant="primary"
                size="sm"
                loading={submitting}
                disabled={validCount === 0 || submitting}
                onClick={handleExecuteBulkOnboarding}
              >
                Onboard {validCount > 0 ? `${validCount} Patrons` : ''}
              </NfiButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
