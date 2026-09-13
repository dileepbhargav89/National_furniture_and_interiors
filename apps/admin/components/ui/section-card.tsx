import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({ title, description, children, className = '', action }: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border ${className}`}
      style={{ borderColor: 'var(--nfi-border)' }}
    >
      {(title || action) && (
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>
              {title}
            </h2>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
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
