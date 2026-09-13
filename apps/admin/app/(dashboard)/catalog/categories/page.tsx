'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { CatalogService, Category } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface FlattenedCategory extends Category {
  depth?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await CatalogService.listCategories();
      setCategories(response.data?.items || (Array.isArray(response.data) ? response.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ open: true, id, name });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await CatalogService.adminDeleteCategory(deleteModal.id);
      setDeleteModal({ open: false, id: '', name: '' });
      await fetchCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const id = cat.id || cat._id || '';
    try {
      await CatalogService.adminUpdateCategory(id, { isActive: !cat.isActive });
      setCategories((prev) =>
        prev.map((c) => ((c.id || c._id) === id ? { ...c, isActive: !c.isActive } : c)),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to toggle category status');
    }
  };

  // Build hierarchical category list (Parents followed by their children)
  const organizedCategories = useMemo(() => {
    const filtered = categories.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (searchQuery) return filtered.map((c) => ({ ...c, depth: 0 }));

    // Build hierarchy: root items first (parentId is null/empty or not in categories)
    const roots = filtered.filter((c) => !c.parentId);
    const result: FlattenedCategory[] = [];

    const appendWithChildren = (parent: Category, depth: number) => {
      result.push({ ...parent, depth });
      const children = filtered.filter((c) => c.parentId === (parent.id || parent._id));
      children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      children.forEach((child) => appendWithChildren(child, depth + 1));
    };

    roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    roots.forEach((root) => appendWithChildren(root, 0));

    // Append any orphaned categories (if parentId exists but not found in roots)
    const processedIds = new Set(result.map((r) => r.id || r._id));
    filtered.forEach((c) => {
      if (!processedIds.has(c.id || c._id)) {
        result.push({ ...c, depth: 0 });
      }
    });

    return result;
  }, [categories, searchQuery]);

  return (
    <>
      <PageHeader
        title="Category Architecture"
        description="Organise your furniture and decor taxonomy with hierarchical categories."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Categories' }]}
        action={
          <div className="flex items-center gap-2">
            <NfiButton variant="secondary" size="sm" onClick={fetchCategories} disabled={loading}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </NfiButton>
            <Link
              href="/catalog/categories/new"
              className="shadow-xs inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--nfi-primary-hover, #B85A10)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--nfi-primary, #E07020)')
              }
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Category
            </Link>
          </div>
        }
      />

      {error && (
        <div
          className="mb-5 rounded-md border p-4 text-sm"
          style={{
            backgroundColor: 'rgba(198, 40, 40, 0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198, 40, 40, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Search toolbar */}
      <div
        className="mb-4 flex items-center justify-between gap-3 rounded-lg border bg-white p-4"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
            style={{ borderColor: 'var(--nfi-border)' }}
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400">{categories.length} total categories</p>
      </div>

      {/* Data Table */}
      <div
        className="overflow-hidden rounded-lg border bg-white shadow-sm"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                {['Category Name', 'Slug', 'Hierarchy Level', 'Sort Order', 'Status', ''].map(
                  (col, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        i === 5 ? 'text-right' : ''
                      }`}
                      style={{ color: 'var(--nfi-text-secondary)' }}
                    >
                      {col || <span className="sr-only">Actions</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y bg-white" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: 'var(--nfi-primary)' }}
                      />
                      Loading categories…
                    </div>
                  </td>
                </tr>
              ) : organizedCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                      No categories found
                    </p>
                    <Link
                      href="/catalog/categories/new"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ backgroundColor: 'var(--nfi-primary)' }}
                    >
                      Add First Category
                    </Link>
                  </td>
                </tr>
              ) : (
                organizedCategories.map((category) => {
                  const id = category.id || category._id || '';
                  const depth = category.depth || 0;

                  return (
                    <tr key={id} className="group transition-colors hover:bg-gray-50/70">
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${depth * 24}px` }}
                        >
                          {depth > 0 ? (
                            <span className="font-mono text-sm text-gray-300">↳</span>
                          ) : (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: 'var(--nfi-primary)' }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="line-clamp-1 text-xs text-gray-400">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-600">
                        {category.slug}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-600">
                        {depth === 0 ? (
                          <span className="rounded bg-gray-100 px-2 py-0.5 font-medium">Root</span>
                        ) : (
                          <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                            Subcategory (L{depth})
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-600">
                        {category.sortOrder ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(category)}
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            category.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/catalog/categories/${id}/edit`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--nfi-accent)' }}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(id, category.name)}
                            className="font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          title="Delete Category"
          description={`Are you sure you want to delete category "${deleteModal.name}"? Products assigned to this category may lose their categorization.`}
          confirmLabel="Delete Category"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
        />
      )}
    </>
  );
}
