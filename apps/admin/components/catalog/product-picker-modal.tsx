'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CatalogService, Product, Category } from '@nfi/api-client';
import { NfiButton } from '@/components/ui/nfi-button';

export interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (selectedIds: string[]) => void;
  title?: string;
}

export function ProductPickerModal({
  isOpen,
  onClose,
  selectedIds,
  onSelect,
  title = 'Select Products for Collection',
}: ProductPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(selectedIds));

  useEffect(() => {
    if (isOpen) {
      setTempSelected(new Set(selectedIds));
      loadData();
    }
  }, [isOpen, selectedIds]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        CatalogService.adminListProducts({ limit: 100 }),
        CatalogService.listCategories(),
      ]);
      setProducts(prodRes.data?.items || []);
      setCategories(catRes.data?.items || (Array.isArray(catRes.data) ? catRes.data : []));
    } catch (err) {
      console.error('Failed to load products for picker:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleProduct = (id: string) => {
    const next = new Set(tempSelected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setTempSelected(next);
  };

  const handleConfirm = () => {
    onSelect(Array.from(tempSelected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border overflow-hidden"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--nfi-border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>
              {title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
              {tempSelected.size} products selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 bg-gray-50/50" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs py-2 pl-8 pr-3 rounded-md border bg-white"
              style={{ borderColor: 'var(--nfi-border)' }}
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-md border bg-white"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* List of Products */}
        <div className="flex-1 overflow-y-auto p-4 divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--nfi-primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>Loading catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
              No products found matching the criteria.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const id = prod.id || prod._id || '';
              const isSelected = tempSelected.has(id);
              const imgUrl = prod.images?.[0]?.url;

              return (
                <div
                  key={id}
                  onClick={() => toggleProduct(id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by container click
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <div
                    className="w-10 h-10 rounded border flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    {imgUrl ? (
                      <Image
                        unoptimized
                        width={40}
                        height={40}
                        src={imgUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--nfi-text)' }}>
                      {prod.name}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--nfi-text-secondary)' }}>
                      SKU: {prod.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                      ₹{prod.basePrice ? (prod.basePrice.amount / 100).toLocaleString('en-IN') : '—'}
                    </p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
                      style={{
                        backgroundColor: prod.status === 'PUBLISHED' ? 'rgba(46,125,50,0.1)' : 'rgba(100,116,139,0.1)',
                        color: prod.status === 'PUBLISHED' ? 'var(--nfi-success)' : 'var(--nfi-text-secondary)',
                      }}
                    >
                      {prod.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-white" style={{ borderColor: 'var(--nfi-border)' }}>
          <span className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
            {tempSelected.size} products chosen
          </span>
          <div className="flex gap-3">
            <NfiButton type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </NfiButton>
            <NfiButton type="button" variant="primary" size="sm" onClick={handleConfirm}>
              Apply Selection ({tempSelected.size})
            </NfiButton>
          </div>
        </div>
      </div>
    </div>
  );
}
