import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogService, Product } from '@nfi/api-client';
import { ChevronRight } from 'lucide-react';
import { ProductMediaGallery } from '../../../components/product-media-gallery';
import { ProductPurchaseSection } from '../../../components/product-purchase-section';
import { ProductSpecificationsTabs } from '../../../components/product-specifications-tabs';
import { ProductReviews } from '../../../components/product-reviews';
import { RelatedProductsCarousel } from '../../../components/related-products-carousel';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const res = await CatalogService.getProduct(slug);
    const rawData = res.data as unknown as { product?: Product } & Product;
    const product: Product | null = rawData?.product ?? (rawData?.name ? (rawData as Product) : null);
    if (product) {
      return {
        title: `${product.name} | National Furniture & Interiors`,
        description: product.shortDescription || product.description?.slice(0, 160),
        openGraph: {
          title: product.name,
          description: product.shortDescription || product.description?.slice(0, 160),
          images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
        },
      };
    }
  } catch {
    // Fall through
  }
  return {
    title: 'Product Details | National Furniture & Interiors',
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null = null;
  try {
    const res = await CatalogService.getProduct(slug);
    const rawData = res.data as unknown as { product?: Product } & Product;
    product = rawData?.product ?? (rawData?.name ? (rawData as Product) : null);
  } catch (err) {
    console.error('Failed to fetch product for slug:', slug, err);
  }

  if (!product) {
    notFound();
  }

  // Fetch category name
  let categoryName = 'Furniture';
  try {
    const catId =
      typeof product.categoryId === 'string'
        ? product.categoryId
        : (product.categoryId as unknown as { _id?: string })?._id;
    if (catId) {
      const catRes = await CatalogService.getCategory(catId);
      const catData = catRes.data as unknown as { category?: { name?: string }; name?: string } | undefined;
      const resolvedName = catData?.category?.name || catData?.name;
      if (resolvedName) categoryName = resolvedName;
    }
  } catch {
    // Optional category lookup
  }

  // Fetch related products from the same category
  let relatedProducts: Product[] = [];
  try {
    const relatedRes = await CatalogService.listProducts({
      categoryId: product.categoryId,
      limit: 8,
    });
    const items = relatedRes.data?.items || [];
    const currentId = product.id || product._id;
    relatedProducts = items.filter((p) => (p.id || p._id) !== currentId);

    // Fallback if category has no other pieces
    if (relatedProducts.length === 0) {
      const fallbackRes = await CatalogService.listProducts({ limit: 5 });
      relatedProducts = (fallbackRes.data?.items || []).filter((p) => (p.id || p._id) !== currentId);
    }
  } catch {
    // Optional related products lookup
  }

  const basePriceAmt = (product.basePrice?.amount || 0) / 100;
  const mrpAmt = product.mrp ? product.mrp.amount / 100 : null;
  const savingsAmt = mrpAmt && mrpAmt > basePriceAmt ? mrpAmt - basePriceAmt : 0;
  const discountPercentage = mrpAmt && mrpAmt > basePriceAmt ? Math.round((savingsAmt / mrpAmt) * 100) : 0;
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const primaryThumbnail =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img) => img.url),
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'National Furniture & Interiors',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: product.basePrice?.currency || 'INR',
      price: basePriceAmt,
      availability:
        product.status === 'PUBLISHED'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    ...(product.ratingsAvg
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingsAvg,
            reviewCount: product.ratingsCount || 1,
          },
        }
      : {}),
  };

  return (
    <div className="bg-white min-h-screen pt-6 pb-24 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Schema.org Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Luxury Breadcrumb Navigation */}
        <nav
          className="flex items-center text-xs text-neutral-400 mb-8 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-none"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-3 h-3 text-neutral-300 mx-1" />
              <Link href="/products" className="hover:text-neutral-900 transition-colors">
                Furniture
              </Link>
            </li>
            {categoryName && (
              <li className="flex items-center">
                <ChevronRight className="w-3 h-3 text-neutral-300 mx-1" />
                <Link
                  href={`/products?category=${typeof product.categoryId === 'string' ? product.categoryId : ''}`}
                  className="hover:text-neutral-900 transition-colors"
                >
                  {categoryName}
                </Link>
              </li>
            )}
            <li aria-current="page" className="flex items-center">
              <ChevronRight className="w-3 h-3 text-neutral-300 mx-1" />
              <span className="text-neutral-900 font-semibold truncate max-w-[240px]">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Hero Section: Media Gallery (Left) & Purchase Matrix (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-18 items-start">
          {/* Left Column: Interactive Photos & HD Videos Gallery */}
          <div className="lg:col-span-7">
            <ProductMediaGallery
              images={product.images as { url: string; altText?: string | undefined }[]}
              videos={product.videos}
              productName={product.name}
              discountPercentage={discountPercentage}
              isBestseller={product.isBestSeller}
            />
          </div>

          {/* Right Column: Pricing, Specs, Swatches & Action CTAs */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ProductPurchaseSection
              productId={product.id || product._id || ''}
              name={product.name}
              sku={product.sku}
              brand={product.brand}
              basePriceAmt={basePriceAmt}
              mrpAmt={mrpAmt}
              currency={product.basePrice?.currency}
              status={product.status}
              productType={product.productType}
              ratingsAvg={product.ratingsAvg}
              ratingsCount={product.ratingsCount}
              finishes={product.finishes}
              colors={product.colors}
              firstVariantId={firstVariant?.variantId || 'DEFAULT'}
              thumbnailUrl={primaryThumbnail}
            />
          </div>
        </div>

        {/* Detailed Product Specifications, Heritage Story & Care Tabs */}
        <ProductSpecificationsTabs
          description={product.description}
          shortDescription={product.shortDescription}
          material={product.material}
          primaryMaterial={(product as unknown as { primaryMaterial?: string }).primaryMaterial}
          frameMaterial={(product as unknown as { frameMaterial?: string }).frameMaterial}
          dimensions={product.dimensions}
          weight={product.weight}
          careInstructions={product.careInstructions}
          warranty={product.warranty}
          specifications={product.specifications}
          productType={product.productType}
        />

        {/* Customer Reviews & Ratings Engine */}
        <div id="customer-reviews" className="mt-20 pt-16 border-t border-[#EBE8E3]">
          <div className="mb-6">
            <span className="text-xs font-semibold tracking-widest text-[#8C7355] uppercase block mb-1">
              Real Patron Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 font-normal tracking-tight">
              Customer Reviews & Ratings
            </h2>
          </div>
          <ProductReviews productId={product.id || product._id || ''} />
        </div>

        {/* Complementary & Related Products Showcase */}
        <RelatedProductsCarousel
          products={relatedProducts}
          categoryName={categoryName}
        />
      </div>
    </div>
  );
}
