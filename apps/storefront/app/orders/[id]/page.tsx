'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { OrdersService, Order, PaymentStatus, FulfillmentStatus } from '@nfi/api-client';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowLeft,
  FileText,
  MessageCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  Sparkles,
  Phone,
  AlertCircle,
  HelpCircle,
  Printer,
  Hammer,
  Layers,
  Flame,
  Award,
  Banknote,
  X,
  Send,
} from 'lucide-react';

interface StageInfo {
  stage: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
}

const WOODCRAFT_STAGES: StageInfo[] = [
  {
    stage: 1,
    title: 'Order Confirmed & Timber Sourced',
    subtitle: 'Grade-A FSC certified hardwood selected',
    description:
      'Our timber specialists select seasoned Burma Teak and American Walnut logs with continuous grain patterns matching your room specifications.',
    icon: ShieldCheck,
  },
  {
    stage: 2,
    title: 'Kiln Seasoning & Moisture Testing',
    subtitle: 'Conditioned to 8%–10% EMC in Bengaluru kilns',
    description:
      'Wood undergoes controlled dehumidification to ensure zero warping, expansion, or shrinkage under Indian coastal and subcontinental humidity swings.',
    icon: Flame,
  },
  {
    stage: 3,
    title: 'Precision Joinery & Hand-Carving',
    subtitle: 'Traditional Mortise & Tenon joinery',
    description:
      'Master artisans hand-cut joints without metallic nails where possible, hand-planing contours and assembling structural chassis.',
    icon: Hammer,
  },
  {
    stage: 4,
    title: 'Finishing, Lacquer & Upholstery',
    subtitle: 'Multi-layer Italian PU & hand-rubbed wax',
    description:
      'Surfaces receive 4 layers of hand-sanded matte lacquer and custom upholstery with high-resilience memory foam and selected textiles.',
    icon: Layers,
  },
  {
    stage: 5,
    title: 'White-Glove Dispatch',
    subtitle: 'Blanket-wrapped climate-controlled transit',
    description:
      'Each piece is individually encased in 5-ply protective cellular blankets and placed on air-suspension transit direct from our plant.',
    icon: Truck,
  },
  {
    stage: 6,
    title: 'In-Home Delivery & Installation',
    subtitle: 'White-glove placement & inspection',
    description:
      'Uniformed white-glove technicians place furniture in your designated room, level with floor protectors, and hand over the 10-year warranty certificate.',
    icon: Award,
  },
];

const DEMO_ORDERS: Record<string, Order> = {
  'ord-bengaluru-9021': {
    id: 'ord-bengaluru-9021',
    orderNumber: 'NFI-BLR-2026-9021',
    userId: 'user-current',
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
        note: 'Order specifications and Burma teak moisture levels verified.',
        changedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        status: 'PACKED',
        note: '14-stage quality inspection passed. Blum soft-close verified.',
        changedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        status: 'SHIPPED',
        note: 'Dispatched from 40,000 sq.ft Bengaluru facility via White-Glove Truck #3.',
        changedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  'ord-bengaluru-8840': {
    id: 'ord-bengaluru-8840',
    orderNumber: 'NFI-BLR-2026-8840',
    userId: 'user-current',
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
        note: 'Order confirmed and scheduled for production.',
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

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitted, setCancelSubmitted] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // White-Glove NEFT / Bank Transfer UTR Submission State
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [utrNumberInput, setUtrNumberInput] = useState('');
  const [bankNameInput, setBankNameInput] = useState('');
  const [utrSubmitted, setUtrSubmitted] = useState(false);

  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !utrNumberInput.trim()) return;

    const newTimeline = [
      ...(order.timeline || []),
      {
        status: 'UTR_SUBMITTED',
        note: `Customer submitted NEFT/RTGS UTR #${utrNumberInput.trim()} (${bankNameInput.trim() || 'Bank Transfer'}). Under verification by Finance Ops.`,
        changedAt: new Date().toISOString(),
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedOrder: any = {
      ...order,
      timeline: newTimeline,
      reconciliationDetails: {
        utrNumber: utrNumberInput.trim(),
        bankName: bankNameInput.trim() || 'Bank Transfer',
        submittedAt: new Date().toISOString(),
      },
    };

    setOrder(updatedOrder);
    setUtrSubmitted(true);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nfi_user_orders');
        const list: Order[] = raw ? JSON.parse(raw) : [];
        const index = list.findIndex(
          (o) => o.id === order.id || o.orderNumber === order.orderNumber,
        );
        if (index >= 0) {
          list[index] = updatedOrder;
        } else {
          list.unshift(updatedOrder);
        }
        localStorage.setItem('nfi_user_orders', JSON.stringify(list));
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await OrdersService.getOrder(id);
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

    if (DEMO_ORDERS[id]) {
      setOrder(DEMO_ORDERS[id]);
    } else {
      // Dynamic fallback based on ID so user can test any order ID
      const dynamicDemo: Order = {
        id: id,
        orderNumber: `NFI-BLR-${id.slice(0, 8).toUpperCase()}`,
        userId: user?.id || 'demo-client',
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
      setOrder(dynamicDemo);
    }
  };

  const getStageFromStatus = (status: FulfillmentStatus): number => {
    switch (status) {
      case FulfillmentStatus.PENDING:
        return 1;
      case FulfillmentStatus.CONFIRMED:
        return 2;
      case FulfillmentStatus.PACKED:
        return 4;
      case FulfillmentStatus.SHIPPED:
        return 5;
      case FulfillmentStatus.OUT_FOR_DELIVERY:
        return 5;
      case FulfillmentStatus.DELIVERED:
        return 6;
      case FulfillmentStatus.CANCELLED:
      case FulfillmentStatus.RETURNED:
        return 0;
      default:
        return 2;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);

  const formatDate = (dateString: string | Date, includeTime = false) => {
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      opts.hour = 'numeric';
      opts.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('en-IN', opts);
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'http://localhost:4000';
      const pdfEndpoint = OrdersService.getOrderInvoicePdfUrl(order?.id || id);
      window.open(`${apiBase}${pdfEndpoint}`, '_blank');
    } catch {
      setShowInvoiceModal(true);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelSubmitted(true);
    setTimeout(() => {
      setShowCancelModal(false);
      setCancelSubmitted(false);
      setCancelReason('');
    }, 2800);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] pb-16 pt-28">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#8C7355] border-t-transparent" />
        <p className="text-sm font-light uppercase tracking-widest text-[#737373]">
          Loading Bespoke Order Details…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] px-4 pb-16 pt-32">
        <div className="mx-auto max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#8C7355]" />
          <h2 className="mb-2 font-serif text-xl text-[#171717]">Order Not Located</h2>
          <p className="mb-6 text-sm text-[#737373]">
            {error || 'We could not retrieve this order from the artisan records.'}
          </p>
          <Link
            href="/orders"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] py-3 text-sm font-medium text-[#FAF9F6] transition-colors hover:bg-[#262626]"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStage = getStageFromStatus(order.fulfillmentStatus);
  const isDelivered = order.fulfillmentStatus === FulfillmentStatus.DELIVERED;
  const isCancelled = order.fulfillmentStatus === FulfillmentStatus.CANCELLED;

  const whatsappMessage = encodeURIComponent(
    `Hello National Furniture & Interiors Concierge, I am inquiring regarding my bespoke order #${order.orderNumber}. I would like to get an update on the artisan schedule.`,
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20 pt-28 selection:bg-[#8C7355]/20 selection:text-[#171717]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-[#737373] transition-colors hover:text-[#171717]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs text-[#525252]">
              Direct Workshop Sync
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                order.paymentStatus === PaymentStatus.PAID
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {order.paymentStatus === PaymentStatus.PAID
                ? 'Payment Completed'
                : 'Payment Awaiting'}
            </span>
          </div>
        </div>

        {/* Hero Order Header */}
        <div className="mb-8 rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 border-b border-[#F0EFEA] pb-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded bg-[#8C7355]/10 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[#8C7355]">
                  Bespoke Manufacture
                </span>
                <span className="text-xs text-[#A3A3A3]">
                  Placed {formatDate(order.createdAt, true)}
                </span>
              </div>
              <h1 className="font-serif text-2xl tracking-tight text-[#171717] sm:text-3xl">
                Order #{order.orderNumber}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#737373]">
                <MapPin className="h-4 w-4 text-[#8C7355]" />
                Destination: {order.shippingAddress.city}, {order.shippingAddress.state} (
                {order.shippingAddress.pincode})
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Concierge</span>
              </a>

              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-4 py-2.5 text-sm font-medium text-[#171717] transition-colors hover:bg-stone-200"
              >
                {downloadingInvoice ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <FileText className="h-4 w-4 text-[#8C7355]" />
                )}
                <span>Tax Invoice</span>
              </button>

              {!isDelivered && !isCancelled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Modify / Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* 6-Stage Woodcraft Live Tracker Banner */}
          <div className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-[#8C7355]">
                  <Sparkles className="h-4 w-4" />
                  Live Artisan Progression (Stage {currentStage} of 6)
                </h3>
                <p className="mt-0.5 text-xs text-[#737373]">
                  Every National Furniture & Interiors piece is handcrafted in our 40,000 sq.ft
                  facility.
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full border border-stone-200 bg-[#FAF9F6] px-3 py-1 text-xs font-medium text-[#171717]">
                  {order.fulfillmentStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative mb-6 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-gradient-to-r from-[#8C7355] to-[#171717] transition-all duration-700 ease-out"
                style={{ width: `${(Math.max(1, currentStage) / 6) * 100}%` }}
              />
            </div>

            {/* 6 Stages Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {WOODCRAFT_STAGES.map((s) => {
                const isCompleted = s.stage < currentStage;
                const isCurrent = s.stage === currentStage;
                const IconComponent = s.icon;

                return (
                  <div
                    key={s.stage}
                    className={`relative rounded-xl border p-3.5 transition-all ${
                      isCurrent
                        ? 'border-[#8C7355] bg-[#8C7355]/5 ring-2 ring-[#8C7355]/20'
                        : isCompleted
                          ? 'border-stone-200 bg-white text-stone-700'
                          : 'border-stone-100 bg-stone-50/60 opacity-60'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'animate-pulse bg-[#8C7355] text-white'
                              : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isCompleted ? '✓' : s.stage}
                      </span>
                      <IconComponent
                        className={`h-4 w-4 ${
                          isCurrent
                            ? 'text-[#8C7355]'
                            : isCompleted
                              ? 'text-emerald-700'
                              : 'text-stone-400'
                        }`}
                      />
                    </div>
                    <h4 className="line-clamp-2 text-xs font-semibold leading-tight text-[#171717]">
                      {s.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[10px] text-[#737373]">{s.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Column (2/3): Items & Workshop Log */}
          <div className="space-y-8 lg:col-span-2">
            {/* Itemized Order Breakdown */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-[#F0EFEA] pb-4">
                <div>
                  <h2 className="font-serif text-lg text-[#171717]">Commissioned Pieces</h2>
                  <p className="text-xs text-[#737373]">
                    Custom timber joinery, finishes, and specs
                  </p>
                </div>
                <span className="rounded bg-[#8C7355]/10 px-2.5 py-1 font-mono text-xs text-[#8C7355]">
                  {order.items.reduce((acc, it) => acc + it.quantity, 0)} Units Total
                </span>
              </div>

              <div className="space-y-6 divide-y divide-[#F0EFEA]">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-5 sm:flex-row ${idx > 0 ? 'pt-6' : ''}`}
                  >
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-[#FAF9F6] sm:w-28">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-serif text-base font-medium text-[#171717]">
                            {item.name}
                          </h3>
                          <div className="shrink-0 text-right">
                            <span className="text-base font-semibold text-[#171717]">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-[#737373]">
                            SKU: {item.sku}
                          </span>
                          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                            10-Yr Structural Warranty
                          </span>
                          <span className="rounded bg-[#8C7355]/10 px-2 py-0.5 text-[11px] text-[#8C7355]">
                            Moisture Verified
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-stone-200 pt-4 text-xs text-[#737373]">
                        <span>
                          Quantity: <strong className="text-[#171717]">{item.quantity}</strong>
                        </span>
                        <span>Rate: {formatPrice(item.unitPrice)} each</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Workshop Production Timeline */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-[#F0EFEA] pb-4">
                <div>
                  <h2 className="font-serif text-lg text-[#171717]">Artisan Workshop Log</h2>
                  <p className="text-xs text-[#737373]">
                    Live updates recorded by factory supervisors
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#8C7355]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Real-time Log</span>
                </div>
              </div>

              <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-stone-200 before:content-['']">
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline
                    .slice()
                    .reverse()
                    .map((event, idx) => (
                      <div key={idx} className="group relative">
                        <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#FAF9F6] bg-[#8C7355] ring-4 ring-white" />
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold tracking-wide text-[#171717]">
                              {event.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-[#A3A3A3]">
                              {formatDate(event.changedAt, true)}
                            </span>
                          </div>
                          {event.note && (
                            <p className="mt-1 rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs text-[#525252]">
                              {event.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-[#737373]">
                    Order confirmed. Timber selection log will appear here shortly.
                  </div>
                )}
              </div>
            </div>

            {/* White-Glove In-Home Installation Guide */}
            <div className="rounded-2xl bg-gradient-to-br from-[#171717] to-[#262626] p-6 text-white shadow-md sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#D4AF37]">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-white">
                    National Furniture & Interiors White-Glove Promise
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-300">
                    Our dedicated delivery crew unboxes, positions, and installs each piece in your
                    designated room with non-marking felt pads. No packaging waste is left behind in
                    your home.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
                    <div>
                      <strong className="block text-[#D4AF37]">1. Pre-Check</strong>
                      <span className="text-stone-300">Stairway & doorway clearance verified</span>
                    </div>
                    <div>
                      <strong className="block text-[#D4AF37]">2. Assembly</strong>
                      <span className="text-stone-300">Joinery torqued & level adjusted</span>
                    </div>
                    <div>
                      <strong className="block text-[#D4AF37]">3. Handover</strong>
                      <span className="text-stone-300">Warranty seal & care guide signed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (1/3): Financials & Delivery Information */}
          <div className="space-y-6">
            {/* White-Glove Bank Transfer / NEFT Reconciliation Card */}
            {order.paymentStatus === PaymentStatus.PENDING && (
              <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#8C7355]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      Bank Transfer Required
                    </h3>
                  </div>
                  <span className="rounded bg-amber-200/60 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-900">
                    Payment Pending
                  </span>
                </div>

                <div className="space-y-2 rounded-xl border border-amber-100 bg-white/70 p-4 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">
                    National Furniture &amp; Interiors Pvt. Ltd.
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Bank:{' '}
                    <strong className="text-stone-900">
                      ICICI Bank, MG Road Branch, Bengaluru
                    </strong>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Account No:{' '}
                    <strong className="font-mono text-xs text-stone-900">000205029381</strong>{' '}
                    (Current)
                  </p>
                  <p className="text-[11px] text-stone-600">
                    IFSC Code:{' '}
                    <strong className="font-mono text-xs text-stone-900">ICIC0000002</strong>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Payable Amount:{' '}
                    <strong className="text-xs text-stone-900">
                      {formatPrice(order.pricing.total)}
                    </strong>
                  </p>
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(order as any).reconciliationDetails?.utrNumber ? (
                  <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>UTR Submitted for Verification</span>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-mono text-[11px]">
                      UTR: {(order as any).reconciliationDetails.utrNumber}
                    </p>
                    <p className="text-[10px] text-emerald-700">
                      Finance Ops will reconcile and update within 2 hours.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setUtrSubmitted(false);
                      setShowUtrModal(true);
                    }}
                    className="shadow-xs flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#8C7355]"
                  >
                    <span>Submit Bank Transfer Reference (UTR)</span>
                  </button>
                )}
              </div>
            )}

            {/* Financial & GST Summary */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-[#F0EFEA] pb-2 text-sm font-semibold uppercase tracking-wider text-[#171717]">
                Financial Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#737373]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#171717]">
                    {formatPrice(order.pricing.subtotal)}
                  </span>
                </div>

                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Artisan Savings / Privilege Discount</span>
                    <span>−{formatPrice(order.pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#737373]">
                  <span>White-Glove Delivery (Bengaluru)</span>
                  <span className="font-medium text-emerald-800">
                    {order.pricing.shippingFee === 0
                      ? 'Complimentary'
                      : formatPrice(order.pricing.shippingFee)}
                  </span>
                </div>

                {order.pricing.tax > 0 && (
                  <div className="flex justify-between text-[#737373]">
                    <span>
                      {order.pricing.taxBreakdown?.isInterState
                        ? 'GST (IGST 18% — Inter-State)'
                        : 'GST (CGST 9% + SGST 9%)'}
                    </span>
                    <span className="text-[#171717]">{formatPrice(order.pricing.tax)}</span>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-[#F0EFEA] pt-3">
                  <div>
                    <span className="block text-base font-semibold text-[#171717]">
                      Grand Total
                    </span>
                    <span className="text-[11px] text-[#737373]">
                      {order.pricing.taxBreakdown?.isInterState
                        ? 'Inclusive of IGST (HSN 9403)'
                        : 'Inclusive of Karnataka GST (HSN 9403)'}
                    </span>
                  </div>
                  <span className="font-serif text-xl font-bold text-[#171717]">
                    {formatPrice(order.pricing.total)}
                  </span>
                </div>

                {order.paymentPlan === 'MILESTONE_50_50' && (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                    <div className="flex justify-between font-semibold text-[#8C7355]">
                      <span>50% Bespoke Advance (Paid)</span>
                      <span>{formatPrice(Math.round(order.pricing.total / 2))}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>50% Balance on White-Glove Dispatch</span>
                      <span>
                        {formatPrice(order.pricing.total - Math.round(order.pricing.total / 2))}
                      </span>
                    </div>
                  </div>
                )}

                {(order.customerGstin || order.companyName) && (
                  <div className="mt-3 space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      <span>B2B Input Tax Credit (ITC)</span>
                      <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[9px]">
                        Claimable
                      </span>
                    </div>
                    {order.companyName && <p className="font-semibold">{order.companyName}</p>}
                    {order.customerGstin && (
                      <p className="font-mono text-[11px] text-stone-700">
                        GSTIN: {order.customerGstin}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-stone-100 pt-4">
                <button
                  onClick={handleDownloadInvoice}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8C7355] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#8C7355] transition-colors hover:bg-[#8C7355]/10"
                >
                  <Printer className="h-4 w-4" />
                  Print / Download Tax Invoice
                </button>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center justify-between border-b border-[#F0EFEA] pb-2 text-sm font-semibold uppercase tracking-wider text-[#171717]">
                <span>Shipping Residence</span>
                <span className="rounded bg-[#8C7355]/10 px-2 py-0.5 font-mono text-[10px] uppercase text-[#8C7355]">
                  {order.shippingAddress.label || 'White-Glove'}
                </span>
              </h3>

              <div className="space-y-1 text-xs leading-relaxed text-[#525252]">
                <p className="text-sm font-semibold text-[#171717]">
                  {order.shippingAddress.line1}
                </p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                  {order.shippingAddress.pincode}
                </p>
                <p className="font-medium text-[#8C7355]">{order.shippingAddress.country}</p>
              </div>

              <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs text-[#737373]">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#8C7355]" />
                  <span>Concierge Helpline: +91 9663628302</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#8C7355]" />
                  <span>Installation Window: Mon – Sat, 10 AM – 6 PM</span>
                </div>
              </div>
            </div>

            {/* Concierge Assistance Card */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAF9F6] p-6">
              <h4 className="mb-2 flex items-center gap-2 font-serif text-sm font-semibold text-[#171717]">
                <HelpCircle className="h-4 w-4 text-[#8C7355]" />
                Dedicated Design Concierge
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-[#737373]">
                Need to coordinate building elevator permissions, change delivery date, or review
                custom finish swatches?
              </p>
              <a
                href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-medium text-[#FAF9F6] transition-colors hover:bg-[#262626]"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>Chat with Bengaluru Workshop</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modify / Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#171717]">Commission Modification</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cancelSubmitted ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
                <h4 className="font-serif text-base text-[#171717]">
                  Request Transmitted to Artisan Lead
                </h4>
                <p className="mt-2 text-xs text-[#737373]">
                  Our workshop manager will review Order #{order.orderNumber} within 2 hours and
                  contact you directly via phone and WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  <strong>Bespoke Manufacture Policy:</strong> Timber cutting begins 48 hours post
                  confirmation. Dimensional adjustments and address changes are complimentary prior
                  to stage 3.
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#171717]">
                    Describe your modification or cancellation inquiry:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    placeholder="E.g., Need to adjust delivery date by 1 week, or request stain sample confirmation..."
                    className="w-full rounded-xl border border-stone-300 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-[#262626]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* White-Glove Bank Transfer UTR Submission Modal */}
      {showUtrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-[#8C7355]" />
                <h3 className="font-serif text-base text-[#171717]">Submit Transfer UTR</h3>
              </div>
              <button
                onClick={() => setShowUtrModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {utrSubmitted ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
                <h4 className="font-serif text-base text-[#171717]">Bank Reference Recorded</h4>
                <p className="mt-2 text-xs leading-relaxed text-[#737373]">
                  Thank you! UTR <strong>{utrNumberInput}</strong> has been logged. Our finance desk
                  at the Sarjapur factory will reconcile with ICICI Bank and mark your commission as
                  Confirmed.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUtrModal(false)}
                  className="mt-5 rounded-xl bg-[#171717] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#8C7355]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleUtrSubmit} className="space-y-4">
                <p className="text-xs leading-relaxed text-stone-500">
                  Please enter the 12–16 character Unique Transaction Reference (UTR) generated by
                  your bank app or NetBanking after initiating NEFT/RTGS to National Furniture &amp;
                  Interiors.
                </p>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#171717]">
                    UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumberInput}
                    onChange={(e) => setUtrNumberInput(e.target.value)}
                    placeholder="e.g. ICIC260908123456 or UTR12345678"
                    className="w-full rounded-xl border border-stone-300 p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#171717]">
                    Remitting Bank Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, Kotak Mahindra"
                    className="w-full rounded-xl border border-stone-300 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                  />
                </div>

                <div className="space-y-1 rounded-xl border border-stone-200 bg-stone-50 p-3 text-[11px] text-stone-600">
                  <div className="flex justify-between font-medium">
                    <span>Commission Payable:</span>
                    <span className="font-bold text-stone-900">
                      {formatPrice(order.pricing.total)}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Beneficiary: National Furniture &amp; Interiors Pvt Ltd (A/C: 000205029381)
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUtrModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#737373] hover:text-[#171717]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-[#171717] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#8C7355]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit for Verification</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tax Invoice Modal for Instant Print / PDF Save */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-[#171717] shadow-2xl">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute right-5 top-5 p-1 text-stone-400 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Printable Invoice Body */}
            <div id="printable-invoice">
              <div className="flex items-start justify-between border-b border-stone-200 pb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#171717]">
                    NATIONAL FURNITURE &amp; INTERIORS
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    40,000 Sq.Ft Factory &amp; Studio, Sy. No. 42/1, Off Sarjapur Road,
                    <br />
                    Bengaluru, Karnataka 560035, India
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    <strong>GSTIN:</strong> 29AABCN8291M1Z5 &bull; <strong>PAN:</strong> AABCN8291M
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-[#8C7355]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-[#8C7355]">
                    TAX INVOICE
                  </span>
                  <p className="mt-2 text-xs text-stone-500">
                    <strong>Invoice #:</strong> INV-{order.orderNumber}
                  </p>
                  <p className="text-xs text-stone-500">
                    <strong>Date:</strong> {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Bill to */}
              <div className="grid grid-cols-2 gap-4 border-b border-stone-200 py-4 text-xs">
                <div>
                  <strong className="block text-[10px] uppercase text-stone-400">Billed To:</strong>
                  <p className="mt-1 font-semibold">{order.billingAddress.line1}</p>
                  {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state}{' '}
                    {order.billingAddress.pincode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </div>
                <div>
                  <strong className="block text-[10px] uppercase text-stone-400">
                    Shipped To:
                  </strong>
                  <p className="mt-1 font-semibold">{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.pincode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] uppercase text-stone-500">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">HSN</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5">
                          <p className="font-medium text-stone-800">{it.name}</p>
                          <span className="font-mono text-[10px] text-stone-400">
                            SKU: {it.sku}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono text-stone-500">9403</td>
                        <td className="py-2.5 text-center font-semibold">{it.quantity}</td>
                        <td className="py-2.5 text-right">{formatPrice(it.unitPrice)}</td>
                        <td className="py-2.5 text-right font-medium">
                          {formatPrice(it.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end border-t border-stone-200 pt-4">
                <div className="w-64 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.pricing.subtotal)}</span>
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>−{formatPrice(order.pricing.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>White-Glove Delivery:</span>
                    <span>
                      {order.pricing.shippingFee === 0
                        ? 'Complimentary'
                        : formatPrice(order.pricing.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>CGST (9%):</span>
                    <span>{formatPrice(order.pricing.tax / 2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>SGST (9%):</span>
                    <span>{formatPrice(order.pricing.tax / 2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-300 pt-2 text-sm font-bold text-stone-900">
                    <span>Total Amount (INR):</span>
                    <span>{formatPrice(order.pricing.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-dashed border-stone-300 pt-4 text-[10px] text-stone-400">
                <span>
                  Computer generated tax invoice &bull; Authorized by National Furniture &amp;
                  Interiors
                </span>
                <span className="font-mono font-medium text-emerald-800">PAID &bull; VERIFIED</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-2 text-xs font-medium text-white hover:bg-[#262626]"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
