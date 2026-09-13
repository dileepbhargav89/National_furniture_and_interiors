'use client';

import { Search, User, Heart, ShoppingBag, LogOut, Package, Compass, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/cart-context';
import { useWishlist } from '../../context/wishlist-context';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { authService } from '../../features/auth/services/auth.service';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '../notifications/notification-bell';

export function HeaderActions({ onSearchClick }: { onSearchClick: () => void }) {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    }
    logout();
    setAccountOpen(false);
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3.5 md:gap-5">
      {/* Search */}
      <button 
        onClick={onSearchClick}
        className="text-gray-900 hover:text-black transition-colors p-1.5 rounded-full hover:bg-stone-100/60"
        aria-label="Search"
      >
        <Search strokeWidth={1.2} size={20} />
      </button>

      {/* Account Dropdown */}
      <div className="relative" ref={accountRef}>
        <button 
          onClick={() => setAccountOpen(!accountOpen)}
          className={`transition-colors p-1.5 rounded-full hover:bg-stone-100/60 ${
            isAuthenticated ? 'text-black' : 'text-gray-900 hover:text-black'
          }`}
          aria-label="Account"
        >
          <User strokeWidth={1.2} size={20} />
        </button>
        
        {/* Account Menu */}
        {accountOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white border border-[#E5DFD5] shadow-xl rounded-xl py-2 z-50 transform origin-top-right transition-all duration-200 divide-y divide-gray-100">
            {isAuthenticated ? (
              <>
                <div className="px-4 py-2.5 bg-stone-50/60">
                  <p className="text-xs font-serif font-bold text-gray-900 truncate">
                    {user?.fullName || 'Atelier Patron'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-[#FBF9F5] hover:text-[#8C6D3F] transition-colors"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>My Profile</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  </Link>
                  <Link 
                    href="/profile" 
                    className="flex items-center justify-between px-4 py-2 text-xs text-gray-600 hover:bg-[#FBF9F5] hover:text-[#8C6D3F] transition-colors" 
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>Orders & Invoices</span>
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                  <Link 
                    href="/profile" 
                    className="flex items-center justify-between px-4 py-2 text-xs text-gray-600 hover:bg-[#FBF9F5] hover:text-[#8C6D3F] transition-colors" 
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>Interior Projects</span>
                    <Compass className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                  <Link 
                    href="/wishlist" 
                    className="block px-4 py-2 text-xs text-gray-600 hover:bg-[#FBF9F5] hover:text-[#8C6D3F] transition-colors" 
                    onClick={() => setAccountOpen(false)}
                  >
                    Saved Wishlist
                  </Link>
                </div>
                <div className="pt-1">
                  <button 
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium" 
                    onClick={handleSignOut}
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-1">
                <Link 
                  href="/login" 
                  className="block px-4 py-2.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors" 
                  onClick={() => setAccountOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors" 
                  onClick={() => setAccountOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wishlist */}
      <Link href="/wishlist" className="text-gray-900 hover:text-black transition-colors relative p-1.5 rounded-full hover:bg-stone-100/60" aria-label="Wishlist">
        <Heart strokeWidth={1.2} size={20} className={wishlistCount > 0 ? 'fill-[#8C7355] text-[#8C7355]' : ''} />
        {wishlistCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#8C7355] text-white text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
            {wishlistCount}
          </span>
        )}
      </Link>

      {/* Notifications */}
      <NotificationBell />

      {/* Cart */}
      <button 
        onClick={openCart}
        className="text-gray-900 hover:text-black transition-colors relative p-1.5 rounded-full hover:bg-stone-100/60"
        aria-label="Cart"
      >
        <ShoppingBag strokeWidth={1.2} size={20} />
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full">
            {itemCount}
          </span>
        )}
      </button>

      {/* CTA */}
      <Link href="/contact" className="hidden lg:block ml-3">
        <button className="bg-[#1a1a1a] text-white px-6 py-2.5 text-[13px] tracking-wide font-medium hover:bg-black transition-colors">
          Book Consultation
        </button>
      </Link>
    </div>
  );
}
