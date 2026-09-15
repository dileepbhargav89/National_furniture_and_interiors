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
    <div className="xl:gap-4.5 flex shrink-0 items-center gap-1 sm:gap-2.5 md:gap-3.5">
      {/* Search */}
      <button
        onClick={onSearchClick}
        className="rounded-full p-1.5 text-gray-900 transition-colors hover:bg-stone-100/60 hover:text-black"
        aria-label="Search"
      >
        <Search strokeWidth={1.2} size={20} />
      </button>

      {/* Account Dropdown */}
      <div className="relative" ref={accountRef}>
        <button
          onClick={() => setAccountOpen(!accountOpen)}
          className={`rounded-full p-1.5 transition-colors hover:bg-stone-100/60 ${
            isAuthenticated ? 'text-black' : 'text-gray-900 hover:text-black'
          }`}
          aria-label="Account"
        >
          <User strokeWidth={1.2} size={20} />
        </button>

        {/* Account Menu */}
        {accountOpen && (
          <div className="absolute right-0 z-50 mt-3 w-56 origin-top-right transform divide-y divide-gray-100 rounded-xl border border-[#E5DFD5] bg-white py-2 shadow-xl transition-all duration-200">
            {isAuthenticated ? (
              <>
                <div className="bg-stone-50/60 px-4 py-2.5">
                  <p className="truncate font-serif text-xs font-bold text-gray-900">
                    {user?.fullName || 'Atelier Patron'}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-800 transition-colors hover:bg-[#FBF9F5] hover:text-[#8C6D3F]"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>My Profile</span>
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A880]" />
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center justify-between px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-[#FBF9F5] hover:text-[#8C6D3F]"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>Orders & Invoices</span>
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center justify-between px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-[#FBF9F5] hover:text-[#8C6D3F]"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span>Interior Projects</span>
                    <Compass className="h-3.5 w-3.5 text-gray-400" />
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-[#FBF9F5] hover:text-[#8C6D3F]"
                    onClick={() => setAccountOpen(false)}
                  >
                    Saved Wishlist
                  </Link>
                </div>
                <div className="pt-1">
                  <button
                    className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    onClick={handleSignOut}
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-1">
                <Link
                  href="/login"
                  className="block px-4 py-2.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                  onClick={() => setAccountOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
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
      <Link
        href="/wishlist"
        className="relative rounded-full p-1.5 text-gray-900 transition-colors hover:bg-stone-100/60 hover:text-black"
        aria-label="Wishlist"
      >
        <Heart
          strokeWidth={1.2}
          size={20}
          className={wishlistCount > 0 ? 'fill-[#8C7355] text-[#8C7355]' : ''}
        />
        {wishlistCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#8C7355] text-[10px] font-medium text-white shadow-sm">
            {wishlistCount}
          </span>
        )}
      </Link>

      {/* Notifications */}
      <NotificationBell />

      {/* Cart */}
      <button
        onClick={openCart}
        className="relative rounded-full p-1.5 text-gray-900 transition-colors hover:bg-stone-100/60 hover:text-black"
        aria-label="Cart"
      >
        <ShoppingBag strokeWidth={1.2} size={20} />
        {itemCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-medium text-white">
            {itemCount}
          </span>
        )}
      </button>

      {/* CTA */}
      <Link href="/contact" className="ml-2 hidden shrink-0 lg:block xl:ml-3">
        <button className="whitespace-nowrap bg-[#1a1a1a] px-3.5 py-2 text-xs font-medium tracking-wide text-white transition-colors hover:bg-black xl:px-5 xl:text-[13px]">
          Book Consultation
        </button>
      </Link>
    </div>
  );
}
