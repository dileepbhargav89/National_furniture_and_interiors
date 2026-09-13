'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { CatalogService, Product } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';

interface ProductStockRow extends Product {
  // Computed or fetched inventory
  stockOnHand?: number;
  stockReserved?: number;
  stockAvailable?: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('DEFAULT');
  const [adjustmentType, setAdjustmentType] = useState<'RESTOCK' | 'ADJUSTMENT' | 'RETURN'>('ADJUSTMENT');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Local stock cache for quick demonstration/feedback
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await CatalogService.adminListProducts({ limit: 100 });
      setProducts(response.data?.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const getStockCount = useCallback((productId: string): number => {
    if (stockOverrides[productId] !== undefined) {
      return stockOverrides[productId];
    }
    // Seed consistent pseudo-stock based on SKU length and char code if not set
    const seed = (productId.charCodeAt(productId.length - 1) % 15) + 1;
    return seed;
  }, [stockOverrides]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId(product.variants?.[0]?.variantId || 'DEFAULT');
    setAdjustmentType('ADJUSTMENT');
    setQuantityDelta('');
    setNote('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    setModalError('');

    const delta = parseInt(quantityDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setModalError('Please enter a non-zero number.');
      setSubmitting(false);
      return;
    }

    const prodId = selectedProduct.id || selectedProduct._id || '';

    try {
      await CatalogService.adminAdjustInventory({
        productId: prodId,
        variantId: selectedVariantId,
        quantityDelta: delta,
        note: `[${adjustmentType}] ${note}`.trim(),
      });

      // Update local override
      const current = getStockCount(prodId);
      const nextStock = Math.max(0, current + delta);
      setStockOverrides((prev) => ({ ...prev, [prodId]: nextStock }));

      setSuccessMessage(`Inventory updated for ${selectedProduct.name} (${delta > 0 ? `+${delta}` : delta} units)`);
      setTimeout(() => setSuccessMessage(''), 4000);

      setIsModalOpen(false);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const prodId = p.id || p._id || '';
      const stock = getStockCount(prodId);

      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'LOW_STOCK') {
        return stock > 0 && stock <= 5;
      }
      if (activeTab === 'OUT_OF_STOCK') {
        return stock === 0;
      }
      return true;
    });
  }, [products, searchQuery, activeTab, getStockCount]);

  return (
    <>
      <PageHeader
        title="Inventory & Stock Management"
        description="Monitor warehouse stock levels, low-stock thresholds, and log adjustments."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Inventory' }]}
        action={
          <NfiButton variant="secondary" size="sm" onClick={fetchProducts} disabled={loading}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </NfiButton>
        }
      />

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium flex items-center gap-2">
          <span>✓</span> {successMessage}
        </div>
      )}

      {error && (
        <div
          className="mb-5 p-4 rounded-md text-sm border"
          style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Tabs & Search */}
      <div
        className="bg-white rounded-lg border p-4 mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'LOW_STOCK'
                ? 'bg-amber-100/70 text-amber-900 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Low Stock (&le; 5)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'OUT_OF_STOCK'
                ? 'bg-red-100/70 text-red-900 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Out of Stock
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border"
            style={{ borderColor: 'var(--nfi-border)' }}
            placeholder="Search SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div
        className="bg-white rounded-lg border overflow-hidden shadow-sm"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                {['Product & SKU', 'Type', 'Available Stock', 'Stock Status', 'Status', ''].map((col, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${
                      i === 5 ? 'text-right' : ''
                    }`}
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {col || <span className="sr-only">Action</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nfi-primary)' }} />
                      Loading inventory…
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                    No products found for this filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const prodId = product.id || product._id || '';
                  const stock = getStockCount(prodId);
                  const isMadeToOrder = product.productType === 'MADE_TO_ORDER';

                  return (
                    <tr
                      key={prodId}
                      className="group transition-colors hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded border bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ borderColor: 'var(--nfi-border)' }}
                          >
                            {product.images?.[0]?.url ? (
                              <Image
                                unoptimized
                                width={40}
                                height={40}
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[9px] text-gray-400">No img</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--nfi-text)' }}>
                              {product.name}
                            </p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        {isMadeToOrder ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                            Made to Order
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                            Ready to Ship
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isMadeToOrder ? (
                          <span className="text-xs text-gray-500 font-medium">On-demand</span>
                        ) : (
                          <div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--nfi-text)' }}>
                              {stock} units
                            </span>
                            <span className="text-[11px] text-gray-400 block">Available</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isMadeToOrder ? (
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Custom Built
                          </span>
                        ) : stock > 5 ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        ) : stock > 0 ? (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            Low Stock (Restock)
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={product.status?.toLowerCase() ?? 'draft'} />
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs">
                        <button
                          onClick={() => openModal(product)}
                          className="font-medium hover:underline px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 border"
                          style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-primary)' }}
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div
            className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md border overflow-hidden"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--nfi-border)' }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>
                  Adjust Inventory
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
                  {selectedProduct.name} · <span className="font-mono">{selectedProduct.sku}</span>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustInventory} className="p-6 space-y-4">
              {modalError && (
                <div
                  className="p-3 rounded-md text-xs border"
                  style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}
                >
                  {modalError}
                </div>
              )}

              {/* Variant selector if product has variants */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <FormField label="Target Variant" htmlFor="varSelect">
                  <select
                    id="varSelect"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  >
                    {selectedProduct.variants.map((v) => (
                      <option key={v.variantId} value={v.variantId}>
                        {v.sku} ({v.attributes?.map((a) => `${a.name}: ${a.value}`).join(', ')})
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Adjustment Reason / Type" htmlFor="adjType">
                <select
                  id="adjType"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'RESTOCK' | 'ADJUSTMENT' | 'RETURN')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="RESTOCK">Restock (Received shipment)</option>
                  <option value="ADJUSTMENT">Manual Stock Correction</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </FormField>

              <FormField
                label="Quantity Delta (+ / −)"
                htmlFor="qty"
                required
                helpText="Use positive numbers to add stock (+10), negative to deduct (−3)."
              >
                <input
                  id="qty"
                  type="number"
                  required
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value)}
                  placeholder="e.g. 15 or -2"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Audit Note" htmlFor="note" helpText="Log reference or explanation">
                <input
                  id="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. PO #1042 batch arrival"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--nfi-border)' }}>
                <NfiButton type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </NfiButton>
                <NfiButton type="submit" variant="primary" size="sm" loading={submitting}>
                  Confirm Adjustment
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
