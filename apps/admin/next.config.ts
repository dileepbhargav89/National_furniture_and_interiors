// App-level config — docs/06_project_structure.md §3.2. `output: 'standalone'` is required for
// docker/apps/Dockerfile.admin's runtime stage, which copies .next/standalone
// (docs/10_devops_architecture.md §4.1's deps->build->runtime shape).
//
// Standalone output makes Next.js symlink traced files into .next/standalone/node_modules —
// inside the Linux build container that's fine, but natively on Windows it requires Developer
// Mode (SeCreateSymbolicLinkPrivilege) and fails with EPERM otherwise. Rather than require every
// contributor to change a Windows security setting, standalone output is opt-in via DOCKER_BUILD
// (set by docker/apps/Dockerfile.admin's build stage only) — local `pnpm build`/`pnpm test`
// stays a plain Next.js build.
import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nfi/api-client', '@nfi/shared', '@nfi/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.swadeshonline.com',
      },
      {
        protocol: 'https',
        hostname: '*.swadeshonline.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000'}/api/v1/:path*`,
      },
    ];
  },
  ...(process.env.DOCKER_BUILD === 'true' && {
    output: 'standalone' as const,
    // Monorepo file tracing needs the repo root so workspace packages (@nfi/ui, @nfi/shared, ...)
    // resolve correctly into .next/standalone — https://nextjs.org/docs/app/api-reference/config/next-config-js/output.
    outputFileTracingRoot: path.join(__dirname, '../../'),
  }),
};

export default nextConfig;
