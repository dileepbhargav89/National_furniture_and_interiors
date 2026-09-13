'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, AdminUser } from '../features/auth/store/auth.store';
import { useAdminUIStore } from '../features/ui/store/ui.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  requiredPermission?: string;
  allowedRoles?: string[];
}

interface NavGroup {
  section?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Analytics', href: '/analytics', requiredPermission: 'analytics.read' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { label: 'Products', href: '/catalog/products', requiredPermission: 'catalog.read' },
      { label: 'Categories', href: '/catalog/categories', requiredPermission: 'catalog.read' },
      { label: 'Collections', href: '/catalog/collections', requiredPermission: 'catalog.read' },
      { label: 'Inventory', href: '/catalog/inventory', requiredPermission: 'catalog.read' },
      { label: 'Reviews', href: '/reviews', requiredPermission: 'reviews.read' },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'All Orders', href: '/orders', requiredPermission: 'orders.read' },
      { label: 'Payments', href: '/payments', requiredPermission: 'payments.read' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Design Projects', href: '/design-projects', requiredPermission: 'design-projects.read' },
      { label: 'Design Portfolio', href: '/design-projects/portfolio', requiredPermission: 'design-projects.read' },
      { label: 'Customers (CRM)', href: '/crm', requiredPermission: 'leads.read' },
      { label: 'Notifications', href: '/notifications', requiredPermission: 'notifications.read' },
    ],
  },
  {
    section: 'CMS',
    items: [
      { label: 'Blogs', href: '/cms/blogs', requiredPermission: 'cms.read' },
      { label: 'Banners', href: '/cms/banners', requiredPermission: 'cms.read' },
    ],
  },
  {
    section: 'Access Control',
    items: [
      { label: 'Users', href: '/users', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Roles & Permissions', href: '/roles', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Audit Logs', href: '/audit-logs', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  // Hydrate user details if token exists but user profile is unpopulated
  useEffect(() => {
    if (token && (!user || !user.fullName)) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiBase}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json?.data) {
            const claims = (() => {
              try {
                const parts = token.split('.');
                const base64Url = parts[1];
                if (!base64Url) return null;
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                return JSON.parse(
                  decodeURIComponent(
                    atob(base64)
                      .split('')
                      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                      .join('')
                  )
                );
              } catch {
                return null;
              }
            })();

            const hydratedUser: AdminUser = {
              id: json.data.id,
              email: json.data.email,
              fullName: json.data.fullName,
              roleName: claims?.roleName || (user?.roleName ?? 'ADMIN'),
              userType: json.data.userType || 'ADMIN',
              permissions: claims?.permissions || user?.permissions || [],
            };
            setUser(hydratedUser);
          }
        })
        .catch(() => {});
    }
  }, [token, user, setUser]);

  const isSuperAdminOrAdmin =
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'ADMIN' ||
    user?.userType === 'ADMIN' ||
    user?.permissions?.includes('*');

  const canViewItem = (item: NavItem): boolean => {
    if (isSuperAdminOrAdmin) return true;
    if (item.allowedRoles && user?.roleName) {
      if (item.allowedRoles.includes(user.roleName)) return true;
    }
    if (!item.requiredPermission) return true;
    return Boolean(user?.permissions?.includes(item.requiredPermission));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    if (!first) return 'A';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1];
    const firstChar = first[0] ?? 'A';
    const lastChar = last && last[0] ? last[0] : '';
    return (firstChar + lastChar).toUpperCase();
  };

  const getAvatarBadgeClass = () => {
    if (user?.roleName === 'SUPER_ADMIN') {
      return 'bg-gradient-to-tr from-amber-600 to-yellow-500 text-white shadow-xs';
    }
    if (user?.roleName === 'ADMIN') {
      return 'bg-stone-900 text-amber-300 border border-amber-500/40 shadow-xs';
    }
    return 'bg-[#8C7355] text-white';
  };

  const mobileNavOpen = useAdminUIStore((s) => s.mobileNavOpen);
  const closeMobileNav = useAdminUIStore((s) => s.closeMobileNav);

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  const renderContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div
        className="h-16 flex items-center px-5 flex-shrink-0 justify-between"
        style={{ borderBottom: '1px solid rgba(253, 248, 242, 0.08)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={() => {
            if (isMobile) closeMobileNav();
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow tracking-wider"
            style={{ backgroundColor: 'var(--nfi-orange)' }}
          >
            NFI
          </div>
          <div>
            <span
              className="text-xs font-bold tracking-tight block leading-none"
              style={{ color: 'var(--nfi-cream)' }}
            >
              National Furniture
            </span>
            <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--nfi-sidebar-muted)' }}>
              Executive Portal
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={closeMobileNav}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(canViewItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.section && (
                <p
                  className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--nfi-sidebar-muted)' }}
                >
                  {group.section}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isMobile) closeMobileNav();
                        }}
                        className={`nav-item flex items-center px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                          active
                            ? 'font-semibold'
                            : ''
                        }`}
                        style={active ? {
                          backgroundColor: 'rgba(224, 112, 32, 0.18)',
                          color: '#F5A060',
                          borderLeft: '3px solid var(--nfi-orange)',
                        } : {
                          color: 'rgba(245, 237, 224, 0.75)',
                          borderLeft: '3px solid transparent',
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(253, 248, 242, 0.06)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--nfi-cream)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'rgba(245, 237, 224, 0.75)';
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User Footer with Role Badge */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(253, 248, 242, 0.08)', backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center gap-2.5 px-1 py-1 rounded-md">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarBadgeClass()}`}
          >
            {getInitials(user?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--nfi-cream)' }}>
              {user?.fullName || 'Administrator'}
            </p>
            <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: 'var(--nfi-sidebar-muted)' }}>
              {user?.email || 'admin@nationalinteriors.com'}
            </p>
            <div className="mt-1">
              {user?.roleName === 'SUPER_ADMIN' ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(224,112,32,0.2)', color: '#F5A060', border: '1px solid rgba(224,112,32,0.35)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--nfi-orange)' }}></span>
                  SUPER ADMIN
                </span>
              ) : user?.roleName === 'ADMIN' ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(253,248,242,0.1)', color: 'rgba(245,237,224,0.85)', border: '1px solid rgba(253,248,242,0.15)' }}>
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  ADMINISTRATOR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(253,248,242,0.08)', color: 'rgba(245,237,224,0.7)', border: '1px solid rgba(253,248,242,0.12)' }}>
                  <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                  {user?.roleName ? user.roleName.replace(/_/g, ' ') : 'STAFF'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'rgba(245,237,224,0.45)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(192,40,28,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,237,224,0.45)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col hidden md:flex select-none"
        style={{ 
          backgroundColor: 'var(--nfi-brown-dark)',
          borderRight: '1px solid rgba(253, 248, 242, 0.06)',
        }}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeMobileNav}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div
            className="relative w-[85%] max-w-[300px] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--nfi-brown-dark)',
              borderRight: '1px solid rgba(253, 248, 242, 0.1)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Menu"
          >
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
