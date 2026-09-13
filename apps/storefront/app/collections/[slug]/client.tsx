'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, ProductCollection, Product, ApiResponse } from '@nfi/api-client';
import { ProductCard } from '../../../components/product-card';
import { CURATED_COLLECTIONS_DATA, type CollectionEnrichment } from '../../../data/curated-collections';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
  Home,
  CheckCircle2,
  Layers,
  MapPin,
  Package,
} from 'lucide-react';

interface CollectionClientPageProps {
  slug: string;
}

export default function CollectionClientPage({ slug }: CollectionClientPageProps) {
  const [collection, setCollection] = useState<ProductCollection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const initialEnrichment = useMemo(() => {
    return (
      CURATED_COLLECTIONS_DATA[slug] || {
        slug,
        title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        roomType: 'living' as const,
        roomLabel: 'Living & Lounge',
        style: 'Modern Minimalist',
        curatedBadge: 'Architect Curated',
        startingPrice: 85000,
        emiMonthly: 3999,
        pieceCount: 6,
        materials: ['Solid Teak Wood', 'Century Marine Ply', 'Belgian Linen'],
        bundleDiscountPercent: 12,
        popularInSocieties: ['Prestige Lakeside Habitat', 'Kingfisher Towers'],
        heroImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400&auto=format&fit=crop',
        designerQuote: 'Curated architectural proportions and premium finishes built for modern Bengaluru living.',
      }
    );
  }, [slug]);
  const [enrichment, setEnrichment] = useState<CollectionEnrichment>(initialEnrichment);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const enr = CURATED_COLLECTIONS_DATA[slug] || initialEnrichment;
      setEnrichment(enr);

      let fetchedColl: ProductCollection | null = null;
      try {
        const collResponse = await CatalogService.getCollection(slug);
        fetchedColl = collResponse.data || null;
      } catch (e) {
        console.warn('Collection fetch failed from API, using curated local data:', e);
      }

      setCollection(fetchedColl);

      // Product fetching strategy
      let validProducts: Product[] = [];
      if (fetchedColl && fetchedColl.productIds && fetchedColl.productIds.length > 0) {
        const fetchedResults = await Promise.allSettled(
          fetchedColl.productIds.slice(0, 24).map((id) => CatalogService.getProduct(id))
        );
        validProducts = fetchedResults
          .filter((res): res is PromiseFulfilledResult<ApiResponse<{ product: Product }>> => res.status === 'fulfilled')
          .map((res) => res.value.data?.product)
          .filter((p): p is Product => Boolean(p));
      }

      // If collection has fewer than 4 products, enrich with general catalog items
      if (validProducts.length < 4) {
        try {
          const catProductsRes = await CatalogService.listProducts({ limit: 12 });
          const extraProducts = catProductsRes.data?.items || [];
          // Combine and deduplicate
          const existingIds = new Set(validProducts.map((p) => p.id || p._id));
          for (const p of extraProducts) {
            const pId = p.id || p._id;
            if (!existingIds.has(pId)) {
              validProducts.push(p);
              existingIds.add(pId);
            }
            if (validProducts.length >= 8) break;
          }
        } catch (catErr) {
          console.error('Failed to fetch fallback catalog products:', catErr);
        }
      }

      setProducts(validProducts);
    } catch (err) {
      console.error('Failed to load collection data', err);
    } finally {
      setLoading(false);
    }
  }, [slug, initialEnrichment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTitle = collection?.title || enrichment?.title || 'Curated Suite';
  const heroImageUrl =
    collection?.heroImage?.url ||
    enrichment?.heroImage ||
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop';
  const activeDescription =
    collection?.description ||
    collection?.shortDescription ||
    enrichment?.designerQuote ||
    'Handcrafted solid teak, imported Italian veneers, and tailored upholstery curated for distinctive Bengaluru homes.';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 selection:bg-[#8C7355] selection:text-white">
      {/* ── 1. BREADCRUMBS ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 md:px-8 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <Link href="/collections" className="hover:text-neutral-900">
              Curated Collections
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-900 font-medium truncate">{activeTitle}</span>
          </nav>
        </div>
      </div>

      {/* ── 2. HERO SHOWCASE SECTION ───────────────────────────────────── */}
      <section className="relative h-[55vh] md:h-[65vh] bg-neutral-950 flex items-center justify-center overflow-hidden">
        {collection?.heroVideo ? (
          <video
            src={collection.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : (
          <Image
            src={heroImageUrl}
            alt={activeTitle}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            {enrichment?.curatedBadge || 'Architectural Suite'} · {enrichment?.roomLabel || 'Curated'}
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-4 text-white">
            {activeTitle}
          </h1>

          <p className="text-neutral-300 text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed mb-8">
            {activeDescription}
          </p>

          {/* Key Specs Pill Bar */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-black/40 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-xs text-neutral-200">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> 45-Day Handover
            </span>
            <span className="text-neutral-500">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> 10-Yr BWP Warranty
            </span>
            <span className="text-neutral-500">•</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> {enrichment?.style || 'Solid Teak'}
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. BUNDLE SAVINGS & VALUE PROPOSITION STRIP ─────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-6">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-[#8C7355] text-white flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Save {enrichment?.bundleDiscountPercent || 12}% with Whole-Suite Bundling
                </p>
                <p className="text-xs text-neutral-600">
                  Purchase 3 or more pieces from this collection and receive complimentary white-glove Bengaluru installation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase">Room Suite From</p>
                <p className="font-serif text-base font-bold text-neutral-900">
                  ₹{(enrichment?.startingPrice || 85000).toLocaleString('en-IN')}
                </p>
              </div>
              <Link
                href="/design-services#lead-form"
                className="px-4 py-2 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Request Custom Dimensions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ARCHITECTURAL DESIGN PHILOSOPHY & MATERIAL SPECS ─────────── */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
              Design Architecture
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-neutral-900">
              Craftsmanship & Material Integrity
            </h2>
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
              {enrichment?.designerQuote} Built to withstand Bengaluru’s seasonal climate shifts, every piece undergoes 12-stage moisture regulation and joinery reinforcement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-1">
                  Wood Foundation
                </h3>
                <p className="text-xs text-neutral-600">
                  Kiln-seasoned Burma Teak & Century 710 Club Prime BWP Marine Plywood.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-1">
                  Upholstery & Fabrics
                </h3>
                <p className="text-xs text-neutral-600">
                  Stain-resistant Belgian bouclé & 40,000+ Martindale rub count linens.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-1">
                  Hardware & Joinery
                </h3>
                <p className="text-xs text-neutral-600">
                  Blum soft-close concealed runners with precision mortise-and-tenon joints.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Bengaluru Home Advantages
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-neutral-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-1.5 shrink-0"></span>
                <span>
                  <strong>Doorstep Swatch Delivery:</strong> Receive physical wood and fabric swatches at your Bengaluru home within 48 hours.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-1.5 shrink-0"></span>
                <span>
                  <strong>Floor Plan Dimension Matching:</strong> Scale any sofa or dining table length to suit your apartment layout.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-1.5 shrink-0"></span>
                <span>
                  <strong>White-Glove Delivery:</strong> Dedicated factory logistics team unboxes, levels, and cleans up packaging at your residence.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-1.5 shrink-0"></span>
                <span>
                  <strong>10-Year BWP Marine Warranty:</strong> Guaranteed replacement protection against termite and moisture damage.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. CURATED PRODUCTS IN THIS COLLECTION ──────────────────────── */}
      <section className="container mx-auto px-4 md:px-8 py-12 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
              Available Furniture Pieces
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-neutral-900 mt-1">
              Shop The {activeTitle} Suite
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Showing {products.length} coordinated pieces ready for Bengaluru delivery
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs text-[#8C7355] font-semibold hover:underline flex items-center gap-1"
          >
            <span>View All Furniture Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="aspect-[4/3] bg-neutral-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-neutral-200 rounded w-1/3" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-neutral-300 rounded-2xl p-8 max-w-md mx-auto">
            <Package className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <p className="text-neutral-600 text-sm font-medium">
              Products for this collection are being updated from our Bengaluru catalog.
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 px-5 py-2 bg-[#171717] text-white text-xs font-semibold rounded-lg hover:bg-[#8C7355] transition-colors"
            >
              Browse Full Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id || product._id || idx}
                id={product.id || (product._id as string)}
                name={product.name}
                price={product.basePrice?.amount || 2500000}
                mrp={product.mrp?.amount || null}
                currency={product.basePrice?.currency || 'INR'}
                slug={product.slug}
                images={
                  product.images && product.images.length > 0
                    ? product.images.map((img) => img.url)
                    : [
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
                      ]
                }
                category={enrichment?.roomLabel || 'Collection Suite'}
                material={product.material || product.primaryMaterial || enrichment?.materials?.[0] || 'Solid Teak'}
                finishes={product.finishes || []}
                productType={product.productType || 'MADE_TO_ORDER'}
                viewMode="grid4"
                priority={idx < 4}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 6. EXPERIENCE STUDIOS STRIP ─────────────────────────────────── */}
      <section className="bg-white border-y border-neutral-200 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
              Visit Our Bengaluru Studios
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-neutral-900 mt-2">
              Experience The Collection In Person
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Touch the wood finishes, test sofa cushion densities, and review fabric swatches with our architects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200 text-center">
              <MapPin className="w-5 h-5 text-[#8C7355] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-900">Indiranagar Flagship</h3>
              <p className="text-xs text-neutral-500 mt-1">100ft Road, Near 12th Main</p>
              <p className="text-xs text-emerald-700 font-medium mt-2">Open Daily 10 AM – 8:30 PM</p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200 text-center">
              <MapPin className="w-5 h-5 text-[#8C7355] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-900">Whitefield Design Studio</h3>
              <p className="text-xs text-neutral-500 mt-1">ITPB Main Road, Opp. Forum</p>
              <p className="text-xs text-emerald-700 font-medium mt-2">Open Daily 10 AM – 8:30 PM</p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200 text-center">
              <MapPin className="w-5 h-5 text-[#8C7355] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-900">HSR Layout Studio</h3>
              <p className="text-xs text-neutral-500 mt-1">Sector 2, 27th Main Road</p>
              <p className="text-xs text-emerald-700 font-medium mt-2">Open Daily 10 AM – 8:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. BESPOKE SIZING CONSULTATION CTA ──────────────────────────── */}
      <section className="bg-[#171717] text-white py-16">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
            Bespoke Architectural Customization
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mt-2 mb-4">
            Need Custom Dimensions for Your Floor Plan?
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8">
            Every piece in the {activeTitle} collection can be tailored in length, depth, and finish to fit your apartment or villa floor plan perfectly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/design-services#lead-form"
              className="px-6 py-3 bg-[#8C7355] hover:bg-[#705c43] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Schedule Free In-Home Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/collections"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-xl border border-white/20 transition-all"
            >
              Explore Other Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
