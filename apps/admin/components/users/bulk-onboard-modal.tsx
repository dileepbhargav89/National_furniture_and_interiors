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
      'email,fullName,phone,companyName,gstin\n' +
      'singhania@luxuryresidences.in,Vikramaditya Singhania,+919876543210,Singhania Estates,29AAAAA0000A1Z5\n' +
      'ananya@atelierdesign.in\n' +
      'rohit.mehta@studioarch.com,Rohit Mehta,,Mehta Architecture,\n' +
      'patron.client@domain.com\n';

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
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) {
      setError('The uploaded CSV file is empty.');
      return;
    }

    // Determine header positions
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

    // If first line contains an @ and no email header was matched, treat row 0 as data without headers
    if (rawLines[0]!.includes('@') && emailIdx === -1) {
      startLine = 0;
      emailIdx = 0;
      nameIdx = 1;
      phoneIdx = 2;
    } else if (emailIdx === -1) {
      // If only 1 column, it is email
      if (firstLineCols.length === 1) {
        emailIdx = 0;
      } else {
        // Fallback default: legacy order [fullName, email, phone, userType, companyName, gstin]
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

      // If full name is empty, fall back gracefully to email prefix
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
      // Support batch chunks of up to 500 items to guarantee high-velocity processing
      const CHUNK_SIZE = 500;
      let totalCreated: User[] = [];
      let totalErrors: Array<{ email: string; error: string }> = [];
      let totalSuccess = 0;

      for (let i = 0; i < validOnes.length; i += CHUNK_SIZE) {
        const chunk = validOnes.slice(i, i + CHUNK_SIZE);
        const res = await AdminService.bulkOnboardUsers(
          chunk.map((r) => ({
            email: r.email,
            fullName: r.fullName,
            phone: r.phone ?? null,
            userType: r.userType,
            companyName: r.companyName ?? null,
            gstin: r.gstin ?? null,
          })),
        );

        if (res.data) {
          totalSuccess += res.data.successCount;
          if (res.data.created) {
            totalCreated = totalCreated.concat(res.data.created);
          }
          if (res.data.errors) {
            totalErrors = totalErrors.concat(res.data.errors);
          }
        }
      }

      setResultSummary({
        successCount: totalSuccess,
        errorCount: totalErrors.length,
        errors: totalErrors,
      });

      if (totalCreated.length > 0) {
        onSuccess(totalCreated);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Bulk onboarding failed. Please ensure all email addresses are valid.',
      );
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Bulk Patron & Trade Onboarding</h2>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                Email-Only Ingestion Supported
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Upload CSV roster of up to 1,000 corporate clients, architects, and designers.
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
                Only <strong>Email</strong> is required. Name, Phone, Firm, and GSTIN are optional.
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
                Supports comma-delimited UTF-8 files up to 1,000 entries
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
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Name</th>
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
                        <td className="max-w-[150px] truncate px-3 py-2 font-medium text-stone-900">
                          {r.email}
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2 text-stone-600">
                          {r.fullName}
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
                    ({resultSummary.errorCount} skipped due to existing accounts).
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
