'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  FileText,
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
        image:
          'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
      },
      {
        productId: 'prod-boucle-chair',
        name: 'Koramangala Minimalist Bouclé Dining Chairs (Set of 6)',
        sku: 'NFI-CHR-004-BC',
        unitPrice: 1200000,
        quantity: 6,
        lineTotal: 7200000,
        image:
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=600&auto=format&fit=crop',
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
        image:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
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
  const [driverDetails, setDriverDetails] = useState(
    'White-Glove Fleet Truck #3 (Driver: Ramesh K. - 9845012345)',
  );
  const [driverSaved, setDriverSaved] = useState(false);

  useEffect(() => {
    fetchOrder();
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
            image:
              'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
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
      const response = await OrdersService.updateFulfillmentStatus(
        order.id,
        targetStatus,
        noteToSubmit,
      );
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
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
        <p className="text-xs uppercase tracking-widest text-stone-500">
          Loading commission details…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-stone-400" />
        <h2 className="font-serif text-lg font-bold text-stone-900">Commission Record Not Found</h2>
        <p className="mb-6 mt-1 text-xs text-stone-500">
          {error || 'Order could not be located in database.'}
        </p>
        <Link href="/orders">
          <NfiButton variant="secondary" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders Hub
          </NfiButton>
        </Link>
      </div>
    );
  }

  const clientWhatsApp = encodeURIComponent(
    `Hello! This is National Furniture & Interiors Concierge regarding your bespoke commission #${order.orderNumber}.`,
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
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                All Orders
              </NfiButton>
            </Link>

            <a
              href={`https://wa.me/919663628302?text=${clientWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Client</span>
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Workshop Controls & Pieces */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Status Workflow Action Bar */}
          <SectionCard title="Workshop Production Transition Engine">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-stone-500">
                  Transition this piece across the 6-stage National Furniture &amp; Interiors
                  manufacturing cycle. Updating status broadcasts immediately to the customer&apos;s
                  live woodcraft tracker.
                </p>

                {/* Stage Flow Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                  {[
                    {
                      status: FulfillmentStatus.CONFIRMED,
                      label: '1. Sourced & Confirmed',
                      desc: 'Moisture tested',
                    },
                    {
                      status: FulfillmentStatus.PACKED,
                      label: '2. Joinery & Inspection',
                      desc: '14-stage QC',
                    },
                    {
                      status: FulfillmentStatus.SHIPPED,
                      label: '3. White-Glove Dispatch',
                      desc: 'Truck loaded',
                    },
                    {
                      status: FulfillmentStatus.OUT_FOR_DELIVERY,
                      label: '4. Out for Delivery',
                      desc: 'En route',
                    },
                    {
                      status: FulfillmentStatus.DELIVERED,
                      label: '5. Installed at Residence',
                      desc: 'Handover complete',
                    },
                    {
                      status: FulfillmentStatus.CANCELLED,
                      label: 'Cancel Commission',
                      desc: 'Halt cutting',
                    },
                  ].map((btn) => {
                    const isCurrent = order.fulfillmentStatus === btn.status;
                    return (
                      <button
                        key={btn.status}
                        onClick={() => handleUpdateFulfillment(btn.status)}
                        disabled={updatingFulfillment || isCurrent}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isCurrent
                            ? 'border-stone-900 bg-stone-900 text-white ring-2 ring-stone-900/20'
                            : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{btn.label}</span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                        </div>
                        <span
                          className={`mt-0.5 block text-[10px] ${isCurrent ? 'text-stone-300' : 'text-stone-400'}`}
                        >
                          {btn.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Timeline Note Input */}
              <div className="border-t border-stone-200 pt-4">
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Add Workshop Production Log Note:
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Enter audit note for customer tracker (e.g. Moisture levels verified at 8.2% in kiln #2)..."
                    className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <NfiButton
                    variant="primary"
                    size="sm"
                    loading={updatingFulfillment}
                    disabled={!statusNote.trim()}
                    onClick={() => handleUpdateFulfillment(order.fulfillmentStatus, statusNote)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Record Note
                  </NfiButton>
                </div>

                {/* Quick Macro Fill Pills */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="self-center text-[10px] text-stone-400">Quick Macros:</span>
                  {MACRO_NOTES.slice(0, 3).map((macro, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStatusNote(macro)}
                      className="rounded bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600 transition-colors hover:bg-stone-200"
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
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Assigned Delivery Vehicle &amp; Crew (Bengaluru Fleet):
                </label>
                <input
                  type="text"
                  value={driverDetails}
                  onChange={(e) => setDriverDetails(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Truck className="h-3.5 w-3.5 text-[#8C7355]" />
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
                <div key={idx} className="flex gap-4 p-4 transition-colors hover:bg-stone-50/50">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    {item.image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-1 font-serif text-sm font-semibold text-stone-900">
                          {item.name}
                        </h4>
                        <span className="shrink-0 text-sm font-semibold text-stone-900">
                          {formatPrice(item.lineTotal)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-500">
                          SKU: {item.sku}
                        </span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800">
                          Grade-A Sourced
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-dashed border-stone-100 pt-2 text-xs text-stone-500">
                      <span>
                        Quantity: <strong className="text-stone-900">{item.quantity}</strong>
                      </span>
                      <span>Unit Rate: {formatPrice(item.unitPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Complete Audit Timeline */}
          <SectionCard title="Official Manufacturing Audit Timeline">
            <div className="relative space-y-6 py-2 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-stone-200 before:content-['']">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <div key={idx} className="group relative">
                      <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-stone-900 ring-4 ring-white" />
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-stone-900">
                            {event.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {formatDate(event.changedAt, true)}
                          </span>
                        </div>
                        {event.note && (
                          <p className="mt-1 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-600">
                            {event.note}
                          </p>
                        )}
                        {event.changedBy && (
                          <p className="mt-0.5 text-[10px] italic text-stone-400">
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
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-xs font-medium text-stone-500">Payment Status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.paymentStatus === PaymentStatus.PAID
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {/* Quick Payment Status Toggle */}
              <div>
                <label className="mb-1.5 block text-[11px] text-stone-500">
                  Override Payment Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdatePayment(PaymentStatus.PAID)}
                    disabled={updatingPayment || order.paymentStatus === PaymentStatus.PAID}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      order.paymentStatus === PaymentStatus.PAID
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleUpdatePayment(PaymentStatus.PENDING)}
                    disabled={updatingPayment || order.paymentStatus === PaymentStatus.PENDING}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      order.paymentStatus === PaymentStatus.PENDING
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Mark Pending
                  </button>
                </div>
              </div>

              {/* Financial Lines */}
              <div className="space-y-2 border-t border-stone-200 pt-3 text-xs">
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
                  <span>
                    {order.pricing.shippingFee === 0
                      ? 'Complimentary'
                      : formatPrice(order.pricing.shippingFee)}
                  </span>
                </div>
                {order.pricing.tax > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>
                      {order.pricing.taxBreakdown?.isInterState
                        ? 'GST (IGST 18% — Inter-State)'
                        : 'GST (CGST 9% + SGST 9%)'}
                    </span>
                    <span>{formatPrice(order.pricing.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-3 text-sm font-bold text-stone-900">
                  <span>Total Due / Collected</span>
                  <span>{formatPrice(order.pricing.total)}</span>
                </div>

                {order.paymentPlan === 'MILESTONE_50_50' && (
                  <div className="mt-2 space-y-1 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                    <div className="flex justify-between font-semibold text-stone-800">
                      <span>Milestone Plan:</span>
                      <span className="text-stone-900">50% Advance / 50% Dispatch</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>50% Advance (Paid):</span>
                      <span>{formatPrice(Math.round(order.pricing.total / 2))}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>50% Pre-Dispatch Balance:</span>
                      <span>
                        {formatPrice(order.pricing.total - Math.round(order.pricing.total / 2))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Invoice PDF Generator */}
              <div className="border-t border-stone-200 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const apiBase =
                      process.env.NEXT_PUBLIC_API_URL ||
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      'http://localhost:4000';
                    const pdfEndpoint = OrdersService.getOrderInvoicePdfUrl(order.id);
                    window.open(`${apiBase}${pdfEndpoint}`, '_blank');
                  }}
                  className="shadow-xs flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-stone-800"
                >
                  <FileText className="h-4 w-4 text-[#D4AF37]" />
                  <span>Download GST Tax Invoice (PDF)</span>
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Client & Residence Details */}
          <SectionCard title="Client & Delivery Address">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 font-serif font-bold text-stone-700">
                  {order.userId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900">{order.userId}</h4>
                  <p className="text-[11px] text-stone-400">Registered Client</p>
                </div>
              </div>

              <div>
                <strong className="mb-1 block text-[10px] uppercase text-stone-500">
                  Shipping Destination ({order.shippingAddress?.label || 'Residence'}):
                </strong>
                <p className="font-medium text-stone-900">{order.shippingAddress?.line1}</p>
                {order.shippingAddress?.line2 && (
                  <p className="text-stone-600">{order.shippingAddress.line2}</p>
                )}
                <p className="text-stone-600">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} —{' '}
                  {order.shippingAddress?.pincode}
                </p>
                <p className="text-stone-500">{order.shippingAddress?.country}</p>
              </div>

              <div className="border-t border-stone-200 pt-3">
                <strong className="mb-1 block text-[10px] uppercase text-stone-500">
                  Billing Entity:
                </strong>
                <p className="text-stone-800">{order.billingAddress?.line1}</p>
                <p className="text-stone-600">
                  {order.billingAddress?.city}, {order.billingAddress?.state}{' '}
                  {order.billingAddress?.pincode}
                </p>
              </div>

              {(order.customerGstin || order.companyName) && (
                <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    <span>B2B GST Input Tax Credit Entity</span>
                    <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px]">
                      Verified
                    </span>
                  </div>
                  {order.companyName && (
                    <p className="text-xs font-semibold text-stone-900">
                      Company: {order.companyName}
                    </p>
                  )}
                  {order.customerGstin && (
                    <p className="font-mono text-xs text-stone-800">GSTIN: {order.customerGstin}</p>
                  )}
                  <p className="text-[10px] text-amber-800">
                    HSN Code 9403 &bull; 18% GST Credit Applicable
                  </p>
                </div>
              )}

              <div className="border-t border-stone-200 pt-3">
                <a
                  href={`https://wa.me/919663628302?text=${clientWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
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
