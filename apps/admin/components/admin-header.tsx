'use client';

import { usePathname } from 'next/navigation';
import { AdminNotificationBell } from './notifications/admin-notification-bell';
import { useAuthStore } from '../features/auth/store/auth.store';
import { useAdminUIStore } from '../features/ui/store/ui.store';

// Map route prefixes to human-readable page names
const pageTitles: Record<string, string> = {
  '/dashboard': 'Executive Command Dashboard',
  '/analytics': 'Analytics & Business Intelligence',
  '/catalog/products': 'Bespoke Furniture Products',
  '/catalog/categories': 'Product Categories',
  '/catalog/collections': 'Curated Architectural Collections',
  '/catalog/inventory': 'Real-Time Inventory & Stock',
  '/reviews': 'Patron Product Reviews',
  '/orders': 'Order Production & Deliveries',
  '/payments': 'Financial Settlements & GST Invoices',
  '/design-projects/portfolio': 'Turnkey Design Portfolio',
  '/design-projects': '3D Atelier & Design Pipeline',
  '/crm': 'Patron Relations & CRM Leads',
  '/notifications': 'Omnichannel Notification Logs',
  '/cms/blogs': 'Architectural Journal & Blogs',
  '/cms/banners': 'Homepage & Lookbook Banners',
  '/users': 'Enterprise User Management',
  '/roles': 'Roles & RBAC Access Control',
  '/audit-logs': 'Immutable Security Audit Logs',
};

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return title;
    }
  }
  return 'Executive Portal';
}

export function AdminHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const user = useAuthStore((s) => s.user);
  const toggleMobileNav = useAdminUIStore((s) => s.toggleMobileNav);

  return (
    <header
      className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20 border-b select-none shadow-2xs"
      style={{
        borderColor: 'var(--nfi-border)',
      }}
    >
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-stone-700 hover:bg-stone-100 hover:text-black transition-colors"
          aria-label="Open Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile branding */}
        <div className="md:hidden flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: 'var(--nfi-orange)' }}
          >
            NFI
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--nfi-text)' }}>
            NFI Admin
          </span>
        </div>

        {/* Desktop: Luxury Page Title */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right Actions: Role Authority Pill + Notifications + Storefront Link */}
      <div className="flex items-center gap-3">
        {/* Executive Authority Indicator */}
        {user && (
          <div className="hidden lg:flex items-center">
            {user.roleName === 'SUPER_ADMIN' ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs"
                style={{ backgroundColor: 'rgba(224,112,32,0.12)', border: '1px solid rgba(224,112,32,0.35)', color: '#3D1A08' }}
                title="Universal authority across all settings, catalog, operations, and code"
              >
                <span style={{ color: 'var(--nfi-orange)' }}>✦</span>
                <span className="font-medium" style={{ color: 'var(--nfi-text)' }}>{user.fullName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--nfi-orange)', color: '#FFF' }}>
                  Super Admin
                </span>
              </div>
            ) : user.roleName === 'ADMIN' ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs"
                style={{ backgroundColor: 'rgba(92,45,16,0.08)', border: '1px solid rgba(92,45,16,0.2)', color: '#3D1A08' }}
                title="Full platform administrative access"
              >
                <span style={{ color: 'var(--nfi-brown)' }}>★</span>
                <span className="font-medium" style={{ color: 'var(--nfi-text)' }}>{user.fullName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(92,45,16,0.12)', color: 'var(--nfi-brown)' }}>
                  Platform Admin
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold shadow-2xs"
                title={`Operations Manager role: ${user.roleName}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="font-medium text-stone-900">{user.fullName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                  {user.roleName.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <AdminNotificationBell />

          {/* View Storefront link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--nfi-brown-mid)', border: '1px solid transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(224,112,32,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--nfi-orange)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,112,32,0.25)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--nfi-brown-mid)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
            title="Open Public Luxury Storefront (₹ INR)"
            aria-label="View Storefront"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--nfi-orange)' }}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="hidden sm:inline">Storefront</span>
          </a>
      </div>
    </header>
  );
}
