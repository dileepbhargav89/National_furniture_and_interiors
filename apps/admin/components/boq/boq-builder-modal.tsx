'use client';

import React, { useState, useMemo } from 'react';
import {
  QuotationItem,
  QuotationFinancialBreakdown,
  QuotationMilestoneScheduleItem,
  JOINERY_CORE_MATERIALS,
  JOINERY_FINISHES,
  HARDWARE_SYSTEM_OPTIONS,
  DEFAULT_ROOM_CATEGORIES,
} from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';

export interface BoqProjectContext {
  id: string;
  projectCode: string;
  clientName: string;
  clientPhone?: string | undefined;
  clientEmail?: string | undefined;
  propertyAddress: string;
  areaSqft: number;
  configuration?: string | undefined;
  existingQuotationsCount: number;
  expectedVersion: number;
}

interface BoqBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext: BoqProjectContext;
  initialBoqItems?: QuotationItem[] | undefined;
  onSaveQuotation: (payload: {
    expectedVersion: number;
    boqItems: QuotationItem[];
    financialBreakdown: QuotationFinancialBreakdown;
    milestoneSchedule: QuotationMilestoneScheduleItem[];
  }) => Promise<void>;
}

// ── Preset Templates ─────────────────────────────────────────────────────────

const PRESET_TEMPLATES = [
  {
    id: '3bhk-luxury-teak',
    name: '👑 Signature 3BHK Royal Teak Package',
    description:
      'Living room fluted paneling, modular kitchen with Blum hardware, master suite Burma teak wardrobes.',
    items: [
      {
        id: 'item-1',
        roomName: 'Living Room',
        category: 'TV_CONSOLE',
        description: 'Floating Burma Teak Media Console & Fluted Acoustic Wall Paneling',
        dimensions: { widthFt: 12, heightFt: 9, areaSqft: 108 },
        coreMaterial: 'CENTURY_BWP_710',
        finish: 'BURMA_TEAK_VENEER',
        hardwareBrand: 'BLUM',
        hardwareDetails: 'Blum Tip-On push-to-open drawers',
        ratePerUnit: 250000,
        quantity: 108,
        unitPrice: 250000,
        hardwareAddonPaise: 1250000,
        total: 28250000, // ₹2,82,500
      },
      {
        id: 'item-2',
        roomName: 'Gourmet Modular Kitchen',
        category: 'MODULAR_KITCHEN',
        description: 'L-Shaped Carcases with Caesarstone Quartz Top & Blum Aventos Lift-ups',
        dimensions: { widthFt: 18, heightFt: 7, areaSqft: 126 },
        coreMaterial: 'CENTURY_BWP_710',
        finish: 'EUROPEAN_ACRYLIC',
        hardwareBrand: 'BLUM',
        hardwareDetails: 'Blum Aventos HF Bi-fold + Tandembox Antaro drawers',
        ratePerUnit: 240000,
        quantity: 126,
        unitPrice: 240000,
        hardwareAddonPaise: 2500000,
        total: 32740000, // ₹3,27,400
      },
      {
        id: 'item-3',
        roomName: 'Master Bedroom Suite',
        category: 'WARDROBE',
        description: 'Full-Height 4-Door Wardrobe with Natural Smoked Oak Veneer',
        dimensions: { widthFt: 9, heightFt: 9.5, areaSqft: 85.5 },
        coreMaterial: 'CENTURY_BWP_710',
        finish: 'SMOKED_OAK_VENEER',
        hardwareBrand: 'HETTICH',
        hardwareDetails: 'Hettich Sensys 110° Soft-Close Hinges & Internal Drawer Pack',
        ratePerUnit: 260000,
        quantity: 85.5,
        unitPrice: 260000,
        hardwareAddonPaise: 850000,
        total: 23080000, // ₹2,30,800
      },
      {
        id: 'item-4',
        roomName: 'Dining & Crockery Area',
        category: 'CROCKERY_UNIT',
        description: 'Built-in Fluted Glass Crockery Credenza with Warm LED Backlighting',
        dimensions: { widthFt: 6, heightFt: 8, areaSqft: 48 },
        coreMaterial: 'GREENPANEL_HDHMR',
        finish: 'PU_LACQUER',
        hardwareBrand: 'HAFELE',
        hardwareDetails: 'Häfele Matrix Box & Loox Warm-White Joinery Strips',
        ratePerUnit: 230000,
        quantity: 48,
        unitPrice: 230000,
        hardwareAddonPaise: 700000,
        total: 11740000, // ₹1,17,400
      },
    ] as QuotationItem[],
  },
  {
    id: 'modular-kitchen-gourmet',
    name: '🍳 Gourmet Modular Kitchen (Blum Master Box)',
    description:
      'Island counter, acrylic shutters, quartz counters, Aventos bi-folds & tandem cutlery matrix.',
    items: [
      {
        id: 'item-k1',
        roomName: 'Gourmet Modular Kitchen',
        category: 'MODULAR_KITCHEN',
        description: 'Base & Wall Cabinetry in 100% Century BWP 710 Marine Ply',
        dimensions: { widthFt: 16, heightFt: 7, areaSqft: 112 },
        coreMaterial: 'CENTURY_BWP_710',
        finish: 'EUROPEAN_ACRYLIC',
        hardwareBrand: 'BLUM',
        hardwareDetails: 'Blum Tandembox Antaro soft-close drawer runners (45kg capacity)',
        ratePerUnit: 240000,
        quantity: 112,
        unitPrice: 240000,
        hardwareAddonPaise: 2500000,
        total: 29380000, // ₹2,93,800
      },
      {
        id: 'item-k2',
        roomName: 'Gourmet Modular Kitchen',
        category: 'MODULAR_KITCHEN',
        description: 'Kitchen Island & Breakfast Bar with Waterfall Quartz Edge',
        dimensions: { widthFt: 7, heightFt: 3, areaSqft: 21 },
        coreMaterial: 'CENTURY_BWP_710',
        finish: 'QUARTZ_SLAB',
        hardwareBrand: 'BLUM',
        hardwareDetails: 'Integrated under-counter spice & bottle pull-out racks',
        ratePerUnit: 305000,
        quantity: 21,
        unitPrice: 305000,
        hardwareAddonPaise: 1250000,
        total: 7655000, // ₹76,550
      },
    ] as QuotationItem[],
  },
];

function formatInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function BoqBuilderModal({
  isOpen,
  onClose,
  projectContext,
  initialBoqItems,
  onSaveQuotation,
}: BoqBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedRoom, setSelectedRoom] = useState<string>('Living Room');
  const [rooms, setRooms] = useState<string[]>([...DEFAULT_ROOM_CATEGORIES]);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [designFeePercent, setDesignFeePercent] = useState<number>(10);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Initialize BOQ items
  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (initialBoqItems && initialBoqItems.length > 0) {
      return initialBoqItems;
    }
    const defaultTemplate = PRESET_TEMPLATES[0];
    return defaultTemplate ? [...defaultTemplate.items] : [];
  });

  // Filter items by active room tab
  const roomItems = useMemo(() => {
    return items.filter((it) => (it.roomName || 'Living Room') === selectedRoom);
  }, [items, selectedRoom]);

  // Compute room totals map
  const roomTotals = useMemo(() => {
    const map: Record<string, { count: number; totalPaise: number }> = {};
    for (const r of rooms) {
      map[r] = { count: 0, totalPaise: 0 };
    }
    for (const item of items) {
      const r = item.roomName || 'Living Room';
      if (!map[r]) {
        map[r] = { count: 0, totalPaise: 0 };
      }
      const target = map[r];
      if (target) {
        target.count += 1;
        target.totalPaise += item.total;
      }
    }
    return map;
  }, [rooms, items]);

  // Financial Breakdown Computation
  const financialBreakdown: QuotationFinancialBreakdown = useMemo(() => {
    let baseJoinery = 0;
    let hardwareSum = 0;

    for (const item of items) {
      const itemHardware = item.hardwareAddonPaise || 0;
      hardwareSum += itemHardware;
      baseJoinery += Math.max(0, item.total - itemHardware);
    }

    const designFeeAmount = Math.round(((baseJoinery + hardwareSum) * designFeePercent) / 100);
    const taxableAmount = baseJoinery + hardwareSum + designFeeAmount;
    const gstRate = 18;
    const gstAmount = Math.round(taxableAmount * 0.18);
    const grandTotal = taxableAmount + gstAmount;

    return {
      baseJoineryAmount: baseJoinery,
      hardwareAmount: hardwareSum,
      designFeePercent,
      designFeeAmount,
      gstRate,
      gstAmount,
      grandTotal,
    };
  }, [items, designFeePercent]);

  // Milestone Schedule (10 / 40 / 40 / 10)
  const milestoneSchedule: QuotationMilestoneScheduleItem[] = useMemo(() => {
    const total = financialBreakdown.grandTotal;
    return [
      {
        stageName: '1. Advance Booking Token',
        percentage: 10,
        amount: Math.round(total * 0.1),
        dueTrigger: 'On 2D/3D Floor Plan Approval & Palette Signoff',
      },
      {
        stageName: '2. Factory Carcase Procurement',
        percentage: 40,
        amount: Math.round(total * 0.4),
        dueTrigger: 'Before Raw Timber & Century BWP Ply Board Cutting',
      },
      {
        stageName: '3. On-Site Joinery Erection',
        percentage: 40,
        amount: Math.round(total * 0.4),
        dueTrigger: 'Upon Delivery of Modular Units & Pre-Polish Erection',
      },
      {
        stageName: '4. Final Handover & 10-Yr Warranty',
        percentage: 10,
        amount: total - Math.round(total * 0.1) - Math.round(total * 0.4) * 2,
        dueTrigger: 'Joint Snag Audit, Deep Cleaning & 10-Year Warranty Handover',
      },
    ];
  }, [financialBreakdown.grandTotal]);

  if (!isOpen) return null;

  // ── Item Mutations ──

  const handleAddItem = () => {
    const defaultSubstrate = JOINERY_CORE_MATERIALS[0]!;
    const defaultFinish = JOINERY_FINISHES[0]!;
    const defaultHardware = HARDWARE_SYSTEM_OPTIONS[0]!;

    const widthFt = 8;
    const heightFt = 7;
    const areaSqft = widthFt * heightFt;
    const ratePerUnit = defaultSubstrate.ratePerSqftPaise + defaultFinish.addonPerSqftPaise;
    const hardwareAddonPaise = defaultHardware.basePremiumPaise;
    const total = areaSqft * ratePerUnit + hardwareAddonPaise;

    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      roomName: selectedRoom,
      category: 'CUSTOM',
      description: `Bespoke ${selectedRoom} Joinery Unit`,
      dimensions: { widthFt, heightFt, areaSqft },
      coreMaterial: defaultSubstrate.id,
      finish: defaultFinish.id,
      hardwareBrand: defaultHardware.id,
      hardwareDetails: `${defaultHardware.name} soft-closing mechanisms`,
      ratePerUnit,
      quantity: areaSqft,
      unitPrice: ratePerUnit,
      hardwareAddonPaise,
      total,
    };

    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<QuotationItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const updated = { ...it, ...patch };

        // Recalculate dimensions & totals if area or rates changed
        let width = updated.dimensions?.widthFt ?? 1;
        let height = updated.dimensions?.heightFt ?? 1;
        if (patch.dimensions?.widthFt !== undefined) width = patch.dimensions.widthFt;
        if (patch.dimensions?.heightFt !== undefined) height = patch.dimensions.heightFt;

        const areaSqft = width * height;
        const subMat =
          JOINERY_CORE_MATERIALS.find((m) => m.id === updated.coreMaterial) ??
          JOINERY_CORE_MATERIALS[0]!;
        const fin = JOINERY_FINISHES.find((f) => f.id === updated.finish) ?? JOINERY_FINISHES[0]!;
        const hard =
          HARDWARE_SYSTEM_OPTIONS.find((h) => h.id === updated.hardwareBrand) ??
          HARDWARE_SYSTEM_OPTIONS[0]!;

        const ratePerUnit = subMat.ratePerSqftPaise + fin.addonPerSqftPaise;
        const hardwareAddonPaise = hard.basePremiumPaise;
        const total = Math.round(areaSqft * ratePerUnit) + hardwareAddonPaise;

        return {
          ...updated,
          dimensions: {
            ...updated.dimensions,
            widthFt: width,
            heightFt: height,
            areaSqft,
          },
          ratePerUnit,
          unitPrice: ratePerUnit,
          quantity: areaSqft,
          hardwareAddonPaise,
          total,
        };
      }),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    setItems([...preset.items]);
  };

  const handleAddCustomRoom = () => {
    const trimmed = customRoomInput.trim();
    if (!trimmed || rooms.includes(trimmed)) return;
    setRooms([...rooms, trimmed]);
    setSelectedRoom(trimmed);
    setCustomRoomInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveQuotation({
        expectedVersion: projectContext.expectedVersion,
        boqItems: items,
        financialBreakdown,
        milestoneSchedule,
      });
      setSaveSuccessToast(true);
      setTimeout(() => {
        setSaveSuccessToast(false);
        onClose();
      }, 1200);
    } catch {
      // Handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `Greetings from National Furniture & Interiors! 🏛️\n\nWe have prepared your bespoke architectural interior quotation & Bill of Quantities (BOQ) for *${projectContext.clientName}*:\n\n• *Project Code:* ${projectContext.projectCode}\n• *Property:* ${projectContext.propertyAddress}\n• *Scope:* ${items.length} Custom Joinery Line Items across ${rooms.length} Rooms\n• *Core Substrate:* Century BWP 710 Marine Ply & Burma Teak\n• *Hardware:* Blum Austria / Hettich Germany Lifetime Systems\n• *Net Investment:* ${formatInr(financialBreakdown.grandTotal)} (incl. 18% GST)\n• *Warranty:* 10-Year BWP Delamination & Borer Guarantee\n\nWould you like to schedule an in-person 3D review at our Indiranagar Experience Studio?`;
    const cleanPhone = (projectContext.clientPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <div className="relative flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-2xl">
        {/* ── Top Executive Header Bar ── */}
        <div className="flex items-center justify-between border-b bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-xl font-black text-slate-950 shadow">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-wide text-white">
                  Architectural BOQ &amp; Quotation Engine
                </h3>
                <span className="rounded border border-amber-400/30 bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  Version {projectContext.expectedVersion}.0
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Patron: <strong className="text-white">{projectContext.clientName}</strong> ·{' '}
                {projectContext.propertyAddress} · {projectContext.areaSqft} sq.ft
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`rounded px-3 py-1 text-xs font-bold transition-all ${
                  activeTab === 'editor'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ✏️ Interactive Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`rounded px-3 py-1 text-xs font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📄 Luxury PDF Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Notification Banner (if saved) ── */}
        {saveSuccessToast && (
          <div className="bg-emerald-600 px-6 py-2 text-center text-xs font-bold text-white shadow-md">
            ✓ Quotation Version {projectContext.expectedVersion}.0 successfully generated &amp;
            synchronized!
          </div>
        )}

        {/* ── Main View Area ── */}
        {activeTab === 'editor' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Main Pane: Presets, Room Tabs & Line Items */}
            <div className="flex flex-1 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50/50 p-6">
              {/* Presets Bar */}
              <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    ⚡ 1-Click Architectural Presets
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Instantly populate room packages with standardized joinery rates
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLoadPreset(p.id)}
                      className="shadow-2xs rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-all hover:bg-amber-100/60 hover:text-amber-950"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Categories Tab Strip */}
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                  {rooms.map((r) => {
                    const stats = roomTotals[r] ?? { count: 0, totalPaise: 0 };
                    const isCurrent = selectedRoom === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoom(r)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{r}</span>
                        {stats.count > 0 && (
                          <span
                            className={`py-0.2 rounded-full px-1.5 text-[10px] font-extrabold ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {stats.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Room */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    placeholder="New Room..."
                    className="h-8 w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRoom}
                    className="h-8 rounded-lg bg-slate-200 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-300"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Room Line Items List */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {selectedRoom} Specifications ({roomItems.length} items)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="shadow-xs rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 transition-all hover:bg-amber-400"
                  >
                    + Add Joinery Item to {selectedRoom}
                  </button>
                </div>

                {roomItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-xs font-bold text-slate-700">
                      No specifications added for {selectedRoom}.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Click &ldquo;+ Add Joinery Item&rdquo; above or apply an architectural preset.
                    </p>
                  </div>
                ) : (
                  roomItems.map((item) => (
                    <div
                      key={item.id}
                      className="shadow-2xs relative rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300"
                    >
                      {/* Row 1: Item Name & Category */}
                      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Description &amp; Joinery Element
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, { description: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Category
                          </label>
                          <select
                            value={item.category || 'CUSTOM'}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, { category: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                            <option value="WARDROBE">Wardrobe &amp; Closet</option>
                            <option value="TV_CONSOLE">TV &amp; Media Console</option>
                            <option value="WALL_PANELING">Fluted Wall Paneling</option>
                            <option value="CROCKERY_UNIT">Crockery Unit</option>
                            <option value="VANITY">Bathroom Vanity</option>
                            <option value="SHOE_RACK">Foyer Shoe Cabinet</option>
                            <option value="LOOSE_FURNITURE">Bespoke Loose Furniture</option>
                            <option value="CUSTOM">Custom Architectural Fit-out</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Dimensions & Area */}
                      <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-2.5 text-xs sm:grid-cols-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Width (ft)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={item.dimensions?.widthFt || 1}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, {
                                dimensions: {
                                  ...item.dimensions,
                                  widthFt: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-200 bg-white p-1 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Height (ft)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={item.dimensions?.heightFt || 1}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, {
                                dimensions: {
                                  ...item.dimensions,
                                  heightFt: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="mt-1 w-full rounded border border-slate-200 bg-white p-1 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Total Area
                          </label>
                          <div className="mt-1.5 text-xs font-extrabold text-slate-900">
                            {item.dimensions?.areaSqft || 0} sq.ft
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500">
                            Rate / Sq.Ft
                          </label>
                          <div className="mt-1.5 text-xs font-bold text-amber-900">
                            {formatInr(item.unitPrice)}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Substrate, Finish, Hardware & Line Total */}
                      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Core Substrate
                          </label>
                          <select
                            value={item.coreMaterial || 'CENTURY_BWP_710'}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, { coreMaterial: e.target.value })
                            }
                            className="mt-1 w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800"
                          >
                            {JOINERY_CORE_MATERIALS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({formatInr(m.ratePerSqftPaise)}/sqft)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Surface Finish
                          </label>
                          <select
                            value={item.finish || 'BURMA_TEAK_VENEER'}
                            onChange={(e) => handleUpdateItem(item.id!, { finish: e.target.value })}
                            className="mt-1 w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800"
                          >
                            {JOINERY_FINISHES.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} (+{formatInr(f.addonPerSqftPaise)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Hardware System
                          </label>
                          <select
                            value={item.hardwareBrand || 'BLUM'}
                            onChange={(e) =>
                              handleUpdateItem(item.id!, { hardwareBrand: e.target.value })
                            }
                            className="mt-1 w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-800"
                          >
                            {HARDWARE_SYSTEM_OPTIONS.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} (+{formatInr(h.basePremiumPaise)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col justify-between text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id!)}
                              className="text-[11px] font-bold text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500">Item Total</span>
                            <span className="text-sm font-black text-slate-900">
                              {formatInr(item.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Summary Sidebar: Live Calculations, Taxes & Save */}
            <div className="flex w-80 flex-col justify-between overflow-y-auto border-l border-slate-200 bg-white p-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Financial Breakdown &amp; GST
                </h4>

                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Joinery Subtotal:</span>
                    <span className="font-bold text-slate-900">
                      {formatInr(financialBreakdown.baseJoineryAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Architectural Hardware:</span>
                    <span className="font-bold text-slate-900">
                      {formatInr(financialBreakdown.hardwareAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-600">
                    <span>3D Concept Fee ({designFeePercent}%):</span>
                    <span className="font-bold text-slate-900">
                      {formatInr(financialBreakdown.designFeeAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={designFeePercent}
                      onChange={(e) => setDesignFeePercent(parseInt(e.target.value, 10))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
                    />
                    <span className="w-8 text-right text-[11px] font-bold text-slate-700">
                      {designFeePercent}%
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-600">
                    <span>GST (18% CGST/SGST):</span>
                    <span className="font-bold text-slate-900">
                      {formatInr(financialBreakdown.gstAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm">
                    <span className="font-extrabold text-slate-900">Net Quotation:</span>
                    <span className="text-base font-black text-amber-900">
                      {formatInr(financialBreakdown.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Milestone Schedule */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold uppercase text-slate-500">
                    4-Stage Payment Milestones
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    {milestoneSchedule.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{m.stageName}</span>
                          <span className="block text-[10px] text-slate-500">
                            ({m.percentage}%)
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">{formatInr(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp & Print Shortcuts */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <span>💬</span>
                    <span>Share Summary on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <NfiButton
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  loading={isSaving}
                  className="w-full justify-center bg-slate-900 text-xs font-bold text-amber-400 hover:bg-slate-800"
                >
                  ✓ Save Quotation (v{projectContext.expectedVersion}.0)
                </NfiButton>
                <NfiButton
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="w-full justify-center text-xs"
                >
                  Cancel
                </NfiButton>
              </div>
            </div>
          </div>
        ) : (
          /* ── Tab 2: Luxury PDF Print Preview (Printable Letterhead) ── */
          <div className="flex flex-1 justify-center overflow-y-auto bg-slate-200 p-8">
            <div className="print-container flex min-h-[297mm] w-full max-w-[210mm] flex-col justify-between rounded-sm border border-slate-300 bg-white p-12 shadow-xl">
              <div>
                {/* Print Sheet Top Bar (hidden on print) */}
                <div className="mb-6 flex items-center justify-between border-b pb-4 print:hidden">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      📄 Executive Print Preview (A4 Formatted)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Uses official National Furniture &amp; Interiors brand letterhead with
                      warranty seals.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-amber-400 shadow hover:bg-slate-800"
                    >
                      🖨️ Print / Save to PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Letterhead Header */}
                <div className="mb-6 flex items-start justify-between border-t-4 border-amber-500 pt-6">
                  <div>
                    <h1 className="text-xl font-black tracking-wider text-slate-900">
                      NATIONAL FURNITURE &amp; INTERIORS
                    </h1>
                    <p className="mt-0.5 text-xs font-semibold text-amber-800">
                      Bespoke Architectural Joinery · 40,000 Sq.Ft Precision Factory
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      12th Main Road, Indiranagar, Bengaluru, Karnataka 560038
                      <br />
                      GSTIN: 29AABCN1234F1Z8 | CIN: U36100KA2020PTC123456
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-400">
                      BILL OF QUANTITIES (BOQ)
                    </span>
                    <p className="mt-2 text-xs font-bold text-slate-800">
                      Version {projectContext.expectedVersion}.0
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Date:{' '}
                      {new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] text-slate-500">Validity: 30 Days</p>
                  </div>
                </div>

                {/* Client & Project Particulars */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-amber-800">
                      Patron Details
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {projectContext.clientName}
                    </p>
                    <p className="mt-0.5 text-slate-600">{projectContext.propertyAddress}</p>
                    <p className="text-[11px] text-slate-500">
                      {projectContext.clientPhone}{' '}
                      {projectContext.clientEmail ? `· ${projectContext.clientEmail}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-amber-800">
                      Project Particulars
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      Code: {projectContext.projectCode}
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      Scope: {projectContext.areaSqft} sq.ft{' '}
                      {projectContext.configuration || 'Full Residence'}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Guarantee: 45-Day Handover · 10-Yr BWP Marine Ply Warranty
                    </p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-900 font-bold text-white">
                      <tr>
                        <th className="px-3 py-2 text-[10px] uppercase">Room / Element</th>
                        <th className="px-3 py-2 text-[10px] uppercase">Specifications</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase">Area / Qty</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase">Rate</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase">Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((it, idx) => (
                        <tr
                          key={it.id || idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                        >
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {it.roomName}
                            <span className="block text-[11px] font-normal text-slate-600">
                              {it.description}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">
                            {it.coreMaterial
                              ? `Substrate: ${it.coreMaterial.replace(/_/g, ' ')}`
                              : ''}
                            {it.finish ? ` · Finish: ${it.finish.replace(/_/g, ' ')}` : ''}
                            {it.hardwareBrand ? ` · Hardware: ${it.hardwareBrand}` : ''}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">
                            {it.dimensions?.areaSqft
                              ? `${it.dimensions.areaSqft} sqft`
                              : `${it.quantity} nos`}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">
                            {formatInr(it.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            {formatInr(it.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Box */}
                <div className="mb-6 flex justify-end">
                  <div className="w-80 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Joinery:</span>
                      <span className="font-bold text-slate-900">
                        {formatInr(financialBreakdown.baseJoineryAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Architectural Hardware:</span>
                      <span className="font-bold text-slate-900">
                        {formatInr(financialBreakdown.hardwareAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>3D Concept &amp; Management ({designFeePercent}%):</span>
                      <span className="font-bold text-slate-900">
                        {formatInr(financialBreakdown.designFeeAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% CGST/SGST):</span>
                      <span className="font-bold text-slate-900">
                        {formatInr(financialBreakdown.gstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-black">
                      <span className="text-slate-900">Net Quotation Value:</span>
                      <span className="text-amber-900">
                        {formatInr(financialBreakdown.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Milestone Schedule & Terms */}
                <div className="mb-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-700">
                    Architectural Payment Schedule (4 Milestones)
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    {milestoneSchedule.map((m, idx) => (
                      <div key={idx} className="rounded border bg-white p-2 text-center">
                        <span className="block font-bold text-slate-900">{m.percentage}%</span>
                        <span className="block text-[10px] font-semibold text-slate-500">
                          {m.stageName}
                        </span>
                        <span className="mt-1 block text-[11px] font-bold text-amber-900">
                          {formatInr(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signatures & Quality Assurance */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="mb-6 text-[10px] leading-relaxed text-slate-500">
                  * <strong>Quality Warranty:</strong> All Century BWP 710 marine plywood and Burma
                  teak carries a 10-year manufacturer replacement warranty against borer, termite,
                  and delamination. Blum Austria and Hettich Germany mechanisms carry lifetime
                  operational warranties. Turnkey execution timeline of 45 days commences after
                  final 3D photorealistic render approval and 1st mobilization advance.
                </div>

                <div className="flex items-end justify-between pt-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      NATIONAL FURNITURE &amp; INTERIORS
                    </p>
                    <p className="text-[11px] text-slate-500">Principal Design Architect</p>
                    <div className="mt-8 h-0.5 w-44 bg-slate-300" />
                    <p className="mt-1 text-[10px] text-slate-400">Authorized Signatory</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{projectContext.clientName}</p>
                    <p className="text-[11px] text-slate-500">Patron Sign-off &amp; Acceptance</p>
                    <div className="mt-8 h-0.5 w-44 bg-slate-300" />
                    <p className="mt-1 text-[10px] text-slate-400">Client Signature / E-Approval</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
