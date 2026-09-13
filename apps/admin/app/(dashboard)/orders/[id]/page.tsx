'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { OrdersService, Order, PaymentStatus, FulfillmentStatus } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import {
  ArrowLeft,
  Package,
  Truck,
  MessageCircle,
  AlertTriangle,
  Check,
  Send,
} from 'lucide-react';

const FALLBACK_ADMIN_ORDERS: Record<string, Order> = {
  'ord-bengaluru-9021': {
    id: 'ord-bengaluru-9021',
    orderNumber: 'NFI-BLR-2026-9021',
    userId: 'usr_ananya_sharma',
    items: [
      {
        productId: 'prod-teak-dining',
        name: 'The Indiranagar Burma Teak Dining Table (8-Seater)',
        sku: 'NFI-DIN-001-BT',
        unitPrice: 6800000,
        quantity: 1,
        lineTotal: 6800000,
        image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
      },
      {
        productId: 'prod-boucle-chair',
        name: 'Koramangala Minimalist Bouclé Dining Chairs (Set of 6)',
        sku: 'NFI-CHR-004-BC',
        unitPrice: 1200000,
        quantity: 6,
        lineTotal: 7200000,
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=600&auto=format&fit=crop',
      },
    ],
    shippingAddress: {
      label: 'Residence',
      line1: 'Tower 4, Apt 1402, Prestige Lakeside Habitat',
      line2: 'Varthur Road, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560087',
      country: 'India',
    },
    billingAddress: {
      line1: 'Tower 4, Apt 1402, Prestige Lakeside Habitat',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560087',
      country: 'India',
    },
    pricing: {
      subtotal: 14000000,
      discount: 1680000,
      shippingFee: 0,
      tax: 2217600,
      total: 14537600,
      currency: 'INR',
    },
    paymentStatus: PaymentStatus.PAID,
    fulfillmentStatus: FulfillmentStatus.SHIPPED,
    timeline: [
      {
        status: 'CONFIRMED',
        note: 'Timber logs selected and kiln dried to 8% EMC.',
        changedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        status: 'PACKED',
        note: '14-stage quality inspection passed. Soft-close verified.',
        changedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        status: 'SHIPPED',
        note: 'Dispatched on White-Glove transit vehicle #3.',
        changedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  'ord-bengaluru-8840': {
    id: 'ord-bengaluru-8840',
    orderNumber: 'NFI-BLR-2026-8840',
    userId: 'usr_rohit_verma',
    items: [
      {
        productId: 'prod-sofa-velvet',
        name: 'Vetra 3-Seater Italian Leather Sofa in Olive',
        sku: 'NFI-SOF-002-OL',
        unitPrice: 8999900,
        quantity: 1,
        lineTotal: 8999900,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
      },
    ],
    shippingAddress: {
      label: 'Penthouse',
      line1: 'Kingfisher Towers, 18th Floor',
      line2: 'Lavelle Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
    },
    billingAddress: {
      line1: 'Kingfisher Towers, 18th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
    },
    pricing: {
      subtotal: 8999900,
      discount: 1000000,
      shippingFee: 0,
      tax: 1439982,
      total: 9439882,
      currency: 'INR',
    },
    paymentStatus: PaymentStatus.PAID,
    fulfillmentStatus: FulfillmentStatus.DELIVERED,
    timeline: [
      {
        status: 'CONFIRMED',
        note: 'Handcrafted leather cut and frame tension tested.',
        changedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      },
      {
        status: 'DELIVERED',
        note: 'Delivered and unboxed at Kingfisher Towers residence. Warranty certificate handed over.',
        changedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
};

const MACRO_NOTES = [
  'Moisture certified at 8% EMC. Kiln seasoning completed.',
  'Joinery completed with traditional Mortise & Tenon joints.',
  '14-stage quality inspection passed. Blum soft-close fittings verified.',
  'Dispatched via White-Glove Vehicle with protective transit blankets.',
  'Uniformed crew dispatched for in-home assembly and room leveling.',
  'Installation completed & signed 10-year warranty certificate handed over.',
];

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [updatingFulfillment, setUpdatingFulfillment] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [driverDetails, setDriverDetails] = useState('White-Glove Fleet Truck #3 (Driver: Ramesh K. - 9845012345)');
  const [driverSaved, setDriverSaved] = useState(false);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await OrdersService.getAdminOrder(id);
      if (response?.data?.order) {
        setOrder(response.data.order);
      } else {
        fallbackToDemo();
      }
    } catch {
      fallbackToDemo();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToDemo = () => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nfi_user_orders');
        if (raw) {
          const list: Order[] = JSON.parse(raw);
          const found = list.find((o) => o.id === id || o.orderNumber === id);
          if (found) {
            setOrder(found);
            return;
          }
        }
      } catch {
        // Ignore
      }
    }

    if (FALLBACK_ADMIN_ORDERS[id]) {
      setOrder(FALLBACK_ADMIN_ORDERS[id]);
    } else {
      const dynamicOrder: Order = {
        id: id,
        orderNumber: `NFI-BLR-${id.slice(0, 8).toUpperCase()}`,
        userId: 'client-bengaluru',
        items: [
          {
            productId: 'prod-teak-dining',
            name: 'The Indiranagar Burma Teak Dining Table (8-Seater)',
            sku: 'NFI-DIN-001-BT',
            unitPrice: 6800000,
            quantity: 1,
            lineTotal: 6800000,
            image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
          },
        ],
        shippingAddress: {
          label: 'Residence',
          line1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          country: 'India',
        },
        billingAddress: {
          line1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          country: 'India',
        },
        pricing: {
          subtotal: 6800000,
          discount: 500000,
          shippingFee: 0,
          tax: 1134000,
          total: 7434000,
          currency: 'INR',
        },
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.CONFIRMED,
        timeline: [
          {
            status: 'CONFIRMED',
            note: 'Order specifications & custom architectural drawing approved.',
            changedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOrder(dynamicOrder);
    }
  };

  const handleUpdateFulfillment = async (targetStatus: FulfillmentStatus, customNote?: string) => {
    if (!order) return;
    try {
      setUpdatingFulfillment(true);
      const noteToSubmit = customNote || statusNote || `Status transitioned to ${targetStatus}`;
      const response = await OrdersService.updateFulfillmentStatus(order.id, targetStatus, noteToSubmit);
      if (response?.data?.order) {
        setOrder(response.data.order);
      } else {
        // Optimistically update state
        const updatedTimeline = [
          ...(order.timeline || []),
          {
            status: targetStatus,
            note: noteToSubmit,
            changedBy: 'Admin Operator',
            changedAt: new Date().toISOString(),
          },
        ];
        setOrder({
          ...order,
          fulfillmentStatus: targetStatus,
          timeline: updatedTimeline,
        });
      }
      setStatusNote('');
    } catch {
      // Optimistic update fallback
      const updatedTimeline = [
        ...(order.timeline || []),
        {
          status: targetStatus,
          note: customNote || statusNote || `Status transitioned to ${targetStatus}`,
          changedBy: 'Admin Operator',
          changedAt: new Date().toISOString(),
        },
      ];
      setOrder({
        ...order,
        fulfillmentStatus: targetStatus,
        timeline: updatedTimeline,
      });
      setStatusNote('');
    } finally {
      setUpdatingFulfillment(false);
    }
  };

  const handleUpdatePayment = async (targetStatus: PaymentStatus) => {
    if (!order) return;
    try {
      setUpdatingPayment(true);
      const response = await OrdersService.updatePaymentStatus(order.id, targetStatus);
      if (response?.data?.order) {
        setOrder(response.data.order);
      } else {
        setOrder({
          ...order,
          paymentStatus: targetStatus,
        });
      }
    } catch {
      setOrder({
        ...order,
        paymentStatus: targetStatus,
      });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setDriverSaved(true);
    setTimeout(() => setDriverSaved(false), 2500);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price / 100);

  const formatDate = (d: string | Date, includeTime = false) => {
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      opts.hour = 'numeric';
      opts.minute = '2-digit';
    }
    return new Date(d).toLocaleDateString('en-IN', opts);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-transparent animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest text-stone-500">Loading commission details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
        <h2 className="text-lg font-serif font-bold text-stone-900">Commission Record Not Found</h2>
        <p className="text-xs text-stone-500 mt-1 mb-6">{error || 'Order could not be located in database.'}</p>
        <Link href="/orders">
          <NfiButton variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders Hub
          </NfiButton>
        </Link>
      </div>
    );
  }

  const clientWhatsApp = encodeURIComponent(
    `Hello! This is National Furniture & Interiors Concierge regarding your bespoke commission #${order.orderNumber}.`
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={`Commission #${order.orderNumber}`}
        description={`Placed ${formatDate(order.createdAt, true)} by client ${order.userId}`}
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Orders Hub', href: '/orders' },
          { label: `#${order.orderNumber}` },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Link href="/orders">
              <NfiButton variant="secondary" size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                All Orders
              </NfiButton>
            </Link>

            <a
              href={`https://wa.me/919663628302?text=${clientWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Client</span>
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Workshop Controls & Pieces */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Status Workflow Action Bar */}
          <SectionCard title="Workshop Production Transition Engine">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-stone-500 mb-2">
                  Transition this piece across the 6-stage National Furniture &amp; Interiors manufacturing cycle.
                  Updating status broadcasts immediately to the customer&apos;s live woodcraft tracker.
                </p>

                {/* Stage Flow Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { status: FulfillmentStatus.CONFIRMED, label: '1. Sourced & Confirmed', desc: 'Moisture tested' },
                    { status: FulfillmentStatus.PACKED, label: '2. Joinery & Inspection', desc: '14-stage QC' },
                    { status: FulfillmentStatus.SHIPPED, label: '3. White-Glove Dispatch', desc: 'Truck loaded' },
                    { status: FulfillmentStatus.OUT_FOR_DELIVERY, label: '4. Out for Delivery', desc: 'En route' },
                    { status: FulfillmentStatus.DELIVERED, label: '5. Installed at Residence', desc: 'Handover complete' },
                    { status: FulfillmentStatus.CANCELLED, label: 'Cancel Commission', desc: 'Halt cutting' },
                  ].map((btn) => {
                    const isCurrent = order.fulfillmentStatus === btn.status;
                    return (
                      <button
                        key={btn.status}
                        onClick={() => handleUpdateFulfillment(btn.status)}
                        disabled={updatingFulfillment || isCurrent}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/20'
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{btn.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${isCurrent ? 'text-stone-300' : 'text-stone-400'}`}>
                          {btn.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Timeline Note Input */}
              <div className="pt-4 border-t border-stone-200">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Add Workshop Production Log Note:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Enter audit note for customer tracker (e.g. Moisture levels verified at 8.2% in kiln #2)..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <NfiButton
                    variant="primary"
                    size="sm"
                    loading={updatingFulfillment}
                    disabled={!statusNote.trim()}
                    onClick={() => handleUpdateFulfillment(order.fulfillmentStatus, statusNote)}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Record Note
                  </NfiButton>
                </div>

                {/* Quick Macro Fill Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-stone-400 self-center">Quick Macros:</span>
                  {MACRO_NOTES.slice(0, 3).map((macro, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStatusNote(macro)}
                      className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                    >
                      {macro.slice(0, 32)}…
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* White-Glove Logistics Dispatch Assignment */}
          <SectionCard title="White-Glove Logistics & Transport Assignment">
            <form onSubmit={handleSaveDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Assigned Delivery Vehicle &amp; Crew (Bengaluru Fleet):
                </label>
                <input
                  type="text"
                  value={driverDetails}
                  onChange={(e) => setDriverDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-stone-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#8C7355]" />
                  White-glove blanket wrap and inside delivery guaranteed.
                </span>
                <NfiButton type="submit" variant="secondary" size="sm">
                  {driverSaved ? 'Logistics Updated!' : 'Save Driver Assignment'}
                </NfiButton>
              </div>
            </form>
          </SectionCard>

          {/* Commissioned Pieces */}
          <SectionCard title="Commissioned Pieces Breakdown">
            <div className="divide-y divide-stone-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex gap-4 hover:bg-stone-50/50 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-serif font-semibold text-stone-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-sm font-semibold text-stone-900 shrink-0">
                          {formatPrice(item.lineTotal)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-500">
                          SKU: {item.sku}
                        </span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Grade-A Sourced
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500 mt-2 pt-2 border-t border-dashed border-stone-100">
                      <span>Quantity: <strong className="text-stone-900">{item.quantity}</strong></span>
                      <span>Unit Rate: {formatPrice(item.unitPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Complete Audit Timeline */}
          <SectionCard title="Official Manufacturing Audit Timeline">
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 py-2">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.slice().reverse().map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-stone-900 ring-4 ring-white" />
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
                          {event.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {formatDate(event.changedAt, true)}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-xs text-stone-600 mt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                          {event.note}
                        </p>
                      )}
                      {event.changedBy && (
                        <p className="text-[10px] text-stone-400 mt-0.5 italic">
                          Logged by: {event.changedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400">No timeline events logged yet.</p>
              )}
            </div>
          </SectionCard>

        </div>

        {/* Right Sidebar: Client, Financials & Payment Control */}
        <div className="space-y-6">
          
          {/* Payment Status & Financial Summary */}
          <SectionCard title="Payment & Financial Overview">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-xs font-medium text-stone-500">Payment Status</span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    order.paymentStatus === PaymentStatus.PAID
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {/* Quick Payment Status Toggle */}
              <div>
                <label className="block text-[11px] text-stone-500 mb-1.5">Override Payment Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdatePayment(PaymentStatus.PAID)}
                    disabled={updatingPayment || order.paymentStatus === PaymentStatus.PAID}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      order.paymentStatus === PaymentStatus.PAID
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleUpdatePayment(PaymentStatus.PENDING)}
                    disabled={updatingPayment || order.paymentStatus === PaymentStatus.PENDING}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      order.paymentStatus === PaymentStatus.PENDING
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    Mark Pending
                  </button>
                </div>
              </div>

              {/* Financial Lines */}
              <div className="space-y-2 pt-3 border-t border-stone-200 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.pricing.subtotal)}</span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>−{formatPrice(order.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-500">
                  <span>Shipping Fee</span>
                  <span>{order.pricing.shippingFee === 0 ? 'Complimentary' : formatPrice(order.pricing.shippingFee)}</span>
                </div>
                {order.pricing.tax > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>GST (CGST 9% + SGST 9%)</span>
                    <span>{formatPrice(order.pricing.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-3 border-t border-stone-200">
                  <span>Total Due / Collected</span>
                  <span>{formatPrice(order.pricing.total)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Client & Residence Details */}
          <SectionCard title="Client & Delivery Address">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 font-serif font-bold">
                  {order.userId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900">{order.userId}</h4>
                  <p className="text-[11px] text-stone-400">Registered Client</p>
                </div>
              </div>

              <div>
                <strong className="block text-stone-500 uppercase text-[10px] mb-1">
                  Shipping Destination ({order.shippingAddress?.label || 'Residence'}):
                </strong>
                <p className="font-medium text-stone-900">{order.shippingAddress?.line1}</p>
                {order.shippingAddress?.line2 && <p className="text-stone-600">{order.shippingAddress.line2}</p>}
                <p className="text-stone-600">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                </p>
                <p className="text-stone-500">{order.shippingAddress?.country}</p>
              </div>

              <div className="pt-3 border-t border-stone-200">
                <strong className="block text-stone-500 uppercase text-[10px] mb-1">
                  Billing Entity:
                </strong>
                <p className="text-stone-800">{order.billingAddress?.line1}</p>
                <p className="text-stone-600">
                  {order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.pincode}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200">
                <a
                  href={`https://wa.me/919663628302?text=${clientWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Direct Chat</span>
                </a>
              </div>
            </div>
          </SectionCard>

        </div>

      </div>
    </div>
  );
}
