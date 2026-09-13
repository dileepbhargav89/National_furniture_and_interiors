'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { CatalogService, Category, ApiError } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface ValidationErrorItem {
  path?: string[];
  message?: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategoryData = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const [allCatsRes, currentCatRes] = await Promise.all([
        CatalogService.listCategories(),
        CatalogService.adminGetCategory(id),
      ]);

      setCategories(allCatsRes.data?.items || (Array.isArray(allCatsRes.data) ? allCatsRes.data : []));

      const cat = currentCatRes.data?.category;
      if (cat) {
        setName(cat.name || '');
        setSlug(cat.slug || '');
        setParentId(cat.parentId || '');
        setDescription(cat.description || '');
        setImageUrl(cat.imageUrl || '');
        setIsActive(cat.isActive ?? true);
        setSortOrder(String(cat.sortOrder ?? 0));
        if (cat.seo) {
          setSeoTitle(cat.seo.title || '');
          setSeoDescription(cat.seo.description || '');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load category');
    } finally {
      setIsInitializing(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      await CatalogService.adminUpdateCategory(id, {
        name,
        slug,
        description: description || undefined,
        parentId: parentId || null,
        imageUrl: imageUrl || undefined,
        isActive,
        sortOrder: parseInt(sortOrder) || 0,
        level: parentId ? 1 : 0,
        seo: seoTitle || seoDescription ? { title: seoTitle, description: seoDescription } : undefined,
      });
      router.push('/catalog/categories');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (Array.isArray(err.data)) setValidationErrors(err.data as ValidationErrorItem[]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update category');
      }
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await CatalogService.adminDeleteCategory(id);
      setIsDeleteModalOpen(false);
      router.push('/catalog/categories');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
      setIsDeleting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--nfi-primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Loading category…
        </p>
      </div>
    );
  }

  // Filter out self to avoid circular hierarchy
  const availableParents = categories.filter((c) => (c.id || c._id) !== id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <PageHeader
        title={`Edit Category: ${name}`}
        description={`Configure hierarchy, SEO, and visibility for category "${name}".`}
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Categories', href: '/catalog/categories' },
          { label: name || 'Edit' },
        ]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/categories">
              <NfiButton type="button" variant="secondary" size="sm">
                Cancel
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading}>
              Save Changes
            </NfiButton>
          </div>
        }
      />

      {error && (
        <div
          className="mb-5 p-4 rounded-md text-sm border"
          style={{
            backgroundColor: 'rgba(198, 40, 40, 0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198, 40, 40, 0.2)',
          }}
        >
          <p className="font-semibold">{error}</p>
          {validationErrors.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-0.5 text-xs">
              {validationErrors.map((e, idx) => (
                <li key={idx}>
                  {e.path?.join('.') && <strong>{e.path.join('.')}</strong>}
                  {e.path && e.path.length > 0 ? ' — ' : ''}{e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Category Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Category Name" htmlFor="name" required>
                  <input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="URL Slug" htmlFor="slug" required>
                  <input
                    id="slug"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Parent Category" htmlFor="parent" helpText="Parent category in the hierarchy">
                <select
                  id="parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="">None (Top-level root category)</option>
                  {availableParents.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Description" htmlFor="description">
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Media Banner">
            <FormField label="Banner Image URL" htmlFor="imgUrl">
              <input
                id="imgUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={inputClassName}
                style={inputStyle}
              />
            </FormField>
            {imageUrl && (
              <div className="mt-3 aspect-[21/9] rounded-lg border overflow-hidden bg-gray-50 max-w-md">
                <Image
                  unoptimized
                  width={448}
                  height={192}
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </SectionCard>

          <SectionCard title="SEO Settings">
            <div className="space-y-4">
              <FormField label="Meta Title" htmlFor="seoTitle">
                <input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Meta Description" htmlFor="seoDesc">
                <textarea
                  id="seoDesc"
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

        <div className="space-y-6">
          <SectionCard title="Settings">
            <div className="space-y-4">
              <FormField label="Sort Order" htmlFor="sortOrder">
                <input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="isActive" className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                  Active (Visible on Storefront)
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Danger Zone">
            <p className="text-xs text-gray-500 mb-3">
              Deleting this category cannot be undone. Associated products will lose their category tag.
            </p>
            <NfiButton
              type="button"
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Category
            </NfiButton>
          </SectionCard>
        </div>
      </div>

      {isDeleteModalOpen && (
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Category"
          description={`Are you sure you want to delete category "${name}"?`}
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
