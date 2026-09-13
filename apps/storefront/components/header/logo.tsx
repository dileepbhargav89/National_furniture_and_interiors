'use client';

import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center">
      <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:opacity-80 transition-opacity">
        NFI.
      </span>
    </Link>
  );
}
