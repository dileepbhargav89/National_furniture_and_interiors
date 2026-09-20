'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, AdminUser } from '../features/auth/store/auth.store';
import { useAdminUIStore } from '../features/ui/store/ui.store';
import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Boxes,
  Star,
  ShoppingCart,
  CreditCard,
  DraftingCompass,
  Images,
  Contact,
  Bell,
  FileText,
  Image as ImageIcon,
  Users,
  ShieldCheck,
  History,
  LogOut,
  Pin,
  PinOff,
  X,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: TrendingUp,
        requiredPermission: 'analytics.read',
      },
    ],
  },
  {
    section: 'Client Pipeline',
    items: [
      {
        label: 'Sales CRM & Leads',
        href: '/crm',
        icon: Contact,
        requiredPermission: 'leads.read',
      },
      {
        label: 'Design Projects',
        href: '/design-projects',
        icon: DraftingCompass,
        requiredPermission: 'design-projects.read',
      },
      {
        label: 'Design Portfolio',
        href: '/design-projects/portfolio',
        icon: Images,
        requiredPermission: 'design-projects.read',
      },
    ],
  },
  {
    section: 'Commerce & Atelier',
    items: [
      {
        label: 'All Orders',
        href: '/orders',
        icon: ShoppingCart,
        requiredPermission: 'orders.read',
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        requiredPermission: 'payments.read',
      },
      {
        label: 'Products',
        href: '/catalog/products',
        icon: Package,
        requiredPermission: 'catalog.read',
      },
      {
        label: 'Categories',
        href: '/catalog/categories',
        icon: Layers,
        requiredPermission: 'catalog.read',
      },
      {
        label: 'Collections',
        href: '/catalog/collections',
        icon: Sparkles,
        requiredPermission: 'catalog.read',
      },
      {
        label: 'Inventory',
        href: '/catalog/inventory',
        icon: Boxes,
        requiredPermission: 'catalog.read',
      },
      { label: 'Reviews', href: '/reviews', icon: Star, requiredPermission: 'reviews.read' },
    ],
  },
  {
    section: 'Communications',
    items: [
      {
        label: 'Notifications',
        href: '/notifications',
        icon: Bell,
        requiredPermission: 'notifications.read',
      },
      { label: 'Blogs', href: '/cms/blogs', icon: FileText, requiredPermission: 'cms.read' },
      { label: 'Banners', href: '/cms/banners', icon: ImageIcon, requiredPermission: 'cms.read' },
    ],
  },
  {
    section: 'Governance',
    items: [
      {
        label: 'Users & Staff',
        href: '/users',
        icon: Users,
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Roles & Access',
        href: '/roles',
        icon: ShieldCheck,
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Audit Logs',
        href: '/audit-logs',
        icon: History,
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
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

  // Dynamic hover & pin states
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pin state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nfi_admin_sidebar_pinned');
      if (saved === 'true') {
        setIsPinned(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nfi_admin_sidebar_pinned', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  const isExpandedDesktop = isPinned || isHovered;

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
                      .join(''),
                  ),
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

  const renderContent = (isMobile: boolean, isExpanded: boolean) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 1. Top Brand Header (Compact height) */}
      <div
        className="h-13 flex flex-shrink-0 items-center justify-between px-3 transition-all"
        style={{ borderBottom: '1px solid rgba(253, 248, 242, 0.08)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden"
          onClick={() => {
            if (isMobile) closeMobileNav();
          }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-black tracking-wider text-white shadow-sm transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--nfi-orange)',
              boxShadow: '0 2px 8px rgba(224,112,32,0.3)',
            }}
          >
            NFI
          </div>
          {isExpanded && (
            <div className="animate-in fade-in min-w-0 transition-opacity duration-200">
              <span
                className="block truncate text-xs font-bold leading-none tracking-tight"
                style={{ color: 'var(--nfi-cream)' }}
              >
                National Furniture
              </span>
              <span
                className="mt-0.5 block truncate text-[9.5px] font-medium tracking-wide"
                style={{ color: 'var(--nfi-sidebar-muted)' }}
              >
                Executive Portal
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Pin/Unpin Toggle */}
        {!isMobile && isExpanded && (
          <button
            type="button"
            onClick={togglePin}
            title={isPinned ? 'Unpin sidebar (auto-collapse on hover out)' : 'Pin sidebar open'}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isPinned ? (
              <PinOff className="h-3.5 w-3.5 text-[#F5A060]" />
            ) : (
              <Pin className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
            )}
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobileNav}
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Navigation List: Flex-1, scrollable, never pushes footer off-screen */}
      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(canViewItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gi} className={gi > 0 ? (isExpanded ? 'mt-2.5' : 'mt-1.5') : ''}>
              {group.section && (
                <>
                  {isExpanded ? (
                    <p className="animate-in fade-in mb-1 px-2.5 text-[9px] font-bold uppercase tracking-wider text-[#D8B79B]/60 transition-opacity duration-200">
                      {group.section}
                    </p>
                  ) : (
                    <div className="mx-auto my-1 w-6 border-t border-white/10" />
                  )}
                </>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const IconComponent = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={!isExpanded ? item.label : undefined}
                        onClick={() => {
                          if (isMobile) closeMobileNav();
                        }}
                        className={`nav-item relative flex items-center rounded-lg text-xs transition-all ${
                          isExpanded
                            ? 'gap-2.5 px-2.5 py-1.5'
                            : 'h-8.5 w-8.5 mx-auto justify-center'
                        } ${active ? 'font-semibold' : 'font-medium'}`}
                        style={
                          active
                            ? {
                                backgroundColor: 'rgba(224, 112, 32, 0.22)',
                                color: '#F5A060',
                                ...(isExpanded
                                  ? { borderLeft: '3px solid var(--nfi-orange)' }
                                  : {}),
                              }
                            : {
                                color: 'rgba(245, 237, 224, 0.75)',
                                ...(isExpanded ? { borderLeft: '3px solid transparent' } : {}),
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              'rgba(253, 248, 242, 0.08)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--nfi-cream)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            (e.currentTarget as HTMLElement).style.color =
                              'rgba(245, 237, 224, 0.75)';
                          }
                        }}
                      >
                        <IconComponent
                          className={`flex-shrink-0 transition-colors ${
                            isExpanded ? 'h-4 w-4' : 'h-4 w-4'
                          } ${active ? 'text-[#E07020]' : 'text-stone-400 group-hover:text-stone-200'}`}
                        />

                        {isExpanded && (
                          <span className="animate-in fade-in flex-1 truncate text-left text-[11.5px] transition-opacity duration-200">
                            {item.label}
                          </span>
                        )}

                        {/* Active badge dot when collapsed */}
                        {!isExpanded && active && (
                          <span
                            className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ring-2 ring-[#46220E]"
                            style={{ backgroundColor: 'var(--nfi-orange)' }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* 3. User Footer with Profile & Logout (PERMANENTLY PINNED AT BOTTOM) */}
      <div
        className="flex-shrink-0 p-2"
        style={{
          borderTop: '1px solid rgba(253, 248, 242, 0.08)',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        {!isExpanded ? (
          /* Collapsed View: Profile Avatar + Direct 1-Click Logout Button */
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <div
              title={`${user?.fullName || 'Administrator'} • ${user?.roleName ? user.roleName.replace(/_/g, ' ') : 'Platform Admin'}`}
              className={`h-7.5 w-7.5 shadow-xs relative flex cursor-default items-center justify-center rounded-full text-[10.5px] font-bold ${getAvatarBadgeClass()}`}
            >
              {getInitials(user?.fullName)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#46220E] bg-emerald-500" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={`Sign Out (${user?.fullName || 'Administrator'})`}
              aria-label="Sign out of portal"
              className="h-7.5 w-7.5 flex items-center justify-center rounded-lg text-stone-400 transition-all hover:bg-rose-500/20 hover:text-rose-300 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded View: Full Card with Avatar, Name, Role Badge, and Logout */
          <div className="flex items-center gap-2 rounded-lg px-1 py-0.5">
            <div
              title={user?.fullName || 'Administrator'}
              className={`shadow-xs relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarBadgeClass()}`}
            >
              {getInitials(user?.fullName)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#46220E] bg-emerald-500" />
            </div>

            <div className="animate-in fade-in min-w-0 flex-1 transition-opacity duration-200">
              <p
                className="truncate text-xs font-semibold leading-tight"
                style={{ color: 'var(--nfi-cream)' }}
              >
                {user?.fullName || 'Administrator'}
              </p>
              <p className="mt-0.5 truncate text-[10px] leading-tight text-stone-400">
                {user?.email || 'admin@nationalinteriors.com'}
              </p>
              <div className="mt-1">
                {user?.roleName === 'SUPER_ADMIN' ? (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                    style={{
                      backgroundColor: 'rgba(224,112,32,0.25)',
                      color: '#F5A060',
                      border: '1px solid rgba(224,112,32,0.4)',
                    }}
                  >
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: 'var(--nfi-orange)' }}
                    />
                    SUPER ADMIN
                  </span>
                ) : user?.roleName === 'ADMIN' ? (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                    style={{
                      backgroundColor: 'rgba(253,248,242,0.1)',
                      color: 'rgba(245,237,224,0.85)',
                      border: '1px solid rgba(253,248,242,0.15)',
                    }}
                  >
                    <span className="h-1 w-1 rounded-full bg-amber-400" />
                    ADMINISTRATOR
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-semibold"
                    style={{
                      backgroundColor: 'rgba(253,248,242,0.08)',
                      color: 'rgba(245,237,224,0.7)',
                      border: '1px solid rgba(253,248,242,0.12)',
                    }}
                  >
                    <span className="h-1 w-1 rounded-full bg-blue-400" />
                    {user?.roleName ? user.roleName.replace(/_/g, ' ') : 'STAFF'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out of portal"
              aria-label="Sign out"
              className="h-7.5 w-7.5 flex flex-shrink-0 items-center justify-center rounded-lg text-stone-400 transition-all hover:bg-rose-500/20 hover:text-rose-300 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Dynamic Sidebar Container with Hover Expand */}
      <div
        className="relative hidden flex-shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:block"
        style={{
          width: isPinned ? 236 : 60,
        }}
      >
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute bottom-0 left-0 top-0 flex select-none flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isExpandedDesktop
              ? 'z-40 w-[236px] shadow-2xl shadow-black/60'
              : 'z-20 w-[60px] shadow-sm'
          }`}
          style={{
            backgroundColor: 'var(--nfi-brown-dark)',
            borderRight: '1px solid rgba(253, 248, 242, 0.08)',
          }}
          aria-label="Enterprise Navigation Portal"
        >
          {renderContent(false, isExpandedDesktop)}
        </aside>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="backdrop-blur-xs fixed inset-0 bg-black/60 transition-opacity duration-300"
            onClick={closeMobileNav}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div
            className="animate-in slide-in-from-left relative z-10 flex h-full w-[85%] max-w-[280px] flex-col overflow-y-auto shadow-2xl duration-200"
            style={{
              backgroundColor: 'var(--nfi-brown-dark)',
              borderRight: '1px solid rgba(253, 248, 242, 0.1)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Menu"
          >
            {renderContent(true, true)}
          </div>
        </div>
      )}
    </>
  );
}
