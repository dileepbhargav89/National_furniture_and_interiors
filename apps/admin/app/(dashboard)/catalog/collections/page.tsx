'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, ProductCollection } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await CatalogService.adminListCollections();
      const rawData = response.data as unknown as { items?: ProductCollection[] } | ProductCollection[];
      const items = Array.isArray(rawData) ? rawData : rawData?.items || [];
      setCollections(items as ProductCollection[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await CatalogService.adminDeleteCollection(deleteModal.id);
      setCollections(collections.filter((c) => c.id !== deleteModal.id));
      setDeleteModal({ open: false, id: '', title: '' });
    } catch {
      alert('Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const matchesSearch =
        col.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || col.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  return (
    <>
      <PageHeader
        title="Curated Collections"
        description="Curate thematic furniture showcases, seasonal looks, and room collections."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Collections' }]}
        action={
          <div className="flex gap-2">
            <NfiButton variant="secondary" size="sm" onClick={fetchCollections} disabled={loading}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </NfiButton>
            <Link
              href="/catalog/collections/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors"
              style={{ backgroundColor: 'var(--nfi-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-primary)')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Collection
            </Link>
          </div>
        }
      />

      {error && (
        <div
          className="mb-5 p-4 rounded-md text-sm border"
          style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div
        className="bg-white rounded-lg border p-4 mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="relative w-full sm:w-80">
          <svg className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border"
            style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
            placeholder="Search collections by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 pl-3 pr-8 text-xs rounded-md border bg-white"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                {['Collection', 'Slug', 'Products', 'Featured', 'Status', ''].map((col, i) => (
                  <th
                    key={i}
                    className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {col || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nfi-primary)' }} />
                      Loading collections…
                    </div>
                  </td>
                </tr>
              ) : filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                      No collections found
                    </p>
                    <Link
                      href="/catalog/collections/new"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white"
                      style={{ backgroundColor: 'var(--nfi-primary)' }}
                    >
                      Create First Collection
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-8 rounded overflow-hidden border bg-gray-100 flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: 'var(--nfi-border)' }}
                        >
                          {col.heroImage?.url ? (
                            <Image
                              unoptimized
                              width={48}
                              height={32}
                              src={col.heroImage.url}
                              alt={col.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">No Hero</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--nfi-text)' }}>
                            {col.title}
                          </p>
                          {col.shortDescription && (
                            <p className="text-xs text-gray-400 line-clamp-1">{col.shortDescription}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{col.slug}</td>
                    <td className="px-6 py-3.5 text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {col.productIds?.length || 0} products
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      {col.featured ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          ★ Featured
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={col.status?.toLowerCase() || 'draft'} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-xs">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/catalog/collections/${col.id}/edit`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--nfi-accent)' }}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, id: col.id, title: col.title })}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          title="Delete Collection"
          description={`Are you sure you want to delete "${deleteModal.title}"? This will not delete the underlying products.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, id: '', title: '' })}
        />
      )}
    </>
  );
}
