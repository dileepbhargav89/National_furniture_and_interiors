'use client';

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '../../components/product-card';
import { ProductSkeleton } from '../../components/product-skeleton';
import { QuickViewModal } from '../../components/quick-view-modal';
import { CatalogService, Product, Category } from '@nfi/api-client';
import { Sparkles, ShieldCheck, Truck, MessageCircle } from 'lucide-react';

const PRICE_RANGES = [
  { label: 'Under ₹25,000', min: undefined, max: 2500000 },
  { label: '₹25,000 – ₹50,000', min: 2500000, max: 5000000 },
  { label: '₹50,000 – ₹1,00,000', min: 5000000, max: 10000000 },
  { label: 'Above ₹1,00,000', min: 10000000, max: undefined },
];

const MATERIALS = [
  'Solid Teak Wood',
  'White Oak Wood',
  'Rosewood',
  'Royal Velvet',
  'Carrara Marble',
  'Italian Leather',
  'Belgian Linen',
];

const PRODUCT_TYPES = [
  { label: 'Ready to Ship', value: 'READY_TO_SHIP' },
  { label: 'Made to Order', value: 'MADE_TO_ORDER' },
];

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Desktop sidebar collapse toggle (Hide Filters / Show Filters)
  const [showFilters, setShowFilters] = useState(false);

  // Top Bar Dropdown Popovers: 'price' | 'material' | 'type' | null
  const [activeDropdown, setActiveDropdown] = useState<'price' | 'material' | 'type' | null>(null);

  // Layout View Mode: 'grid3' | 'grid4' | 'grid5' | 'list'
  const [viewMode, setViewMode] = useState<'grid3' | 'grid4' | 'grid5' | 'list'>('grid4');

  // Mobile Filter Drawer Open State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Category scroll container reference for smooth chevron navigation
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Read state from URL
  const currentCategorySlug = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'featured';
  const currentMinPrice = searchParams.get('minPrice');
  const currentMaxPrice = searchParams.get('maxPrice');
  const currentMaterial = searchParams.get('material') || '';
  const currentProductType = searchParams.get('productType') || '';
  const currentInStock = searchParams.get('inStock') === 'true';

  // Local search input state for smooth debouncing
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Click outside to dismiss open dropdown popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-popover-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch Categories once
  useEffect(() => {
    const initCategories = async () => {
      try {
        const response = await CatalogService.listCategories();
        const items = response.data?.items || (Array.isArray(response.data) ? response.data : []);
        setCategories(items);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    initCategories();
  }, []);

  // Filter top-level categories for header pills so the bar remains clean & uncluttered
  const primaryCategories = useMemo(() => {
    return categories.filter((c) => c.level === 0 || !c.level || c.parentId === null);
  }, [categories]);

  // Subcategories of selected category (if applicable)
  const activeSubcategories = useMemo(() => {
    if (currentCategorySlug === 'all') return [];
    const parent = categories.find((c) => c.slug === currentCategorySlug);
    if (!parent) return [];
    return categories.filter((c) => c.parentId === (parent.id || parent._id));
  }, [categories, currentCategorySlug]);

  // Active selected category entity (for dynamic header title & description)
  const currentCategory = useMemo(() => {
    if (currentCategorySlug === 'all') return null;
    return categories.find((c) => c.slug === currentCategorySlug) || null;
  }, [categories, currentCategorySlug]);

  // Handle URL updates
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // Debounced search sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateUrl({ search: searchInput ? searchInput : null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateUrl]);

  // Fetch Products whenever URL parameters change
  useEffect(() => {
    if (currentCategorySlug !== 'all' && categories.length === 0) {
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);

        const params: Record<string, string | number | boolean | undefined> = {
          limit: 48,
          page: 1,
        };

        if (currentCategorySlug !== 'all') {
          const cat = categories.find((c) => c.slug === currentCategorySlug);
          if (cat) {
            params.categoryId = cat.id || cat._id;
          }
        }

        if (currentSearch) params.search = currentSearch;
        if (currentMinPrice) params.minPrice = currentMinPrice;
        if (currentMaxPrice) params.maxPrice = currentMaxPrice;
        if (currentMaterial) params.material = currentMaterial;
        if (currentProductType) params.productType = currentProductType;
        if (currentInStock) params.inStock = true;

        // Sorting mappings
        if (currentSort === 'newest') {
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
        } else if (currentSort === 'price-asc') {
          params.sortBy = 'basePrice';
          params.sortOrder = 'asc';
        } else if (currentSort === 'price-desc') {
          params.sortBy = 'basePrice';
          params.sortOrder = 'desc';
        } else if (currentSort === 'rating') {
          params.sortBy = 'ratingsAvg';
          params.sortOrder = 'desc';
        } else {
          params.sortBy = 'featured';
        }

        const response = await CatalogService.listProducts(params);
        setProducts(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    currentCategorySlug,
    currentSearch,
    currentSort,
    currentMinPrice,
    currentMaxPrice,
    currentMaterial,
    currentProductType,
    currentInStock,
    categories,
  ]);

  const handleCategorySelect = (slug: string) => {
    updateUrl({ category: slug === 'all' ? null : slug });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateUrl({ sort: val === 'featured' ? null : val });
  };

  const handlePriceToggle = (min?: number, max?: number) => {
    const isCurrentlySelected =
      (currentMinPrice === String(min) || (!currentMinPrice && !min)) &&
      (currentMaxPrice === String(max) || (!currentMaxPrice && !max));

    if (isCurrentlySelected) {
      updateUrl({ minPrice: null, maxPrice: null });
    } else {
      updateUrl({
        minPrice: min !== undefined ? String(min) : null,
        maxPrice: max !== undefined ? String(max) : null,
      });
    }
  };

  const handleMaterialToggle = (mat: string) => {
    if (currentMaterial.toLowerCase() === mat.toLowerCase()) {
      updateUrl({ material: null });
    } else {
      updateUrl({ material: mat });
    }
  };

  const handleProductTypeToggle = (typeVal: string) => {
    if (currentProductType === typeVal) {
      updateUrl({ productType: null });
    } else {
      updateUrl({ productType: typeVal });
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    router.push(pathname, { scroll: false });
  };

  // Scroll categories left/right
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  // Calculate active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentCategorySlug !== 'all') count++;
    if (currentSearch) count++;
    if (currentMinPrice || currentMaxPrice) count++;
    if (currentMaterial) count++;
    if (currentProductType) count++;
    if (currentInStock) count++;
    return count;
  }, [currentCategorySlug, currentSearch, currentMinPrice, currentMaxPrice, currentMaterial, currentProductType, currentInStock]);

  const openQuickView = (productId: string) => {
    const p = products.find((item) => (item.id || item._id) === productId);
    if (p) setQuickViewProduct(p);
  };

  return (
    <div>
      {/* Sleek, Luxury Architectural Header & Breadcrumb */}
      <div className="bg-white border-b border-[#EAE7E1] px-4 sm:px-6 lg:px-8 py-5 sm:py-7 mb-3 shadow-2xs">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-400 mb-2 tracking-wider uppercase font-medium">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-black transition-colors">Furniture</Link>
              {currentCategory && (
                <>
                  <span>/</span>
                  <span className="text-stone-800 font-semibold">{currentCategory.name}</span>
                </>
              )}
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8C7355]/10 text-[#8C7355] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border border-[#8C7355]/20">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>{currentCategory ? `${currentCategory.name} Suites` : 'Est. 1998 · Master Woodcraft'}</span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                • {total > 0 ? `${total} Masterpiece${total === 1 ? '' : 's'}` : 'Curated Atelier Pieces'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#171717] tracking-tight mb-2">
              {currentCategory ? currentCategory.name : 'Bespoke Furniture Collection'}
            </h1>

            <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed max-w-2xl">
              {currentCategory?.description ||
                'Handcrafted luxury sculpted from solid Burma teak, European white oak, and Indian rosewood. Direct value from our 40,000 sq.ft Bengaluru manufacturing atelier.'}
            </p>
          </div>

          {/* Right Trust Badges & Bespoke Sizing CTA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE7E1] text-stone-700">
              <ShieldCheck className="w-4 h-4 text-[#8C7355] shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-semibold text-stone-900 block leading-tight">10-Yr Warranty</span>
                <span className="text-[10px] text-stone-500">Century 710 Marine</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE7E1] text-stone-700">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="text-[11px] font-semibold text-stone-900 block leading-tight">White-Glove Setup</span>
                <span className="text-[10px] text-stone-500">Free In Bengaluru</span>
              </div>
            </div>

            <a
              href={`https://wa.me/919663628302?text=${encodeURIComponent(
                `Hello National Furniture & Interiors Concierge, I am viewing your ${
                  currentCategory ? currentCategory.name : 'furniture collection'
                } and would like assistance with custom room dimensions.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Custom Dimensions</span>
            </a>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2">
      {/* Category Pills Strip with Navigation Chevrons & ZERO Scrollbar */}
      <div className="mb-3">
        <div className="relative flex items-center group/nav">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-xs hover:bg-black hover:text-white transition-all shrink-0 mr-1.5 z-10"
            aria-label="Scroll categories left"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Categories Scrollable Container with No Scrollbar */}
          <div
            ref={categoryScrollRef}
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth w-full"
          >
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-medium transition-all shrink-0 ${
                currentCategorySlug === 'all'
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-[#E5E0D8] hover:border-black hover:text-black'
              }`}
            >
              All Pieces
            </button>
            {(primaryCategories.length > 0 ? primaryCategories : categories).map((cat) => (
              <button
                key={cat.id || cat._id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-medium transition-all shrink-0 ${
                  currentCategorySlug === cat.slug
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-[#E5E0D8] hover:border-black hover:text-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-xs hover:bg-black hover:text-white transition-all shrink-0 ml-1.5 z-10"
            aria-label="Scroll categories right"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Subcategories (if active category has children) */}
        {activeSubcategories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pt-1.5 pb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-[#8C7355] font-semibold mr-1">Subcategories:</span>
            {activeSubcategories.map((sub) => (
              <button
                key={sub.id || sub._id}
                onClick={() => handleCategorySelect(sub.slug)}
                className="px-2.5 py-0.5 text-xs text-gray-600 hover:text-black hover:underline transition-colors shrink-0"
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modern Executive Toolbar: Quick Dropdown Filters + View Mode + Sort */}
      <div className="bg-white rounded-lg border border-[#EAE7E1] px-3 py-2 mb-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Left Action Cluster: Filters Toggle + Quick Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
                showFilters
                  ? 'bg-[#171717] text-white'
                  : 'bg-[#F9F8F6] text-gray-800 border border-gray-300 hover:border-black'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? 'Hide Sidebar' : 'Sidebar'}</span>
            </button>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider bg-[#171717] text-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Price Dropdown Popover */}
            <div className="relative filter-popover-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                  currentMinPrice || currentMaxPrice
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F9F8F6] text-gray-700 border border-gray-200 hover:border-black'
                }`}
              >
                <span>Price</span>
                {(currentMinPrice || currentMaxPrice) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]" />
                )}
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeDropdown === 'price' && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-56 p-3 bg-white rounded-lg border border-gray-200 shadow-xl">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Price Range</span>
                    {(currentMinPrice || currentMaxPrice) && (
                      <button
                        onClick={() => updateUrl({ minPrice: null, maxPrice: null })}
                        className="text-[10px] text-gray-400 hover:text-black uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {PRICE_RANGES.map((range) => {
                      const isChecked =
                        (currentMinPrice === String(range.min) || (!currentMinPrice && !range.min)) &&
                        (currentMaxPrice === String(range.max) || (!currentMaxPrice && !range.max));

                      return (
                        <li key={range.label}>
                          <button
                            type="button"
                            onClick={() => handlePriceToggle(range.min, range.max)}
                            className="flex items-center justify-between w-full text-left py-1 text-xs text-gray-700 hover:text-black"
                          >
                            <span>{range.label}</span>
                            {isChecked && <span className="text-[#171717] font-bold">✓</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Material Dropdown Popover */}
            <div className="relative filter-popover-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'material' ? null : 'material')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                  currentMaterial
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F9F8F6] text-gray-700 border border-gray-200 hover:border-black'
                }`}
              >
                <span>Material</span>
                {currentMaterial && <span className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]" />}
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeDropdown === 'material' && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-52 p-3 bg-white rounded-lg border border-gray-200 shadow-xl max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Materials</span>
                    {currentMaterial && (
                      <button
                        onClick={() => updateUrl({ material: null })}
                        className="text-[10px] text-gray-400 hover:text-black uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {MATERIALS.map((mat) => {
                      const isChecked = currentMaterial.toLowerCase() === mat.toLowerCase();
                      return (
                        <li key={mat}>
                          <button
                            type="button"
                            onClick={() => handleMaterialToggle(mat)}
                            className="flex items-center justify-between w-full text-left py-1 text-xs text-gray-700 hover:text-black"
                          >
                            <span>{mat}</span>
                            {isChecked && <span className="text-[#171717] font-bold">✓</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Craftsmanship Dropdown Popover */}
            <div className="relative filter-popover-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                  currentProductType
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F9F8F6] text-gray-700 border border-gray-200 hover:border-black'
                }`}
              >
                <span>Craftsmanship</span>
                {currentProductType && <span className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]" />}
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeDropdown === 'type' && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-48 p-3 bg-white rounded-lg border border-gray-200 shadow-xl">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Type</span>
                    {currentProductType && (
                      <button
                        onClick={() => updateUrl({ productType: null })}
                        className="text-[10px] text-gray-400 hover:text-black uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {PRODUCT_TYPES.map((t) => {
                      const isChecked = currentProductType === t.value;
                      return (
                        <li key={t.value}>
                          <button
                            type="button"
                            onClick={() => handleProductTypeToggle(t.value)}
                            className="flex items-center justify-between w-full text-left py-1 text-xs text-gray-700 hover:text-black"
                          >
                            <span>{t.label}</span>
                            {isChecked && <span className="text-[#171717] font-bold">✓</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* In Stock Toggle Pill */}
            <button
              type="button"
              onClick={() => updateUrl({ inStock: currentInStock ? null : 'true' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                currentInStock
                  ? 'bg-[#171717] text-white'
                  : 'bg-[#F9F8F6] text-gray-700 border border-gray-200 hover:border-black'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentInStock ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              <span>In Stock</span>
            </button>

            {/* Inline Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search pieces..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-36 sm:w-44 lg:w-48 bg-[#FAF9F6] border border-gray-200 rounded-md py-1 pl-2.5 pr-6 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-black text-xs"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : (
                <svg className="absolute right-2 top-2 h-3 w-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Right Action Cluster: Piece Count + View Mode Switcher + Sort */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              <strong className="text-gray-900">{total}</strong> pieces
            </span>

            {/* View Mode Switcher: 3-col | 4-col | 5-col | List */}
            <div className="hidden sm:flex items-center border border-gray-200 rounded-md p-0.5 bg-[#FAF9F6]">
              <button
                type="button"
                onClick={() => setViewMode('grid3')}
                title="3 Columns (Spacious)"
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid3' ? 'bg-white text-black shadow-2xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                }`}
                aria-label="3 columns"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="5" height="18" rx="1" />
                  <rect x="9.5" y="3" width="5" height="18" rx="1" />
                  <rect x="16" y="3" width="5" height="18" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid4')}
                title="4 Columns (Balanced)"
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid4' ? 'bg-white text-black shadow-2xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                }`}
                aria-label="4 columns"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="3" width="4" height="18" rx="1" />
                  <rect x="7.33" y="3" width="4" height="18" rx="1" />
                  <rect x="12.66" y="3" width="4" height="18" rx="1" />
                  <rect x="18" y="3" width="4" height="18" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid5')}
                title="5 Columns (Expansive)"
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid5' ? 'bg-white text-black shadow-2xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                }`}
                aria-label="5 columns"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="3" width="3" height="18" rx="0.5" />
                  <rect x="6.25" y="3" width="3" height="18" rx="0.5" />
                  <rect x="10.5" y="3" width="3" height="18" rx="0.5" />
                  <rect x="14.75" y="3" width="3" height="18" rx="0.5" />
                  <rect x="19" y="3" width="3" height="18" rx="0.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Editorial List View"
                className={`p-1 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black shadow-2xs font-semibold' : 'text-gray-400 hover:text-gray-700'
                }`}
                aria-label="List view"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="16" width="18" height="4" rx="1" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest hidden md:inline">Sort</span>
              <select
                value={currentSort}
                onChange={handleSortChange}
                className="text-xs border border-gray-200 rounded-md py-1 pl-2 pr-6 focus:ring-1 focus:ring-black bg-white text-gray-900 font-medium cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="newest">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Strip */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 bg-[#FAF9F6] border border-[#EBE8E3] rounded-md text-xs">
          <span className="text-[11px] text-gray-500 font-medium mr-1">Active:</span>
          {currentCategorySlug !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              Category: {categories.find((c) => c.slug === currentCategorySlug)?.name || currentCategorySlug}
              <button onClick={() => handleCategorySelect('all')} className="hover:text-red-500 ml-0.5" aria-label="Remove category filter">✕</button>
            </span>
          )}
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              &quot;{currentSearch}&quot;
              <button onClick={() => setSearchInput('')} className="hover:text-red-500 ml-0.5" aria-label="Remove search filter">✕</button>
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              Price: ₹{(Number(currentMinPrice || 0) / 100).toLocaleString('en-IN')} –{' '}
              {currentMaxPrice ? `₹${(Number(currentMaxPrice) / 100).toLocaleString('en-IN')}` : 'Above'}
              <button onClick={() => updateUrl({ minPrice: null, maxPrice: null })} className="hover:text-red-500 ml-0.5" aria-label="Remove price filter">✕</button>
            </span>
          )}
          {currentMaterial && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              Material: {currentMaterial}
              <button onClick={() => updateUrl({ material: null })} className="hover:text-red-500 ml-0.5" aria-label="Remove material filter">✕</button>
            </span>
          )}
          {currentProductType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              {currentProductType === 'READY_TO_SHIP' ? 'Ready to Ship' : 'Made to Order'}
              <button onClick={() => updateUrl({ productType: null })} className="hover:text-red-500 ml-0.5" aria-label="Remove craftsmanship filter">✕</button>
            </span>
          )}
          {currentInStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-800">
              In Stock Only
              <button onClick={() => updateUrl({ inStock: null })} className="hover:text-red-500 ml-0.5" aria-label="Remove in-stock filter">✕</button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[11px] text-[#8C7355] hover:text-black underline font-medium ml-auto"
          >
            Clear all ({activeFiltersCount})
          </button>
        </div>
      )}

      {/* Main Showcase Layout: Optional Compact Sidebar + Full-Width Product Grid */}
      <div className="flex gap-4 xl:gap-5 items-start">
        {/* Desktop Sidebar (Only rendered when showFilters is TRUE) */}
        {showFilters && (
          <aside className="hidden lg:block w-48 xl:w-52 shrink-0 bg-white rounded-lg border border-[#EAE7E1] p-3.5 shadow-2xs space-y-5">
            {/* Price Ranges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C7355]">Price Range</h3>
                {(currentMinPrice || currentMaxPrice) && (
                  <button
                    onClick={() => updateUrl({ minPrice: null, maxPrice: null })}
                    className="text-[9px] text-gray-400 hover:text-black uppercase"
                  >
                    Reset
                  </button>
                )}
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                {PRICE_RANGES.map((range) => {
                  const isChecked =
                    (currentMinPrice === String(range.min) || (!currentMinPrice && !range.min)) &&
                    (currentMaxPrice === String(range.max) || (!currentMaxPrice && !range.max));

                  return (
                    <li key={range.label}>
                      <button
                        type="button"
                        onClick={() => handlePriceToggle(range.min, range.max)}
                        className={`flex items-center gap-1.5 w-full text-left py-0.5 text-[11px] transition-colors ${
                          isChecked ? 'font-medium text-[#171717]' : 'hover:text-black'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#171717] border-[#171717] text-white' : 'border-gray-300'
                          }`}
                        >
                          {isChecked && <span className="text-[8px]">✓</span>}
                        </span>
                        <span className="truncate">{range.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Materials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C7355]">Material</h3>
                {currentMaterial && (
                  <button onClick={() => updateUrl({ material: null })} className="text-[9px] text-gray-400 hover:text-black uppercase">
                    Reset
                  </button>
                )}
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                {MATERIALS.map((mat) => {
                  const isChecked = currentMaterial.toLowerCase() === mat.toLowerCase();
                  return (
                    <li key={mat}>
                      <button
                        type="button"
                        onClick={() => handleMaterialToggle(mat)}
                        className={`flex items-center gap-1.5 w-full text-left py-0.5 text-[11px] transition-colors ${
                          isChecked ? 'font-medium text-[#171717]' : 'hover:text-black'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#171717] border-[#171717] text-white' : 'border-gray-300'
                          }`}
                        >
                          {isChecked && <span className="text-[8px]">✓</span>}
                        </span>
                        <span className="truncate">{mat}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Craftsmanship */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C7355]">Craftsmanship</h3>
                {currentProductType && (
                  <button onClick={() => updateUrl({ productType: null })} className="text-[9px] text-gray-400 hover:text-black uppercase">
                    Reset
                  </button>
                )}
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                {PRODUCT_TYPES.map((t) => {
                  const isChecked = currentProductType === t.value;
                  return (
                    <li key={t.value}>
                      <button
                        type="button"
                        onClick={() => handleProductTypeToggle(t.value)}
                        className={`flex items-center gap-1.5 w-full text-left py-0.5 text-[11px] transition-colors ${
                          isChecked ? 'font-medium text-[#171717]' : 'hover:text-black'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#171717] border-[#171717] text-white' : 'border-gray-300'
                          }`}
                        >
                          {isChecked && <span className="text-[8px]">✓</span>}
                        </span>
                        <span>{t.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Reset CTA */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full py-1.5 text-[11px] uppercase tracking-wider text-gray-600 border border-gray-300 hover:border-black hover:text-black rounded transition-colors"
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </aside>
        )}

        {/* Main Product Grid Canvas (Expands to 100% of container when sidebar is hidden) */}
        <main className="flex-1 w-full min-w-0">
          {loading ? (
            <div
              className={
                viewMode === 'list'
                  ? 'space-y-3'
                  : !showFilters
                  ? viewMode === 'grid5'
                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                    : viewMode === 'grid3'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : viewMode === 'grid5'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                  : viewMode === 'grid3'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 px-6 rounded-lg bg-white border border-gray-200 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-gray-200 flex items-center justify-center mb-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-serif text-[#171717] font-normal mb-1">No Matching Pieces Found</h3>
              <p className="text-xs text-gray-500 max-w-md mb-5 leading-relaxed">
                We couldn&apos;t find any furniture matching your exact search and filter criteria. Try clearing your filters or explore our signature collections.
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center">
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 text-xs font-medium uppercase tracking-wider bg-[#171717] hover:bg-black text-white rounded transition-colors"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={() => handleCategorySelect('all')}
                  className="px-5 py-2 text-xs font-medium uppercase tracking-wider bg-white border border-gray-300 hover:border-black text-gray-800 rounded transition-colors"
                >
                  Explore All Furniture
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === 'list'
                  ? 'space-y-3'
                  : !showFilters
                  ? viewMode === 'grid5'
                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                    : viewMode === 'grid3'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : viewMode === 'grid5'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                  : viewMode === 'grid3'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5'
              }
            >
              {products.map((product, index) => (
                <ProductCard
                  key={product.id || product._id}
                  id={product.id || (product._id as string)}
                  name={product.name}
                  slug={product.slug}
                  price={product.basePrice?.amount}
                  mrp={product.mrp?.amount}
                  currency={product.basePrice?.currency || 'INR'}
                  images={product.images?.map((img) => (typeof img === 'string' ? img : img.url)) || []}
                  category={categories.find((c) => (c.id || c._id) === product.categoryId)?.name || 'Furniture'}
                  material={product.material}
                  ratingsAvg={product.ratingsAvg}
                  ratingsCount={product.ratingsCount}
                  isFeatured={product.isFeatured}
                  isBestSeller={product.isBestSeller}
                  productType={product.productType}
                  finishes={product.finishes}
                  viewMode={viewMode}
                  hasVideo={Boolean(product.videos && product.videos.length > 0)}
                  priority={index < 4}
                  onQuickView={openQuickView}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                <h2 className="text-sm font-serif font-normal text-gray-900">Filter Furniture</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-gray-500 hover:text-black rounded"
                  aria-label="Close filters drawer"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border-b border-gray-300 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none bg-transparent"
                />
              </div>

              {/* In Stock Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-700">In Stock Only</span>
                <button
                  type="button"
                  onClick={() => updateUrl({ inStock: currentInStock ? null : 'true' })}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    currentInStock ? 'bg-[#171717]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      currentInStock ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Price Ranges */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8C7355] mb-2">Price Range</h3>
                <ul className="space-y-1.5 text-xs">
                  {PRICE_RANGES.map((range) => {
                    const isChecked =
                      (currentMinPrice === String(range.min) || (!currentMinPrice && !range.min)) &&
                      (currentMaxPrice === String(range.max) || (!currentMaxPrice && !range.max));

                    return (
                      <li key={range.label}>
                        <button
                          type="button"
                          onClick={() => handlePriceToggle(range.min, range.max)}
                          className={`flex items-center gap-2 w-full text-left py-0.5 ${
                            isChecked ? 'font-medium text-[#171717]' : 'text-gray-600'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                              isChecked ? 'bg-[#171717] border-[#171717] text-white' : 'border-gray-300'
                            }`}
                          >
                            {isChecked && <span className="text-[8px]">✓</span>}
                          </span>
                          <span>{range.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Material */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8C7355] mb-2">Material</h3>
                <ul className="space-y-1.5 text-xs">
                  {MATERIALS.map((mat) => {
                    const isChecked = currentMaterial.toLowerCase() === mat.toLowerCase();
                    return (
                      <li key={mat}>
                        <button
                          type="button"
                          onClick={() => handleMaterialToggle(mat)}
                          className={`flex items-center gap-2 w-full text-left py-0.5 ${
                            isChecked ? 'font-medium text-[#171717]' : 'text-gray-600'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                              isChecked ? 'bg-[#171717] border-[#171717] text-white' : 'border-gray-300'
                            }`}
                          >
                            {isChecked && <span className="text-[8px]">✓</span>}
                          </span>
                          <span>{mat}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Mobile Drawer Bottom Actions */}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 text-xs uppercase tracking-wider font-medium text-white bg-[#171717] rounded shadow"
              >
                Apply Filters ({total} pieces)
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-2 text-xs uppercase tracking-wider font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Suspense fallback={<div className="py-12 text-center text-xs text-stone-500">Loading catalog...</div>}>
        <CatalogContent />
      </Suspense>
    </div>
  );
}
