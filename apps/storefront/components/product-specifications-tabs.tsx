'use client';

import React, { useState } from 'react';

export interface ProductSpecificationsTabsProps {
  description: string;
  shortDescription?: string | undefined;
  material?: string | undefined;
  primaryMaterial?: string | undefined;
  frameMaterial?: string | undefined;
  dimensions?: { length: number; width: number; height: number; unit: string } | undefined;
  weight?: number | undefined;
  careInstructions?: string | undefined;
  warranty?: { durationMonths?: number; terms?: string } | undefined;
  specifications?: Record<string, unknown> | undefined;
  productType?: string | undefined;
}

export function ProductSpecificationsTabs({
  description,
  shortDescription,
  material,
  primaryMaterial,
  frameMaterial,
  dimensions,
  weight,
  careInstructions,
  warranty,
  specifications = {},
  productType,
}: ProductSpecificationsTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'care' | 'warranty'>('overview');

  const formattedDimensions = dimensions
    ? `${dimensions.length} × ${dimensions.width} × ${dimensions.height} ${dimensions.unit}`
    : null;

  return (
    <div className="w-full mt-16 pt-12 border-t border-[#EBE8E3]">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-[#EBE8E3] overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview & Story' },
          { id: 'specs', label: 'Dimensions & Specifications' },
          { id: 'care', label: 'Care & Maintenance' },
          { id: 'warranty', label: 'Warranty & Shipping' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-4 px-1 text-sm sm:text-base font-medium tracking-tight whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-6 text-neutral-700">
            {shortDescription && (
              <p className="text-lg font-serif italic text-neutral-900 leading-relaxed">
                &ldquo;{shortDescription}&rdquo;
              </p>
            )}
            <div className="prose prose-neutral max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-line">
              <p>{description}</p>
            </div>

            {/* Design Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3]">
                <h4 className="font-serif text-sm font-semibold text-neutral-900 mb-1">
                  Artisanal Joinery
                </h4>
                <p className="text-xs text-neutral-600 leading-normal">
                  Handcrafted mortise and tenon joints engineered for timeless durability and generational heirloom quality.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3]">
                <h4 className="font-serif text-sm font-semibold text-neutral-900 mb-1">
                  Ergonomic Comfort
                </h4>
                <p className="text-xs text-neutral-600 leading-normal">
                  High-resilience memory cushioning paired with multi-density pocket spring suspension for postural ease.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3]">
                <h4 className="font-serif text-sm font-semibold text-neutral-900 mb-1">
                  Eco-Certified Timbers
                </h4>
                <p className="text-xs text-neutral-600 leading-normal">
                  100% sustainably harvested solid hardwood, kiln-seasoned and treated with organic water-repellent sealers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specs' && (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-xs sm:text-sm">
              <div className="py-3 border-b border-neutral-100 flex justify-between">
                <span className="text-neutral-500 font-medium">Primary Material</span>
                <span className="text-neutral-900 font-semibold text-right">
                  {primaryMaterial || material || 'Solid Teak Wood & Top-Grain Leather'}
                </span>
              </div>

              <div className="py-3 border-b border-neutral-100 flex justify-between">
                <span className="text-neutral-500 font-medium">Frame & Structure</span>
                <span className="text-neutral-900 font-semibold text-right">
                  {frameMaterial || 'Kiln-Dried Hardwood with Reinforced Corner Blocks'}
                </span>
              </div>

              {formattedDimensions && (
                <div className="py-3 border-b border-neutral-100 flex justify-between">
                  <span className="text-neutral-500 font-medium">Dimensions (L × W × H)</span>
                  <span className="text-neutral-900 font-semibold text-right">
                    {formattedDimensions}
                  </span>
                </div>
              )}

              {weight && (
                <div className="py-3 border-b border-neutral-100 flex justify-between">
                  <span className="text-neutral-500 font-medium">Weight</span>
                  <span className="text-neutral-900 font-semibold text-right">{weight} kg</span>
                </div>
              )}

              <div className="py-3 border-b border-neutral-100 flex justify-between">
                <span className="text-neutral-500 font-medium">Fulfillment Type</span>
                <span className="text-neutral-900 font-semibold text-right">
                  {productType === 'MADE_TO_ORDER' ? 'Bespoke Made to Order' : 'Ready to Ship'}
                </span>
              </div>

              <div className="py-3 border-b border-neutral-100 flex justify-between">
                <span className="text-neutral-500 font-medium">Assembly</span>
                <span className="text-neutral-900 font-semibold text-right">
                  Free Expert Assembly Included
                </span>
              </div>

              {/* Dynamic specifications */}
              {specifications &&
                Object.entries(specifications).map(([key, val]) => {
                  if (val === null || val === undefined || val === '') return null;
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                  return (
                    <div key={key} className="py-3 border-b border-neutral-100 flex justify-between">
                      <span className="text-neutral-500 font-medium">{label}</span>
                      <span className="text-neutral-900 font-semibold text-right">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Care Instructions Tab */}
        {activeTab === 'care' && (
          <div className="max-w-3xl space-y-4 text-sm text-neutral-700">
            <p className="leading-relaxed">
              {careInstructions ||
                'To preserve the natural beauty and lustre of your piece, dust regularly with a clean, dry, lint-free microfiber cloth. Avoid direct exposure to prolonged sunlight and heat radiators.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Do&apos;s
                </span>
                <ul className="text-xs space-y-1.5 text-neutral-600 list-disc list-inside">
                  <li>Use coasters and heat pads under hot cups or pots.</li>
                  <li>Clean spills immediately by blotting with dry cloth.</li>
                  <li>Condition leather surfaces twice a year.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Don&apos;ts
                </span>
                <ul className="text-xs space-y-1.5 text-neutral-600 list-disc list-inside">
                  <li>Do not use chemical abrasive sprays or solvents.</li>
                  <li>Avoid placing near open air conditioning drafts.</li>
                  <li>Do not drag across floors; lift evenly by the base.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Warranty & Shipping Tab */}
        {activeTab === 'warranty' && (
          <div className="max-w-3xl space-y-6 text-sm text-neutral-700">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-serif font-semibold text-neutral-900 text-base mb-1">
                  {warranty?.durationMonths ? `${warranty.durationMonths} Months` : '10-Year'} Structural Frame Warranty
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {warranty?.terms ||
                    'Covers all structural timber frames, joints, and load-bearing legs against warping, termite intrusion, or manufacturing defects.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#EBE8E3] bg-white space-y-1">
                <h5 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                  White-Glove Delivery
                </h5>
                <p className="text-xs text-neutral-600 leading-normal">
                  Delivered in heavy-duty multi-layer crating. Our trained logistics technicians assemble and position the piece in your desired room.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#EBE8E3] bg-white space-y-1">
                <h5 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                  7-Day Replacement
                </h5>
                <p className="text-xs text-neutral-600 leading-normal">
                  In the rare event of transit damage, notify us within 7 days for a doorstep inspection and complimentary replacement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
