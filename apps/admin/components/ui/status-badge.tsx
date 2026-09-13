import React from 'react';

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'published'
  | 'draft'
  | 'archived'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'low_stock'
  | 'out_of_stock'
  | 'processing'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string; // override display text
}

const variantMap: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  active:       { bg: '#F0FAF0', text: '#2E7D32', border: '#C8E6C9', dot: '#2E7D32' },
  published:    { bg: '#F0FAF0', text: '#2E7D32', border: '#C8E6C9', dot: '#2E7D32' },
  completed:    { bg: '#F0FAF0', text: '#2E7D32', border: '#C8E6C9', dot: '#2E7D32' },
  inactive:     { bg: '#F5F5F5', text: '#555555', border: '#E0E0E0', dot: '#9E9E9E' },
  draft:        { bg: '#F5F5F5', text: '#555555', border: '#E0E0E0', dot: '#9E9E9E' },
  archived:     { bg: '#FFF3E0', text: '#B7791F', border: '#FFE082', dot: '#F9A825' },
  pending:      { bg: '#FFF8E1', text: '#B7791F', border: '#FFE082', dot: '#F9A825' },
  processing:   { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB', dot: '#1E88E5' },
  low_stock:    { bg: '#FFF3E0', text: '#B7791F', border: '#FFE082', dot: '#F9A825' },
  out_of_stock: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2', dot: '#E53935' },
  cancelled:    { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2', dot: '#E53935' },
};

const labelMap: Record<string, string> = {
  active:       'Active',
  inactive:     'Inactive',
  published:    'Published',
  draft:        'Draft',
  archived:     'Archived',
  pending:      'Pending',
  completed:    'Completed',
  cancelled:    'Cancelled',
  low_stock:    'Low Stock',
  out_of_stock: 'Out of Stock',
  processing:   'Processing',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/ /g, '_');
  const style = variantMap[key] ?? {
    bg: '#F5F5F5',
    text: '#555555',
    border: '#E0E0E0',
    dot: '#9E9E9E',
  };
  const displayLabel = label ?? labelMap[key] ?? status;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.dot }}
      />
      {displayLabel}
    </span>
  );
}
