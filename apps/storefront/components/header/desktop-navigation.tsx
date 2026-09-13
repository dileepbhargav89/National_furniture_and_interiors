'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FurnitureMegaMenu } from './mega-menus/furniture-menu';
import { CollectionsMegaMenu } from './mega-menus/collections-menu';
import { DesignServicesMenu } from './mega-menus/design-services-menu';

const NAV_ITEMS = [
  { label: 'Furniture', href: '/products', type: 'mega', id: 'furniture' },
  { label: 'Design Services', href: '/design-services', type: 'dropdown', id: 'design-services' },
  { label: 'Collections', href: '/collections', type: 'mega', id: 'collections' },
  { label: 'Our Story', href: '/our-story', type: 'link', id: 'about' },
  { label: 'Contact Us', href: '/contact', type: 'link', id: 'contact' },
];

export function DesktopNavigation() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Close menus when mouse leaves the entire nav area
  const handleMouseLeaveNav = () => {
    setActiveMenu(null);
  };

  return (
    <nav className="hidden lg:flex items-center h-full gap-7 xl:gap-8 relative" onMouseLeave={handleMouseLeaveNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const isHovered = activeMenu === item.id;

        return (
          <div 
            key={item.id}
            className="flex items-center h-full relative"
            onMouseEnter={() => item.type !== 'link' && setActiveMenu(item.id)}
          >
            <Link 
              href={item.href}
              className={`text-[14px] font-medium tracking-wide transition-colors relative h-full flex items-center
                ${isActive || isHovered
                  ? 'text-[#3D1A08]'
                  : 'text-[#7A5C45] hover:text-[#3D1A08]'
                }
              `}
            >
              {item.label}
              {/* Active Indicator — Brand Orange */}
              {isActive && (
                <span className="absolute bottom-[20px] left-0 w-full h-[2px] rounded-full" style={{ backgroundColor: 'var(--nfi-orange)' }} />
              )}
            </Link>

            {/* Render dropdown pop windows relative to this specific nav item */}
            {item.id === 'furniture' && (
              <FurnitureMegaMenu isOpen={activeMenu === 'furniture'} onClose={() => setActiveMenu(null)} />
            )}
            {item.id === 'design-services' && (
              <DesignServicesMenu isOpen={activeMenu === 'design-services'} onClose={() => setActiveMenu(null)} />
            )}
            {item.id === 'collections' && (
              <CollectionsMegaMenu isOpen={activeMenu === 'collections'} onClose={() => setActiveMenu(null)} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
