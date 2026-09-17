'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, Product, Category } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ProductQuickViewDrawer } from '@/components/catalog/product-quick-view-drawer';
import { getStorefrontUrl } from '@/lib/storefront';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Density & View
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Quick View Drawer & Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Load saved density preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nfi_admin_products_density') as
        'compact' | 'comfortable' | null;
      if (saved) setDensity(saved);
    }
  }, []);

  const handleDensityChange = (newDensity: 'compact' | 'comfortable') => {
    setDensity(newDensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_admin_products_density', newDensity);
    }
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, catRes] = await Promise.all([
        CatalogService.adminListProducts({ limit: 200 }),
        CatalogService.listCategories(),
      ]);
      setProducts(prodRes.data?.items || []);
      setCategories(catRes.data?.items || (Array.isArray(catRes.data) ? catRes.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalog products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Memoized Category Map for O(1) lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      const id = c.id || c._id;
      if (id) map.set(id, c.name);
    });
    return map;
  }, [categories]);

  // Status counts for quick-tabs
  const statusCounts = useMemo(() => {
    const published = products.filter((p) => p.status === 'PUBLISHED').length;
    const draft = products.filter((p) => p.status === 'DRAFT').length;
    const archived = products.filter((p) => p.status === 'ARCHIVED').length;
    return { all: products.length, published, draft, archived };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
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
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, searchQuery, statusFilter, categoryFilter, typeFilter, sortBy]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection handlers
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

  // Toast notification helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // 1-Click Inline Status Update
  const handleSingleStatusUpdate = async (
    id: string,
    newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
  ) => {
    if (!id || updatingStatusId === id) return;
    setUpdatingStatusId(id);
    // Optimistic local state update
    const previousProducts = [...products];
    setProducts((prev) =>
      prev.map((p) => ((p.id || p._id) === id ? { ...p, status: newStatus } : p)),
    );

    try {
      await CatalogService.adminUpdateProduct(id, { status: newStatus });
      showToast(`Product status updated to ${newStatus}`);
      if (quickViewProduct && (quickViewProduct.id || quickViewProduct._id) === id) {
        setQuickViewProduct((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      // Rollback on failure
      setProducts(previousProducts);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          CatalogService.adminUpdateProduct(id, { status: newStatus }),
        ),
      );
      setSelectedIds(new Set());
      showToast(`Updated ${selectedIds.size} products to ${newStatus}`);
      await fetchInitialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Duplicate / Clone Product
  const handleDuplicate = async (sourceProduct: Product) => {
    setIsCloning(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newSku = `${sourceProduct.sku}-CP${randomSuffix}`;
      const payload: Record<string, unknown> = {
        name: `${sourceProduct.name} (Copy)`,
        sku: newSku,
        brand: sourceProduct.brand || 'National Furniture & Interiors',
        shortDescription: sourceProduct.shortDescription || undefined,
        description: sourceProduct.description || 'Bespoke luxury furniture piece.',
        categoryId: sourceProduct.categoryId,
        categoryIds: sourceProduct.categoryIds?.length
          ? sourceProduct.categoryIds
          : [sourceProduct.categoryId],
        basePrice: sourceProduct.basePrice,
        mrp: sourceProduct.mrp,
        taxRate: sourceProduct.taxRate ?? 18,
        taxIncluded: sourceProduct.taxIncluded ?? true,
        productType: sourceProduct.productType || 'READY_TO_SHIP',
        status: 'DRAFT',
        images: sourceProduct.images,
        videos: sourceProduct.videos,
        variants: sourceProduct.variants,
        tags: sourceProduct.tags,
        finishes: sourceProduct.finishes,
        colors: sourceProduct.colors,
        primaryMaterial: sourceProduct.primaryMaterial,
        frameMaterial: sourceProduct.frameMaterial,
        dimensions: sourceProduct.dimensions,
        weight: sourceProduct.weight,
        specifications: sourceProduct.specifications,
      };

      await CatalogService.adminCreateProduct(payload);
      showToast(`Duplicated into draft: ${newSku}`);
      await fetchInitialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate product');
    } finally {
      setIsCloning(false);
    }
  };

  // Archive Confirm
  const handleArchiveConfirm = async () => {
    if (!archiveModal.product) return;
    const id = archiveModal.product.id || archiveModal.product._id || '';
    setIsArchiving(true);
    try {
      await CatalogService.adminArchiveProduct(id);
      setArchiveModal({ open: false, product: null });
      showToast('Product archived');
      await fetchInitialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive product');
    } finally {
      setIsArchiving(false);
    }
  };

  // Copy SKU
  const copySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const itemsToExport =
      selectedIds.size > 0
        ? filteredProducts.filter((p) => selectedIds.has(p.id || p._id || ''))
        : filteredProducts;

    if (itemsToExport.length === 0) {
      alert('No products to export');
      return;
    }

    const headers = [
      'SKU',
      'Name',
      'Category',
      'Base Price (INR)',
      'MRP (INR)',
      'Product Type',
      'Status',
      'Variants Count',
    ];
    const rows = itemsToExport.map((p) => [
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(categoryMap.get(p.categoryId) || 'General').replace(/"/g, '""')}"`,
      p.basePrice ? p.basePrice.amount / 100 : 0,
      p.mrp ? p.mrp.amount / 100 : '',
      p.productType || 'READY_TO_SHIP',
      p.status || 'DRAFT',
      p.variants?.length || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nfi_products_catalog_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${itemsToExport.length} products to CSV`);
  };

  return (
    <>
      <PageHeader
        title="Product Catalog"
        description="Manage your furniture catalog, inventory, variants, and pricing."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Products' }]}
        action={
          <div className="flex items-center gap-2">
            <NfiButton
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || filteredProducts.length === 0}
              className="gap-1.5"
            >
              <svg
                className="h-3.5 w-3.5 text-stone-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </NfiButton>

            <NfiButton
              variant="secondary"
              size="sm"
              onClick={fetchInitialData}
              disabled={loading}
              className="gap-1.5"
            >
              <svg
                className={`h-3.5 w-3.5 text-stone-600 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              href="/catalog/products/new"
              className="shadow-xs inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--nfi-primary-hover, #B85A10)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--nfi-primary, #E07020)')
              }
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Product
            </Link>
          </div>
        }
      />

      {/* Toast Notification */}
      {successToast && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          <svg
            className="h-4 w-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successToast}
        </div>
      )}

      {error && (
        <div
          className="mb-4 rounded-md border p-3.5 text-xs"
          style={{
            backgroundColor: 'rgba(198,40,40,0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198,40,40,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Quick Status Tabs Bar */}
      <div
        className="mb-3 flex items-center justify-between gap-2 overflow-x-auto border-b pb-2 text-xs"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Products', count: statusCounts.all },
            { id: 'PUBLISHED', label: 'Published', count: statusCounts.published },
            { id: 'DRAFT', label: 'Draft', count: statusCounts.draft },
            { id: 'ARCHIVED', label: 'Archived', count: statusCounts.archived },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                  isActive
                    ? 'shadow-2xs bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                    isActive ? 'bg-stone-700 text-stone-200' : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Density Selector & Page Size */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="inline-flex rounded-md border bg-stone-50 p-0.5 text-xs"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <button
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                density === 'compact'
                  ? 'shadow-2xs bg-white text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Compact rows for high screen visibility"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => handleDensityChange('comfortable')}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                density === 'comfortable'
                  ? 'shadow-2xs bg-white text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Comfortable spacing"
            >
              Comfortable
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border bg-white px-1.5 py-0.5 text-[11px] text-stone-700 focus:outline-none"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        className="shadow-2xs mb-3 space-y-2.5 rounded-lg border bg-white p-3"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="flex flex-col items-center justify-between gap-2.5 md:flex-row">
          <div className="relative w-full flex-1 md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <svg
                className="h-3.5 w-3.5 text-stone-400"
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
            </div>
            <input
              type="text"
              className="block w-full rounded-md border py-1.5 pl-8 pr-7 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              style={{ borderColor: 'var(--nfi-border)' }}
              placeholder="Search by product name or SKU…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-stone-400 hover:text-stone-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:w-auto">
            <select
              className="rounded-md border bg-white py-1.5 pl-2.5 pr-7 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
              style={{ borderColor: 'var(--nfi-border)' }}
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
              className="rounded-md border bg-white py-1.5 pl-2.5 pr-7 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
              style={{ borderColor: 'var(--nfi-border)' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Product Types</option>
              <option value="READY_TO_SHIP">Ready to Ship</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
              <option value="CUSTOM">Bespoke / Custom</option>
            </select>

            <select
              className="col-span-2 rounded-md border bg-white py-1.5 pl-2.5 pr-7 text-xs text-stone-700 focus:border-amber-600 focus:outline-none sm:col-span-1"
              style={{ borderColor: 'var(--nfi-border)' }}
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc' | 'name')
              }
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div
            className="flex items-center justify-between border-t pt-2 text-xs"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <span className="font-semibold text-stone-800">
              {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <NfiButton
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatus('PUBLISHED')}
                disabled={isBulkUpdating}
              >
                Publish Selected
              </NfiButton>
              <NfiButton
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatus('DRAFT')}
                disabled={isBulkUpdating}
              >
                Set to Draft
              </NfiButton>
              <NfiButton
                variant="danger"
                size="sm"
                onClick={() => handleBulkStatus('ARCHIVED')}
                disabled={isBulkUpdating}
              >
                Archive Selected
              </NfiButton>
            </div>
          </div>
        )}
      </div>

      {/* Products Table with table-fixed to eliminate layout shifts */}
      <div
        className="shadow-2xs overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="overflow-x-auto">
          <table
            className="min-w-full table-fixed divide-y"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)' }}>
              <tr>
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedIds.has(p.id || p._id || ''))
                    }
                    className="h-3.5 w-3.5 rounded border-stone-300 text-stone-900 focus:ring-amber-600"
                    aria-label="Select all products on page"
                  />
                </th>
                <th className="w-[32%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Product Info
                </th>
                <th className="w-[14%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Category
                </th>
                <th className="w-[15%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Pricing & MRP
                </th>
                <th className="w-[14%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Type & Stock
                </th>
                <th className="w-[11%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Status
                </th>
                <th className="w-[14%] px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y bg-white text-xs"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              {loading ? (
                // 6-row skeleton table matching layout to avoid CLS
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-2.5">
                      <div className="h-3.5 w-3.5 rounded bg-stone-200" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 rounded bg-stone-200" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3.5 w-3/4 rounded bg-stone-200" />
                          <div className="h-2.5 w-1/3 rounded bg-stone-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3.5 w-20 rounded bg-stone-200" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3.5 w-16 rounded bg-stone-200" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3.5 w-24 rounded bg-stone-200" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-4 w-16 rounded-full bg-stone-200" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="ml-auto h-4 w-20 rounded bg-stone-200" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <svg
                        className="h-9 w-9 text-stone-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <p className="text-xs font-semibold text-stone-800">
                        No products match your filters
                      </p>
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('ALL');
                            setStatusFilter('ALL');
                            setTypeFilter('ALL');
                          }}
                          className="text-xs text-stone-500 underline hover:text-stone-800"
                        >
                          Clear all filters
                        </button>
                        <span className="text-stone-300">•</span>
                        <Link
                          href="/catalog/products/new"
                          className="text-xs font-medium text-amber-700 hover:underline"
                        >
                          Add new product
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const id = product.id || product._id || '';
                  const isSelected = selectedIds.has(id);
                  const catName = categoryMap.get(product.categoryId) || 'General';

                  const priceRupees = product.basePrice ? product.basePrice.amount / 100 : 0;
                  const mrpRupees = product.mrp ? product.mrp.amount / 100 : 0;
                  const discountPercent =
                    mrpRupees > priceRupees
                      ? Math.round(((mrpRupees - priceRupees) / mrpRupees) * 100)
                      : 0;

                  const hasVideos = product.videos && product.videos.length > 0;
                  const storefrontUrl = getStorefrontUrl(`/products/${product.slug || id}`);

                  const paddingClass = density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4';
                  const imgSize = density === 'compact' ? 38 : 44;

                  return (
                    <tr
                      key={id}
                      className={`group transition-colors ${
                        isSelected ? 'bg-amber-50/40' : 'hover:bg-stone-50/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className={paddingClass}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                          className="h-3.5 w-3.5 rounded border-stone-300 text-stone-900 focus:ring-amber-600"
                          aria-label={`Select ${product.name}`}
                        />
                      </td>

                      {/* Product Info (Optimized Fit with clean truncation & inline video badge) */}
                      <td className={paddingClass}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className="relative flex-shrink-0 items-center justify-center overflow-hidden rounded border bg-stone-50"
                            style={{
                              width: `${imgSize}px`,
                              height: `${imgSize}px`,
                              borderColor: 'var(--nfi-border)',
                            }}
                          >
                            {product.images?.[0]?.url ? (
                              <Image
                                unoptimized
                                width={imgSize}
                                height={imgSize}
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                <svg
                                  className="h-4 w-4"
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
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex max-w-full items-center gap-1.5">
                              <Link
                                href={`/catalog/products/${id}`}
                                className="block truncate text-xs font-semibold text-stone-900 hover:text-amber-800 hover:underline"
                                title={product.name}
                              >
                                {product.name}
                              </Link>
                              {hasVideos && (
                                <span className="py-0.2 inline-flex shrink-0 items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1 text-[9px] font-semibold leading-tight text-amber-900">
                                  ▶ Video
                                </span>
                              )}
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="py-0.2 rounded border border-stone-200/60 bg-stone-100/90 px-1.5 font-mono text-[10px] leading-none text-stone-500">
                                {product.sku}
                              </span>
                              <button
                                type="button"
                                onClick={() => copySku(product.sku)}
                                title="Copy SKU to clipboard"
                                className="text-stone-400 transition-colors hover:text-stone-700"
                              >
                                {copiedSku === product.sku ? (
                                  <span className="font-sans text-[9px] font-semibold text-emerald-600">
                                    ✓ Copied
                                  </span>
                                ) : (
                                  <svg
                                    className="h-3 w-3"
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
                      </td>

                      {/* Category */}
                      <td className={`${paddingClass} truncate text-xs text-stone-700`}>
                        <span className="block truncate" title={catName}>
                          {catName}
                        </span>
                      </td>

                      {/* Pricing & Discount Pill */}
                      <td className={`${paddingClass} whitespace-nowrap`}>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-stone-900">
                            ₹{priceRupees > 0 ? priceRupees.toLocaleString('en-IN') : '—'}
                          </span>
                          {discountPercent > 0 && (
                            <span className="py-0.2 inline-block rounded border border-emerald-200 bg-emerald-50 px-1 text-[9px] font-bold leading-none text-emerald-700">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                        {mrpRupees > priceRupees && (
                          <span className="mt-0.5 block text-[10px] text-stone-400 line-through">
                            MRP ₹{mrpRupees.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Type & Inventory Status */}
                      <td className={`${paddingClass} whitespace-nowrap`}>
                        <p className="text-xs font-medium text-stone-800">
                          {product.productType === 'MADE_TO_ORDER'
                            ? 'Made to Order'
                            : 'Ready to Ship'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-stone-500">
                          <span>
                            {product.variants?.length
                              ? `${product.variants.length} variant${product.variants.length > 1 ? 's' : ''}`
                              : 'Standard'}
                          </span>
                          <span>•</span>
                          <span
                            className={
                              product.productType === 'READY_TO_SHIP'
                                ? 'font-medium text-emerald-700'
                                : 'text-stone-500'
                            }
                          >
                            {product.productType === 'READY_TO_SHIP' ? 'In Stock' : 'Lead 2–3w'}
                          </span>
                        </div>
                      </td>

                      {/* 1-Click Fast Inline Status Toggle */}
                      <td className={`${paddingClass} whitespace-nowrap`}>
                        <div className="relative inline-block">
                          <select
                            value={product.status || 'DRAFT'}
                            onChange={(e) =>
                              handleSingleStatusUpdate(
                                id,
                                e.target.value as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
                              )
                            }
                            disabled={updatingStatusId === id}
                            className={`cursor-pointer appearance-none rounded-full border px-2.5 py-0.5 pr-5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              product.status === 'PUBLISHED'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : product.status === 'DRAFT'
                                  ? 'border-stone-200 bg-stone-100 text-stone-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                          >
                            <option value="PUBLISHED">● Published</option>
                            <option value="DRAFT">● Draft</option>
                            <option value="ARCHIVED">● Archived</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-stone-400">
                            <svg
                              className="h-2.5 w-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </td>

                      {/* Actions: Quick View, Storefront Preview, Edit, Clone, Archive */}
                      <td className={`${paddingClass} whitespace-nowrap text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick View Drawer */}
                          <button
                            type="button"
                            onClick={() => setQuickViewProduct(product)}
                            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                            title="Quick View Details"
                          >
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Live Storefront Preview */}
                          <Link
                            href={storefrontUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-amber-800"
                            title="Open on Live Storefront (new tab)"
                          >
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
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </Link>

                          {/* Edit Product */}
                          <Link
                            href={`/catalog/products/${id}/edit`}
                            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-amber-800"
                            title="Edit Product"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Link>

                          {/* 1-Click Duplicate / Clone */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(product)}
                            disabled={isCloning}
                            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                            title="Duplicate Product Draft"
                          >
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
                          </button>

                          {/* Archive Action */}
                          {product.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => setArchiveModal({ open: true, product })}
                              className="rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              title="Archive Product"
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
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
            className="flex flex-col items-center justify-between gap-3 border-t px-4 py-2.5 text-xs sm:flex-row"
            style={{
              borderColor: 'var(--nfi-border)',
              backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
            }}
          >
            <p className="text-stone-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProducts.length)} of{' '}
              {filteredProducts.length} products
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
              <span className="px-2 font-medium text-stone-600">
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

      {/* Quick View Drawer */}
      <ProductQuickViewDrawer
        open={Boolean(quickViewProduct)}
        product={quickViewProduct}
        categoryName={quickViewProduct ? categoryMap.get(quickViewProduct.categoryId) : undefined}
        onClose={() => setQuickViewProduct(null)}
        onStatusChange={async (id, newStatus) => {
          await handleSingleStatusUpdate(id, newStatus);
        }}
      />

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
