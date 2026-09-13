'use client';

import React, { useState } from 'react';
import { ProductVariant } from '@nfi/api-client';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';

export interface VariantManagerProps {
  variants: ProductVariant[];
  baseSku?: string;
  basePrice?: number; // In rupees
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({
  variants,
  baseSku = '',
  basePrice = 0,
  onChange,
}: VariantManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [attrName1, setAttrName1] = useState('Color');
  const [attrVal1, setAttrVal1] = useState('');
  const [attrName2, setAttrName2] = useState('Size');
  const [attrVal2, setAttrVal2] = useState('');
  const [customSku, setCustomSku] = useState('');
  const [priceOverride, setPriceOverride] = useState('');

  const handleOpenAdd = () => {
    setAttrVal1('');
    setAttrVal2('');
    setCustomSku(baseSku ? `${baseSku}-VAR${variants.length + 1}` : '');
    setPriceOverride('');
    setIsAdding(true);
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrVal1 && !attrVal2) {
      alert('Please enter at least one attribute value.');
      return;
    }

    const attributes: { name: string; value: string }[] = [];
    if (attrName1 && attrVal1) attributes.push({ name: attrName1, value: attrVal1 });
    if (attrName2 && attrVal2) attributes.push({ name: attrName2, value: attrVal2 });

    const sku = customSku || `${baseSku || 'SKU'}-${Date.now().toString().slice(-4)}`;
    const parsedPrice = priceOverride ? Math.round(parseFloat(priceOverride) * 100) : null;

    const newVariant: ProductVariant = {
      variantId: `var_${Date.now()}`,
      sku,
      attributes,
      priceOverride: parsedPrice ? { amount: parsedPrice, currency: 'INR' } : null,
      images: [],
      isActive: true,
    };

    onChange([...variants, newVariant]);
    setIsAdding(false);
  };

  const handleRemoveVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const handleToggleActive = (index: number) => {
    const updated = variants.map((v, i) => (i === index ? { ...v, isActive: !v.isActive } : v));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
            Product Variants
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
            Add options like Color, Finish, Material, or Dimensions.
          </p>
        </div>
        {!isAdding && (
          <NfiButton type="button" variant="secondary" size="sm" onClick={handleOpenAdd}>
            + Add Variant
          </NfiButton>
        )}
      </div>

      {/* Add Variant Form */}
      {isAdding && (
        <form onSubmit={handleSaveVariant} className="p-4 rounded-lg border bg-gray-50/70 space-y-4" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nfi-text)' }}>
              New Variant Details
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="text-[11px] font-medium text-gray-500">Attr Name</label>
                <input
                  type="text"
                  value={attrName1}
                  onChange={(e) => setAttrName1(e.target.value)}
                  placeholder="e.g. Color"
                  className={inputClassName}
                  style={inputStyle}
                />
              </div>
              <div className="w-2/3">
                <label className="text-[11px] font-medium text-gray-500">Option Value</label>
                <input
                  type="text"
                  value={attrVal1}
                  onChange={(e) => setAttrVal1(e.target.value)}
                  placeholder="e.g. Walnut"
                  className={inputClassName}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="text-[11px] font-medium text-gray-500">Attr Name</label>
                <input
                  type="text"
                  value={attrName2}
                  onChange={(e) => setAttrName2(e.target.value)}
                  placeholder="e.g. Size"
                  className={inputClassName}
                  style={inputStyle}
                />
              </div>
              <div className="w-2/3">
                <label className="text-[11px] font-medium text-gray-500">Option Value</label>
                <input
                  type="text"
                  value={attrVal2}
                  onChange={(e) => setAttrVal2(e.target.value)}
                  placeholder="e.g. 3-Seater"
                  className={inputClassName}
                  style={inputStyle}
                />
              </div>
            </div>

            <FormField label="Variant SKU" htmlFor="var-sku" helpText="Defaults to product SKU suffix">
              <input
                id="var-sku"
                type="text"
                value={customSku}
                onChange={(e) => setCustomSku(e.target.value)}
                placeholder="e.g. FUR-001-WLN-3S"
                className={inputClassName}
                style={inputStyle}
              />
            </FormField>

            <FormField
              label="Price Override (₹)"
              htmlFor="var-price"
              helpText={basePrice ? `Leave empty to use base price ₹${basePrice}` : 'Optional price override'}
            >
              <input
                id="var-price"
                type="number"
                min="0"
                step="0.01"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                placeholder="e.g. 35000"
                className={inputClassName}
                style={inputStyle}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <NfiButton type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </NfiButton>
            <NfiButton type="submit" variant="primary" size="sm">
              Save Variant
            </NfiButton>
          </div>
        </form>
      )}

      {/* Variants List Table */}
      {variants.length === 0 ? (
        <div className="p-6 text-center border rounded-lg border-dashed text-xs text-gray-400" style={{ borderColor: 'var(--nfi-border)' }}>
          No variants defined. This product will be sold as a single default configuration.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b" style={{ borderColor: 'var(--nfi-border)' }}>
              <tr>
                <th className="px-4 py-2.5 font-medium text-gray-600">Attributes</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">SKU</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">Price</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {variants.map((v, idx) => (
                <tr key={v.variantId || idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {v.attributes?.map((attr, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-2 py-0.5 rounded text-[11px] bg-white border font-medium text-gray-700"
                          style={{ borderColor: 'var(--nfi-border)' }}
                        >
                          {attr.name}: <strong>{attr.value}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">{v.sku}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {v.priceOverride ? `₹${(v.priceOverride.amount / 100).toLocaleString('en-IN')}` : <span className="text-gray-400 font-normal">Base Price</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        v.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {v.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
