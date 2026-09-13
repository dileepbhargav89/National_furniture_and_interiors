'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CatalogService, Product } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { ProductPickerModal } from '@/components/catalog/product-picker-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
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

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsInitializing(true);
        const [collRes, prodRes] = await Promise.all([
          CatalogService.adminGetCollection(id),
          CatalogService.adminListProducts({ limit: 100 }),
        ]);

        const data = collRes.data;
        if (data) {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setShortDescription(data.shortDescription || '');
          setDescription(data.description || '');
          setStatus((data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') || 'DRAFT');
          setFeatured(Boolean(data.featured));
          setSelectedProductIds(data.productIds || []);
          setHeroImageUrl(data.heroImage?.url || '');

          if (data.startDate) {
            setStartDate(new Date(data.startDate).toISOString().split('T')[0] || '');
          }
          if (data.endDate) {
            setEndDate(new Date(data.endDate).toISOString().split('T')[0] || '');
          }
          if (data.seo) {
            setSeoTitle(data.seo.title || '');
            setSeoDescription(data.seo.description || '');
          }
        }

        // Map product details
        const allProds = prodRes.data?.items || [];
        const filtered = allProds.filter((p) => data?.productIds?.includes(p.id || p._id || ''));
        setSelectedProductsData(filtered);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to fetch collection details.');
      } finally {
        setIsInitializing(false);
      }
    };

    fetchCollection();
  }, [id]);

  // Sync selected products data when selection changes via picker
  useEffect(() => {
    if (isInitializing) return;
    const updateProductDetails = async () => {
      try {
        const prodRes = await CatalogService.adminListProducts({ limit: 100 });
        const allProds = prodRes.data?.items || [];
        const filtered = allProds.filter((p) => selectedProductIds.includes(p.id || p._id || ''));
        setSelectedProductsData(filtered);
      } catch {
        // Non-blocking
      }
    };
    updateProductDetails();
  }, [selectedProductIds, isInitializing]);

  const handleRemoveProduct = (prodId: string) => {
    setSelectedProductIds((prev) => prev.filter((pId) => pId !== prodId));
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
        seo: seoTitle || seoDescription ? { title: seoTitle, description: seoDescription } : undefined,
      };

      if (heroImageUrl) {
        payload.heroImage = {
          url: heroImageUrl,
          publicId: 'hero',
          sortOrder: 0,
          isPrimary: true,
        };
      } else {
        payload.heroImage = null;
      }

      await CatalogService.adminUpdateCollection(id, payload);
      router.push('/catalog/collections');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update collection');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await CatalogService.adminDeleteCollection(id);
      setIsDeleteModalOpen(false);
      router.push('/catalog/collections');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete collection');
      setIsDeleting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--nfi-primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Loading collection details…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <PageHeader
        title={`Edit Collection: ${title}`}
        description={`Manage showcase pieces, schedule, and assets for "${title}".`}
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Collections', href: '/catalog/collections' },
          { label: title || 'Edit' },
        ]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/collections">
              <NfiButton type="button" variant="secondary" size="sm">
                Cancel
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading} disabled={!title || !slug}>
              Save Changes
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
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Slug" required>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Short Summary">
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Full Editorial Story">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Featured products linked to this collection showcase.
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
                  Modify Products ({selectedProductIds.length})
                </NfiButton>
              </div>

              {selectedProductIds.length === 0 ? (
                <div
                  onClick={() => setIsPickerOpen(true)}
                  className="p-8 text-center border rounded-lg border-dashed cursor-pointer hover:border-gray-400"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <p className="text-xs text-gray-500">No products in collection. Click to add.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProductsData.map((prod) => {
                    const prodId = prod.id || prod._id || '';
                    return (
                      <div
                        key={prodId}
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
                          onClick={() => handleRemoveProduct(prodId)}
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
            <FormField label="Hero Image URL">
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
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
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
                <FormField label="Active Start Date">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Active End Date">
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

          <SectionCard title="Danger Zone">
            <p className="text-xs text-gray-500 mb-3">
              Delete this collection. This action is irreversible.
            </p>
            <NfiButton
              type="button"
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Collection
            </NfiButton>
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

      {isDeleteModalOpen && (
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Collection"
          description={`Are you sure you want to delete "${title}"?`}
          confirmLabel="Delete"
          variant="danger"
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </form>
  );
}
