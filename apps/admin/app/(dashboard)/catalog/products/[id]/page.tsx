'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, Product, Category } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const prodRes = await CatalogService.getProduct(id);
      const rawData = prodRes.data as unknown as { product?: Product } & Product;
      const prod = rawData?.product || rawData;
      setProduct(prod || null);

      if (prod) {
        const catId = typeof prod.categoryId === 'string' ? prod.categoryId : (prod.categoryId as unknown as { _id?: string })?._id;
        if (catId) {
          try {
            const catRes = await CatalogService.adminGetCategory(catId);
            setCategory(catRes.data?.category || null);
          } catch {
            // Category lookup optional
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--nfi-primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Loading product details…
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-medium text-red-600">{error || 'Product not found'}</p>
        <Link href="/catalog/products">
          <NfiButton variant="secondary" size="sm">
            Back to Products
          </NfiButton>
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[activeImageIdx] || images[0];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku} · Created on ${new Date(product.createdAt).toLocaleDateString('en-IN')}`}
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Products', href: '/catalog/products' },
          { label: product.name },
        ]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/products">
              <NfiButton variant="secondary" size="sm">
                ← Back
              </NfiButton>
            </Link>
            <Link href={`/catalog/products/${id}/edit`}>
              <NfiButton variant="primary" size="sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Product
              </NfiButton>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visuals & Specs Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Showcase */}
          <SectionCard title="Product Gallery">
            {images.length > 0 ? (
              <div className="space-y-3">
                <div
                  className="aspect-[16/9] w-full rounded-lg overflow-hidden border bg-gray-100 relative flex items-center justify-center"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {currentImage?.url && (
                    <Image
                      unoptimized
                      fill
                      src={currentImage.url}
                      alt={product.name}
                      className="object-contain"
                    />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-16 h-16 rounded border overflow-hidden flex-shrink-0 transition-all ${
                          i === activeImageIdx ? 'ring-2 ring-amber-800' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ borderColor: 'var(--nfi-border)' }}
                      >
                        <Image
                          unoptimized
                          width={64}
                          height={64}
                          src={img.url}
                          alt={img.altText || product.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 border rounded-lg border-dashed" style={{ borderColor: 'var(--nfi-border)' }}>
                No photos uploaded for this product.
              </div>
            )}
          </SectionCard>

          {/* Videos & Multimedia Showcase */}
          <SectionCard title={`Product Videos & Reels (${product.videos?.length || 0})`}>
            {product.videos && product.videos.length > 0 ? (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black flex items-center justify-center">
                  <video
                    src={product.videos[0]?.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  {product.videos.map((vid, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border bg-gray-50 flex items-center justify-between text-xs"
                      style={{ borderColor: 'var(--nfi-border)' }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-gray-900 truncate">{vid.title || 'Product Video'}</p>
                          <p className="text-gray-400 font-mono text-[10px] truncate max-w-md">{vid.url}</p>
                        </div>
                      </div>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-800 hover:underline font-medium text-[11px] shrink-0 ml-2"
                      >
                        Open Video ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="py-8 text-center text-xs text-gray-400 border rounded-lg border-dashed"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                No video assets configured for this product.
              </div>
            )}
          </SectionCard>

          {/* Description */}
          <SectionCard title="Description & Craftsmanship">
            {product.shortDescription && (
              <p className="text-sm font-medium mb-3 italic" style={{ color: 'var(--nfi-accent)' }}>
                &ldquo;{product.shortDescription}&rdquo;
              </p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--nfi-text)' }}>
              {product.description}
            </p>
          </SectionCard>

          {/* Variants Table */}
          <SectionCard title={`Variants (${product.variants?.length || 0})`}>
            {!product.variants || product.variants.length === 0 ? (
              <p className="text-xs text-gray-500">Standard model (no variants configured).</p>
            ) : (
              <div className="rounded-lg border overflow-hidden text-xs" style={{ borderColor: 'var(--nfi-border)' }}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b" style={{ borderColor: 'var(--nfi-border)' }}>
                    <tr>
                      <th className="px-4 py-2.5 font-medium text-gray-600">Variant Attributes</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600">SKU</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600">Price</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
                    {product.variants.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {v.attributes?.map((attr, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-1.5 py-0.5 rounded bg-white border font-medium text-gray-700"
                                style={{ borderColor: 'var(--nfi-border)' }}
                              >
                                {attr.name}: <strong>{attr.value}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{v.sku}</td>
                        <td className="px-4 py-2.5 font-medium">
                          {v.priceOverride
                            ? `₹${(v.priceOverride.amount / 100).toLocaleString('en-IN')}`
                            : `Base (₹${(product.basePrice.amount / 100).toLocaleString('en-IN')})`}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              v.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Physical Specifications */}
          <SectionCard title="Technical & Physical Specifications">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-medium">Primary Material</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {(product as unknown as Record<string, string | undefined>).primaryMaterial || product.material || '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-medium">Frame Material</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {(product as unknown as Record<string, string | undefined>).frameMaterial || '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-medium">Dimensions (L × W × H)</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {product.dimensions
                    ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}`
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-medium">Weight</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {product.weight ? `${product.weight} kg` : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-medium">Warranty</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {product.warranty?.durationMonths ? `${product.warranty.durationMonths} Months` : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-medium">Care Instructions</span>
                <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--nfi-text)' }}>
                  {product.careInstructions || 'Standard dry wipe'}
                </p>
              </div>
              {product.finishes && product.finishes.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-400 uppercase font-medium">Available Finishes</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.finishes.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-900 border border-amber-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="text-gray-400 uppercase font-medium">Colors / Swatches</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.colors.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 border border-gray-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic category specs */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Custom Specs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <p className="font-medium mt-0.5 text-gray-800">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Pricing & Commerce">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-400">Selling Price</span>
                <p className="text-2xl font-semibold" style={{ color: 'var(--nfi-text)' }}>
                  ₹{product.basePrice ? (product.basePrice.amount / 100).toLocaleString('en-IN') : '0'}
                </p>
                {product.mrp && product.mrp.amount > (product.basePrice?.amount || 0) && (
                  <p className="text-xs text-gray-400 line-through">
                    MRP ₹{(product.mrp.amount / 100).toLocaleString('en-IN')}
                  </p>
                )}
                <p className="text-xs mt-1 text-gray-500">
                  {product.taxRate || 18}% GST {product.taxIncluded ? '(Included)' : '(Excluded)'}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Catalog Info">
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <StatusBadge status={product.status?.toLowerCase() || 'draft'} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Product Type</dt>
                <dd className="font-medium text-gray-900">
                  {product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Ready to Ship'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900">{category?.name || 'General'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium text-gray-900">{product.brand || 'National Furniture'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Featured</dt>
                <dd className="font-medium text-gray-900">{product.isFeatured ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Bestseller</dt>
                <dd className="font-medium text-gray-900">{product.isBestSeller ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </SectionCard>

          {product.tags && product.tags.length > 0 && (
            <SectionCard title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {product.seo && (
            <SectionCard title="SEO Preview">
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-blue-700 truncate">{product.seo.title || product.name}</p>
                <p className="text-emerald-700 text-[11px]">https://nationalinteriors.com/products/{product.slug}</p>
                <p className="text-gray-600 line-clamp-2">{product.seo.description || product.shortDescription || product.description}</p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
