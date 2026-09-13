'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CatalogService, Category, ApiError } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { NfiButton } from '@/components/ui/nfi-button';

interface ValidationErrorItem {
  path?: string[];
  message?: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetchExistingCategories();
  }, []);

  const fetchExistingCategories = async () => {
    try {
      const res = await CatalogService.listCategories();
      setCategories(res.data?.items || (Array.isArray(res.data) ? res.data : []));
    } catch {
      // Non-blocking
    }
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      await CatalogService.adminCreateCategory({
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
        setError(err instanceof Error ? err.message : 'Failed to create category');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <PageHeader
        title="Add New Category"
        description="Create a taxonomy category or subcategory for catalog navigation."
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Categories', href: '/catalog/categories' },
          { label: 'Add New' },
        ]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/categories">
              <NfiButton type="button" variant="secondary" size="sm">
                Cancel
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading}>
              Save Category
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
                    onChange={handleNameChange}
                    placeholder="e.g. Dining Tables"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="URL Slug" htmlFor="slug" required helpText="Generated automatically from name">
                  <input
                    id="slug"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="dining-tables"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Parent Category" htmlFor="parent" helpText="Select a parent to make this a nested subcategory">
                <select
                  id="parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="">None (Top-level root category)</option>
                  {categories.map((c) => (
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
                  placeholder="Overview of products in this category..."
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Media Banner">
            <FormField label="Banner Image URL" htmlFor="imgUrl" helpText="Direct image URL for category header on storefront">
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

          <SectionCard title="SEO & Search Engine Optimization">
            <div className="space-y-4">
              <FormField label="Meta Title" htmlFor="seoTitle">
                <input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name ? `${name} | National Furniture` : ''}
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
                  placeholder="Browse our handcrafted collection of..."
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
              <FormField label="Sort Order" htmlFor="sortOrder" helpText="Lower numbers appear first">
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
        </div>
      </div>
    </form>
  );
}
