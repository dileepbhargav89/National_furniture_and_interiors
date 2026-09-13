import React from 'react';

interface NfiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const variantStyles = {
  primary: {
    background: 'var(--nfi-primary, #E07020)',
    color: '#FFFFFF',
    border: '1px solid var(--nfi-primary, #E07020)',
    hoverBg: 'var(--nfi-primary-hover, #B85A10)',
  },
  secondary: {
    background: 'var(--nfi-surface)',
    color: 'var(--nfi-text)',
    border: '1px solid var(--nfi-border)',
    hoverBg: 'var(--nfi-surface-muted)',
  },
  danger: {
    background: 'var(--nfi-danger)',
    color: '#FFFFFF',
    border: '1px solid var(--nfi-danger)',
    hoverBg: '#B71C1C',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--nfi-text-secondary)',
    border: '1px solid transparent',
    hoverBg: 'var(--nfi-surface-muted)',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export function NfiButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  style,
  ...props
}: NfiButtonProps) {
  const v = variantStyles[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: v.background,
        color: v.color,
        border: v.border,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = v.hoverBg;
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = v.background;
        }
        props.onMouseLeave?.(e);
      }}
    >
      {loading ? (
        <svg className="h-4 w-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
