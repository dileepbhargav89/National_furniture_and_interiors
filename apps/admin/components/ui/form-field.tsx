import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  helpText,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium"
        style={{ color: 'var(--nfi-text)' }}
      >
        {label}
        {required && (
          <span className="ml-1" style={{ color: 'var(--nfi-danger)' }} aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p className="text-xs font-medium" style={{ color: 'var(--nfi-danger)' }} role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

/* ── Shared input class string for consistency ─────────────── */
export const inputClassName =
  'block w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors ' +
  'placeholder:text-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const inputStyle = {
  borderColor: 'var(--nfi-border)',
  color: 'var(--nfi-text)',
  '--tw-ring-color': 'rgba(58, 31, 15, 0.2)',
} as React.CSSProperties;
