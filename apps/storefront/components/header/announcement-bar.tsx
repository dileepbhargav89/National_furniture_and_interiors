'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CmsService, Banner, BannerPlacement } from '@nfi/api-client';
import { Store, Pencil, MapPin, X, Check, Search, ArrowRight } from 'lucide-react';

interface StoreLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  pincode: string;
}

const NFI_STORES: StoreLocation[] = [
  {
    id: 'delhi-vikas-marg',
    name: 'NFI Store Vikas Marg',
    city: 'Delhi NCR',
    address: 'A-24, Vikas Marg, Near Metro Station, Preet Vihar, New Delhi',
    pincode: '110092',
  },
  {
    id: 'bengaluru-hsr',
    name: 'NFI Flagship Studio HSR',
    city: 'Bengaluru',
    address: '#1315, 24th Main Road, Sector 2, HSR Layout, Bengaluru',
    pincode: '560102',
  },
  {
    id: 'mumbai-bandra',
    name: 'NFI Atelier Bandra',
    city: 'Mumbai',
    address: 'Linking Road, Near National College, Bandra West, Mumbai',
    pincode: '400050',
  },
  {
    id: 'hyderabad-jubilee',
    name: 'NFI Studio Jubilee Hills',
    city: 'Hyderabad',
    address: 'Plot 72, Road No. 36, Jubilee Hills, Hyderabad',
    pincode: '500033',
  },
];

export function AnnouncementBar() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('NFI Store Vikas Marg');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [searchPincode, setSearchPincode] = useState('');
  const impressionRecorded = useRef<string | null>(null);

  useEffect(() => {
    // Check saved store in local storage
    if (typeof window !== 'undefined') {
      const savedStore = localStorage.getItem('nfi_nearest_store');
      if (savedStore) {
        setSelectedStore(savedStore);
      }
    }

    async function loadPromoBanner() {
      try {
        const response = await CmsService.getBanners({ placement: BannerPlacement.PROMO_STRIP });
        const activeBanners = (response.data || []).filter((b: Banner) => b.isActive);
        if (activeBanners.length > 0) {
          activeBanners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          const topPromo = activeBanners[0];
          if (topPromo) {
            setBanner(topPromo);
            if (impressionRecorded.current !== topPromo.id) {
              impressionRecorded.current = topPromo.id;
              CmsService.trackBannerImpression(topPromo.id).catch(() => {});
            }
          }
        }
      } catch {
        // Fallback gracefully to default luxury offer
      }
    }

    loadPromoBanner();
  }, []);

  // Close store modal on Escape key
  useEffect(() => {
    if (!isStoreModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStoreModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoreModalOpen]);

  const handleSelectStore = (store: StoreLocation) => {
    setSelectedStore(store.name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_nearest_store', store.name);
    }
    setIsStoreModalOpen(false);
  };

  const handleBannerClick = () => {
    if (banner) {
      CmsService.trackBannerClick(banner.id).catch(() => {});
    }
  };

  const promoTitle =
    banner?.title ||
    'Additional up to ₹10,000 off. Use code EXTRA10K | Limited-time deal—Shop now!';
  const promoLink = banner?.linkUrl || '/products';

  const filteredStores = searchPincode.trim()
    ? NFI_STORES.filter(
        (s) =>
          s.pincode.includes(searchPincode.trim()) ||
          s.city.toLowerCase().includes(searchPincode.toLowerCase()) ||
          s.name.toLowerCase().includes(searchPincode.toLowerCase()),
      )
    : NFI_STORES;

  return (
    <>
      <div
        role="region"
        aria-label="Promotional Headline and Store Navigation"
        className="relative z-50 select-none text-white transition-all duration-300"
        style={{
          backgroundColor: '#DE6226',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="container mx-auto flex items-center justify-between px-3 py-1.5 text-[11px] sm:px-6 sm:text-xs">
          {/* Left: Nearest Store Selector */}
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            <Store className="h-3.5 w-3.5 shrink-0 text-white sm:h-4 sm:w-4" strokeWidth={2.2} />
            <span className="xs:inline hidden font-medium text-white/95">Nearest Store -</span>
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(true)}
              className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#DE6226] transition-all hover:bg-orange-50 active:scale-95"
              title="Click to change your nearest Experience Centre"
            >
              <span className="max-w-[140px] truncate sm:max-w-none">{selectedStore}</span>
              <Pencil className="h-2.5 w-2.5 shrink-0 text-[#DE6226]/80" strokeWidth={2.5} />
            </button>
          </div>

          {/* Center: Promotional Headline Deal */}
          <div className="hidden flex-1 px-2 text-center sm:block sm:px-4">
            <Link
              href={promoLink}
              onClick={handleBannerClick}
              className="inline-flex items-center justify-center gap-1.5 font-medium tracking-tight text-white transition-colors hover:text-orange-100"
            >
              <span className="truncate">{promoTitle}</span>
            </Link>
          </div>

          {/* Right: Quick Utility Links */}
          <div className="flex flex-shrink-0 items-center gap-2.5 font-medium text-white/95 sm:gap-4">
            <Link
              href="/collections"
              className="hidden transition-colors hover:text-white hover:underline md:inline"
            >
              Gift Cards
            </Link>
            <Link
              href="/contact?type=franchisee"
              className="hidden transition-colors hover:text-white hover:underline md:inline"
            >
              Become a Franchisee
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white hover:underline">
              Help
            </Link>
          </div>
        </div>

        {/* Mobile Promo Line (Visible on small screens where center is hidden) */}
        <div className="border-t border-white/10 bg-[#CC5319] px-3 py-1 text-center text-[10.5px] sm:hidden">
          <Link
            href={promoLink}
            onClick={handleBannerClick}
            className="block truncate font-medium text-white hover:underline"
          >
            {promoTitle}
          </Link>
        </div>
      </div>

      {/* Studio / Store Selection Modal */}
      {isStoreModalOpen && (
        <div
          className="backdrop-blur-xs animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200"
          onClick={() => setIsStoreModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#DE6226]">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="store-modal-title" className="text-sm font-bold text-stone-900">
                    Select Nearest Experience Centre
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Visit our studio for complimentary 3D design consultations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close store selection modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search city, locality or pincode..."
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-xs text-stone-800 transition-all focus:border-[#DE6226] focus:outline-none focus:ring-1 focus:ring-[#DE6226]"
              />
            </div>

            {/* Store List */}
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {filteredStores.map((store) => {
                const isSelected = selectedStore === store.name;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleSelectStore(store)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'shadow-2xs border-[#DE6226] bg-orange-50/60'
                        : 'border-stone-200/80 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          className={`h-3.5 w-3.5 ${isSelected ? 'text-[#DE6226]' : 'text-stone-400'}`}
                        />
                        <span className="text-xs font-bold text-stone-900">{store.name}</span>
                        <span className="py-0.2 rounded bg-stone-100 px-1.5 text-[10px] font-semibold text-stone-500">
                          {store.city}
                        </span>
                      </div>
                      <p className="pl-5 text-[11px] leading-tight text-stone-600">
                        {store.address}
                      </p>
                      <p className="pl-5 font-mono text-[10px] text-stone-400">
                        Pincode: {store.pincode}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DE6226] text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredStores.length === 0 && (
                <div className="py-6 text-center text-xs text-stone-500">
                  No experience centre found for &ldquo;{searchPincode}&rdquo;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
              <Link
                href="/contact"
                onClick={() => setIsStoreModalOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#DE6226] hover:underline"
              >
                <span>View All Showroom Addresses & Directions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
