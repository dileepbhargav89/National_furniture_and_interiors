import React from 'react';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-gray-300 text-xs">/</span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs hover:underline transition-colors"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--nfi-text)' }}>
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-3 mt-1 flex-shrink-0">{action}</div>}
    </div>
  );
}
