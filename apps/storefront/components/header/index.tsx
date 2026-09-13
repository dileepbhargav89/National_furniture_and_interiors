'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Logo } from './logo';
import { DesktopNavigation } from './desktop-navigation';
import { HeaderActions } from './header-actions';
import { SearchOverlay } from './search-overlay';
import { MobileMenu } from './mobile-menu';
import { CartDrawer } from '../cart-drawer';
import { AnnouncementBar } from './announcement-bar';
import { usePathname } from 'next/navigation';

export function NFIHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when search is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  return (
    <>
      {/* Dynamic Urgency / Promo Strip */}
      <AnnouncementBar />

      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 backdrop-blur-md border-b
          ${isScrolled
            ? 'h-[68px] shadow-sm'
            : 'h-[80px] border-transparent'
          }
        `}
        style={{
          backgroundColor: 'rgba(253, 248, 242, 0.96)',
          borderBottomColor: isScrolled ? 'var(--nfi-border)' : 'transparent',
          borderBottomWidth: '1px',
          borderBottomStyle: isScrolled ? 'solid' : 'solid',
          boxShadow: isScrolled ? '0 1px 0 0 rgba(224, 112, 32, 0.25), 0 2px 8px rgba(61, 26, 8, 0.06)' : 'none',
        }}
      >
        <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          
          {/* Mobile: Hamburger */}
          <div className="flex-1 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="transition-colors -ml-2 p-2 rounded-lg hover:bg-orange-50"
              style={{ color: 'var(--nfi-brown)' }}
              aria-label="Open Menu"
            >
              <Menu strokeWidth={1.5} size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-48">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center h-full">
            <DesktopNavigation />
          </div>

          {/* Actions */}
          <div className="flex-1 flex justify-end">
            <HeaderActions onSearchClick={() => setIsSearchOpen(true)} />
          </div>

        </div>

        {/* Search Overlay Dropdown */}
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </header>

      {/* Mobile Menu Overlay */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Existing Cart Drawer */}
      <CartDrawer />
    </>
  );
}
