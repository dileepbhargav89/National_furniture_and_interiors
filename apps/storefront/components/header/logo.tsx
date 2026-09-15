'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  variant?: 'header' | 'footer' | 'mobile';
  isScrolled?: boolean;
  onClick?: () => void;
}

export function Logo({
  className = '',
  variant = 'header',
  isScrolled = false,
  onClick,
}: LogoProps) {
  const linkProps = onClick !== undefined ? { onClick } : {};

  if (variant === 'footer') {
    return (
      <Link
        href="/"
        {...linkProps}
        className={`group inline-flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02] ${className}`}
        aria-label="National Furniture & Interiors Home"
      >
        <div className="flex items-center justify-center rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-white/20 transition-all group-hover:shadow-md group-hover:ring-white/40">
          <Image
            src="/nfi-logo-crisp.png"
            alt="National Furniture & Interiors"
            width={636}
            height={380}
            className="h-10 w-auto object-contain sm:h-11"
          />
        </div>
      </Link>
    );
  }

  if (variant === 'mobile') {
    return (
      <Link
        href="/"
        {...linkProps}
        className={`group flex items-center transition-opacity hover:opacity-90 ${className}`}
        aria-label="National Furniture & Interiors Home"
      >
        <Image
          src="/nfi-logo-crisp.png"
          alt="National Furniture & Interiors"
          width={636}
          height={380}
          priority
          className="h-11 w-auto object-contain mix-blend-multiply sm:h-12"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      {...linkProps}
      className={`group flex items-center transition-opacity hover:opacity-90 ${className}`}
      aria-label="National Furniture & Interiors Home"
    >
      <Image
        src="/nfi-logo-crisp.png"
        alt="National Furniture & Interiors"
        width={636}
        height={380}
        priority
        className={`w-auto object-contain mix-blend-multiply transition-all duration-300 ${
          isScrolled ? 'h-[46px] sm:h-[50px] md:h-[52px]' : 'h-[54px] sm:h-[58px] md:h-[62px]'
        }`}
      />
    </Link>
  );
}
