'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@nfi/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { getStorefrontUrl } from '@/lib/storefront';

interface ProductQuickViewDrawerProps {
  product: Product | null;
  categoryName?: string | undefined;
  open: boolean;
  onClose: () => void;
  onStatusChange?:
    ((id: string, newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => Promise<void>) | undefined;
}

export function ProductQuickViewDrawer({
  product,
  categoryName = 'General',
  open,
  onClose,
  onStatusChange,
}: ProductQuickViewDrawerProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setCopiedSku(false);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  const id = product.id || product._id || '';
  const priceRupees = product.basePrice ? product.basePrice.amount / 100 : 0;
  const mrpRupees = product.mrp ? product.mrp.amount / 100 : 0;
  const discountPercent =
    mrpRupees > priceRupees ? Math.round(((mrpRupees - priceRupees) / mrpRupees) * 100) : 0;

  const handleCopySku = () => {
    if (!product.sku) return;
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleStatusToggle = async (newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    if (!onStatusChange || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const storefrontUrl = getStorefrontUrl(`/products/${product.slug || id}`);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className="flex w-screen max-w-xl flex-col border-l bg-white shadow-2xl"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{
              borderColor: 'var(--nfi-border)',
              backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
            }}
          >
            <div className="flex min-w-0 items-center gap-2.5 pr-4">
              <span className="rounded border border-amber-300/60 bg-amber-100/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
                {product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Ready to Ship'}
              </span>
              <StatusBadge status={product.status?.toLowerCase() ?? 'draft'} />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="shadow-2xs inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                style={{ borderColor: 'var(--nfi-border)' }}
                title="View on Customer Storefront (new tab)"
              >
                <svg
                  className="h-3.5 w-3.5 text-stone-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Live Storefront
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close product quick view"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Title & SKU */}
            <div>
              <h2 id="drawer-title" className="text-lg font-bold leading-snug text-stone-900">
                {product.name}
              </h2>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-stone-500">{categoryName}</span>
                <span className="text-stone-300">•</span>
                <div className="inline-flex items-center gap-1.5 rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-700">
                  <span>{product.sku}</span>
                  <button
                    type="button"
                    onClick={handleCopySku}
                    className="text-stone-400 transition-colors hover:text-stone-700"
                    title="Copy SKU"
                  >
                    {copiedSku ? (
                      <span className="font-sans text-[10px] font-medium text-emerald-600">
                        Copied!
                      </span>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Media Carousel / Preview */}
            <div className="space-y-2">
              <div
                className="aspect-4/3 relative w-full overflow-hidden rounded-lg border bg-stone-50"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                {product.images &&
                product.images.length > 0 &&
                product.images[activeImageIdx]?.url ? (
                  <Image
                    unoptimized
                    src={product.images[activeImageIdx].url}
                    alt={product.images[activeImageIdx].altText || product.name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-300">
                    <svg
                      className="h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs text-stone-400">No image uploaded</span>
                  </div>
                )}
                {product.videos && product.videos.length > 0 && (
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow">
                    <span>▶</span> {product.videos.length} Video
                    {product.videos.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border transition-all ${
                        activeImageIdx === idx
                          ? 'border-amber-600 ring-2 ring-amber-600/30'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        unoptimized
                        src={img.url}
                        alt={img.altText || `Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Commercials Card */}
            <div
              className="space-y-2.5 rounded-lg border bg-stone-50/50 p-4"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Pricing & Economics
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-stone-900">
                  ₹{priceRupees.toLocaleString('en-IN')}
                </span>
                {mrpRupees > priceRupees && (
                  <>
                    <span className="text-sm text-stone-400 line-through">
                      MRP ₹{mrpRupees.toLocaleString('en-IN')}
                    </span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 pt-1 text-xs text-stone-500">
                <span>Tax Rate: {product.taxRate ?? 18}% GST</span>
                <span>•</span>
                <span>Pricing Mode: {product.taxIncluded ? 'GST Included' : 'GST Extra'}</span>
              </div>
            </div>

            {/* Quick Status Control */}
            {onStatusChange && (
              <div
                className="space-y-2 rounded-lg border bg-white p-3.5"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <span className="block text-xs font-semibold text-stone-700">
                  Fast Status Switch
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingStatus || product.status === 'PUBLISHED'}
                    onClick={() => handleStatusToggle('PUBLISHED')}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      product.status === 'PUBLISHED'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    ● Published
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus || product.status === 'DRAFT'}
                    onClick={() => handleStatusToggle('DRAFT')}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      product.status === 'DRAFT'
                        ? 'border-stone-300 bg-stone-100 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    ● Draft
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus || product.status === 'ARCHIVED'}
                    onClick={() => handleStatusToggle('ARCHIVED')}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      product.status === 'ARCHIVED'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    ● Archived
                  </button>
                </div>
              </div>
            )}

            {/* Materials & Physical Specifications */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Specifications & Materials
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-stone-200/60 bg-stone-50 p-2.5">
                  <dt className="text-stone-400">Primary Material</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {product.primaryMaterial || product.material || 'Solid Wood / Steel'}
                  </dd>
                </div>
                <div className="rounded border border-stone-200/60 bg-stone-50 p-2.5">
                  <dt className="text-stone-400">Frame Material</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {product.frameMaterial || 'Engineered Hardwood'}
                  </dd>
                </div>
                <div className="rounded border border-stone-200/60 bg-stone-50 p-2.5">
                  <dt className="text-stone-400">Dimensions (L×W×H)</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {product.dimensions
                      ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit || 'cm'}`
                      : 'Standard Specs'}
                  </dd>
                </div>
                <div className="rounded border border-stone-200/60 bg-stone-50 p-2.5">
                  <dt className="text-stone-400">Weight</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {product.weight ? `${product.weight} kg` : 'Standard'}
                  </dd>
                </div>
                {product.finishes && product.finishes.length > 0 && (
                  <div className="col-span-2 rounded border border-stone-200/60 bg-stone-50 p-2.5">
                    <dt className="text-stone-400">Available Finishes</dt>
                    <dd className="mt-0.5 flex flex-wrap gap-1.5 font-medium text-stone-800">
                      {product.finishes.map((f, i) => (
                        <span
                          key={i}
                          className="rounded border border-stone-200 bg-white px-2 py-0.5 text-[11px]"
                        >
                          {f}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {product.warranty && (
                  <div className="col-span-2 rounded border border-stone-200/60 bg-stone-50 p-2.5">
                    <dt className="text-stone-400">Warranty</dt>
                    <dd className="mt-0.5 font-medium text-stone-800">
                      {product.warranty.durationMonths} Months (
                      {product.warranty.terms || 'Comprehensive coverage'})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Variants ({product.variants.length})
                </h3>
                <div
                  className="divide-y overflow-hidden rounded-md border text-xs"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {product.variants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2.5">
                      <div>
                        <span className="font-mono font-medium text-stone-800">{v.sku}</span>
                        <div className="mt-0.5 text-[11px] text-stone-500">
                          {v.attributes?.map((a) => `${a.name}: ${a.value}`).join(' • ') ||
                            'Default'}
                        </div>
                      </div>
                      <span className="font-medium text-stone-900">
                        {v.priceOverride
                          ? `₹${(v.priceOverride.amount / 100).toLocaleString('en-IN')}`
                          : 'Base Price'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Description
                </h3>
                <p className="line-clamp-4 text-xs leading-relaxed text-stone-600 transition-all hover:line-clamp-none">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-between border-t bg-white p-4"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <NfiButton variant="secondary" size="sm" onClick={onClose}>
              Close
            </NfiButton>

            <div className="flex gap-2">
              <Link
                href={`/catalog/products/${id}`}
                className="inline-flex items-center rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Full Details
              </Link>
              <Link
                href={`/catalog/products/${id}/edit`}
                className="shadow-xs inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              >
                Edit Product
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
