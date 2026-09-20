import React from 'react';

interface SectionCardProps {
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  children,
  className = '',
  action,
}: SectionCardProps) {
  return (
    <div
      className={`rounded-lg border bg-white ${className}`}
      style={{ borderColor: 'var(--nfi-border)' }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            {typeof title === 'string' ? (
              <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>
                {title}
              </h2>
            ) : (
              title
            )}
            {description && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
