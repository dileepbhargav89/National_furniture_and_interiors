'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, Product, Category } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Archive modal
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, catRes] = await Promise.all([
        CatalogService.adminListProducts({ limit: 100 }),
        CatalogService.listCategories(),
      ]);
      setProducts(prodRes.data?.items || []);
      setCategories(catRes.data?.items || (Array.isArray(catRes.data) ? catRes.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalog products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
        const matchesCategory =
          categoryFilter === 'ALL' ||
          product.categoryId === categoryFilter ||
          product.categoryIds?.includes(categoryFilter);
        const matchesType = typeFilter === 'ALL' || product.productType === typeFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return (a.basePrice?.amount || 0) - (b.basePrice?.amount || 0);
        }
        if (sortBy === 'price-desc') {
          return (b.basePrice?.amount || 0) - (a.basePrice?.amount || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, searchQuery, statusFilter, categoryFilter, typeFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id || p._id || '')));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatus = async (newStatus: 'PUBLISHED' | 'ARCHIVED') => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          CatalogService.adminUpdateProduct(id, { status: newStatus })
        )
      );
      setSelectedIds(new Set());
      await fetchInitialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveModal.product) return;
    const id = archiveModal.product.id || archiveModal.product._id || '';
    setIsArchiving(true);
    try {
      await CatalogService.adminArchiveProduct(id);
      setArchiveModal({ open: false, product: null });
      await fetchInitialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive product');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Product Catalog"
        description="Manage your furniture catalog, inventory, variants, and pricing."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Products' }]}
        action={
          <div className="flex gap-2">
            <NfiButton variant="secondary" size="sm" onClick={fetchInitialData} disabled={loading}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </NfiButton>
            <Link
              href="/catalog/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors"
              style={{ backgroundColor: 'var(--nfi-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-primary)')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
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

      {/* Filter and Search Toolbar */}
      <div
        className="bg-white rounded-lg border p-4 mb-4 space-y-3"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 text-sm rounded-md border"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              placeholder="Search by name or SKU…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
            <select
              className="py-2 pl-3 pr-8 text-xs rounded-md border bg-white"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="py-2 pl-3 pr-8 text-xs rounded-md border bg-white"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              className="py-2 pl-3 pr-8 text-xs rounded-md border bg-white"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="READY_TO_SHIP">Ready to Ship</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
            </select>

            <select
              className="py-2 pl-3 pr-8 text-xs rounded-md border bg-white"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc' | 'name')}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar if items selected */}
        {selectedIds.size > 0 && (
          <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--nfi-border)' }}>
            <span className="font-medium" style={{ color: 'var(--nfi-text)' }}>
              {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <NfiButton
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatus('PUBLISHED')}
                disabled={isBulkUpdating}
              >
                Mark as Published
              </NfiButton>
              <NfiButton
                variant="danger"
                size="sm"
                onClick={() => handleBulkStatus('ARCHIVED')}
                disabled={isBulkUpdating}
              >
                Bulk Archive
              </NfiButton>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div
        className="bg-white rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedIds.has(p.id || p._id || ''))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                {['Product Info', 'Category', 'Pricing', 'Type & Variants', 'Status', 'Actions'].map((col, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                      i === 5 ? 'text-right' : ''
                    }`}
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nfi-primary)' }} />
                      Loading catalog…
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                        No products match your filters
                      </p>
                      <Link
                        href="/catalog/products/new"
                        className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white"
                        style={{ backgroundColor: 'var(--nfi-primary)' }}
                      >
                        Add Product
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const id = product.id || product._id || '';
                  const isSelected = selectedIds.has(id);
                  const catName = categories.find((c) => (c.id || c._id) === product.categoryId)?.name || 'General';

                  return (
                    <tr
                      key={id}
                      className={`group transition-colors ${isSelected ? 'bg-amber-50/40' : 'hover:bg-gray-50/70'}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-11 w-11 flex-shrink-0 rounded border flex items-center justify-center overflow-hidden bg-gray-50"
                            style={{ borderColor: 'var(--nfi-border)' }}
                          >
                            {product.images?.[0]?.url ? (
                              <Image
                                unoptimized
                                width={44}
                                height={44}
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link href={`/catalog/products/${id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--nfi-text)' }}>
                                {product.name}
                              </Link>
                              {product.videos && product.videos.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
                                  ▶ Video
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        {catName}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                          ₹{product.basePrice ? (product.basePrice.amount / 100).toLocaleString('en-IN') : '—'}
                        </p>
                        {product.mrp && product.mrp.amount > (product.basePrice?.amount || 0) && (
                          <p className="text-[11px] line-through text-gray-400">
                            MRP ₹{(product.mrp.amount / 100).toLocaleString('en-IN')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium" style={{ color: 'var(--nfi-text)' }}>
                          {product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Ready to Ship'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--nfi-text-secondary)' }}>
                          {product.variants?.length ? `${product.variants.length} variant(s)` : 'Standard'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={product.status?.toLowerCase() ?? 'draft'} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/catalog/products/${id}`}
                            className="font-medium text-gray-600 hover:text-black hover:underline"
                          >
                            View
                          </Link>
                          <Link
                            href={`/catalog/products/${id}/edit`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--nfi-accent)' }}
                          >
                            Edit
                          </Link>
                          {product.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => setArchiveModal({ open: true, product })}
                              className="font-medium text-red-600 hover:text-red-800"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && filteredProducts.length > 0 && (
          <div
            className="px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface-muted)' }}
          >
            <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
            </p>

            <div className="flex items-center gap-2">
              <NfiButton
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </NfiButton>
              <span className="text-xs px-2 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <NfiButton
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </NfiButton>
            </div>
          </div>
        )}
      </div>

      {/* Archive Modal */}
      {archiveModal.open && archiveModal.product && (
        <ConfirmModal
          open={archiveModal.open}
          title="Archive Product"
          description={`Are you sure you want to archive "${archiveModal.product.name}"? It will no longer be visible on the public storefront.`}
          confirmLabel="Archive Product"
          variant="danger"
          loading={isArchiving}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchiveModal({ open: false, product: null })}
        />
      )}
    </>
  );
}
