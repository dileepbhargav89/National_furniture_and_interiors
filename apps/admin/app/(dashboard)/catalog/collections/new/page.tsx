'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CatalogService, Product } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { ProductPickerModal } from '@/components/catalog/product-picker-modal';

export default function NewCollectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected products state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProductsData, setSelectedProductsData] = useState<Product[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const generateSlug = (text: string) => {
    setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug) generateSlug(val);
  };

  // Sync products details when selectedProductIds change
  useEffect(() => {
    const fetchSelectedDetails = async () => {
      if (selectedProductIds.length === 0) {
        setSelectedProductsData([]);
        return;
      }
      try {
        const res = await CatalogService.adminListProducts({ limit: 100 });
        const all = res.data?.items || [];
        const filtered = all.filter((p) => selectedProductIds.includes(p.id || p._id || ''));
        setSelectedProductsData(filtered);
      } catch {
        // Non-blocking
      }
    };
    fetchSelectedDetails();
  }, [selectedProductIds]);

  const handleRemoveProduct = (id: string) => {
    setSelectedProductIds((prev) => prev.filter((pId) => pId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        title,
        slug,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        status,
        featured,
        productIds: selectedProductIds,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        sortOrder: 0,
        seo: seoTitle || seoDescription ? { title: seoTitle, description: seoDescription } : undefined,
      };

      if (heroImageUrl) {
        payload.heroImage = {
          url: heroImageUrl,
          publicId: 'hero',
          sortOrder: 0,
          isPrimary: true,
        };
      }

      await CatalogService.adminCreateCollection(payload);
      router.push('/catalog/collections');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <PageHeader
        title="Create Collection"
        description="Add a curated themed furniture collection with selected showcase pieces."
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Collections', href: '/catalog/collections' },
          { label: 'Create' },
        ]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/collections">
              <NfiButton type="button" variant="secondary" size="sm">
                Cancel
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading} disabled={!title || !slug}>
              Create Collection
            </NfiButton>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-md text-sm border bg-red-50 text-red-700 border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Collection Details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Collection Title" required>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Minimalist Nordic Living"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Slug" required helpText="URL path on storefront">
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="minimalist-nordic-living"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Short Summary" helpText="One-liner subtitle shown on banner cards">
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Pure forms, natural oak, and serene earthy textures"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Editorial Story / Full Description">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="The design philosophy behind this curated collection..."
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Product Selection */}
          <SectionCard title={`Collection Products (${selectedProductIds.length})`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Select pieces to feature together in this collection.
                </p>
                <NfiButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {selectedProductIds.length > 0 ? 'Modify Products' : 'Select Products'}
                </NfiButton>
              </div>

              {selectedProductIds.length === 0 ? (
                <div
                  onClick={() => setIsPickerOpen(true)}
                  className="p-8 text-center border rounded-lg border-dashed cursor-pointer hover:border-gray-400 transition-colors"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: 'var(--nfi-text)' }}>
                    No products added yet
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click to launch the catalog product picker</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProductsData.map((prod) => {
                    const id = prod.id || prod._id || '';
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-gray-50/50"
                        style={{ borderColor: 'var(--nfi-border)' }}
                      >
                        <div
                          className="w-12 h-12 rounded border bg-white overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: 'var(--nfi-border)' }}
                        >
                          {prod.images?.[0]?.url ? (
                            <Image
                              unoptimized
                              width={48}
                              height={48}
                              src={prod.images[0].url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">No img</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--nfi-text)' }}>
                            {prod.name}
                          </p>
                          <p className="text-[11px] font-mono text-gray-500">
                            {prod.sku} · ₹{prod.basePrice ? (prod.basePrice.amount / 100).toLocaleString('en-IN') : '0'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(id)}
                          className="text-gray-400 hover:text-red-600 p-1 text-xs"
                          title="Remove from collection"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Hero Banner Visuals */}
          <SectionCard title="Visual Showcase">
            <FormField label="Hero Image URL" helpText="High-resolution visual for collection header">
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={inputClassName}
                style={inputStyle}
              />
            </FormField>
            {heroImageUrl && (
              <div className="mt-3 aspect-[21/9] rounded-lg border overflow-hidden bg-gray-50 max-w-lg">
                <Image
                  unoptimized
                  width={512}
                  height={219}
                  src={heroImageUrl}
                  alt="Hero banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </SectionCard>

          {/* SEO */}
          <SectionCard title="SEO Settings">
            <div className="space-y-4">
              <FormField label="Meta Title">
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title ? `${title} | National Interiors` : ''}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Meta Description">
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Publishing & Scheduling">
            <div className="space-y-4">
              <FormField label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </FormField>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="featured" className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                  Highlight as Featured Collection
                </label>
              </div>

              <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <FormField label="Active Start Date (Optional)" helpText="Schedule launch">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Active End Date (Optional)" helpText="For seasonal / festive campaigns">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Product Picker Modal */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedIds={selectedProductIds}
        onSelect={setSelectedProductIds}
      />
    </form>
  );
}
