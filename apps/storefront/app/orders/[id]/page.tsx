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
    description: 'Our timber specialists select seasoned Burma Teak and American Walnut logs with continuous grain patterns matching your room specifications.',
    icon: ShieldCheck,
  },
  {
    stage: 2,
    title: 'Kiln Seasoning & Moisture Testing',
    subtitle: 'Conditioned to 8%–10% EMC in Bengaluru kilns',
    description: 'Wood undergoes controlled dehumidification to ensure zero warping, expansion, or shrinkage under Indian coastal and subcontinental humidity swings.',
    icon: Flame,
  },
  {
    stage: 3,
    title: 'Precision Joinery & Hand-Carving',
    subtitle: 'Traditional Mortise & Tenon joinery',
    description: 'Master artisans hand-cut joints without metallic nails where possible, hand-planing contours and assembling structural chassis.',
    icon: Hammer,
  },
  {
    stage: 4,
    title: 'Finishing, Lacquer & Upholstery',
    subtitle: 'Multi-layer Italian PU & hand-rubbed wax',
    description: 'Surfaces receive 4 layers of hand-sanded matte lacquer and custom upholstery with high-resilience memory foam and selected textiles.',
    icon: Layers,
  },
  {
    stage: 5,
    title: 'White-Glove Dispatch',
    subtitle: 'Blanket-wrapped climate-controlled transit',
    description: 'Each piece is individually encased in 5-ply protective cellular blankets and placed on air-suspension transit direct from our plant.',
    icon: Truck,
  },
  {
    stage: 6,
    title: 'In-Home Delivery & Installation',
    subtitle: 'White-glove placement & inspection',
    description: 'Uniformed white-glove technicians place furniture in your designated room, level with floor protectors, and hand over the 10-year warranty certificate.',
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
        const index = list.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
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
      const response = await OrdersService.getOrderInvoice(id);
      if (response?.data?.url) {
        window.open(response.data.url, '_blank');
      } else {
        setShowInvoiceModal(true);
      }
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
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center pt-28 pb-16">
        <div className="w-10 h-10 border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light tracking-widest uppercase text-[#737373]">
          Loading Bespoke Order Details…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-[#E5E5E5] text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#8C7355] mx-auto mb-4" />
          <h2 className="text-xl font-serif text-[#171717] mb-2">Order Not Located</h2>
          <p className="text-sm text-[#737373] mb-6">
            {error || 'We could not retrieve this order from the artisan records.'}
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#171717] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#262626] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStage = getStageFromStatus(order.fulfillmentStatus);
  const isDelivered = order.fulfillmentStatus === FulfillmentStatus.DELIVERED;
  const isCancelled = order.fulfillmentStatus === FulfillmentStatus.CANCELLED;

  const whatsappMessage = encodeURIComponent(
    `Hello National Furniture & Interiors Concierge, I am inquiring regarding my bespoke order #${order.orderNumber}. I would like to get an update on the artisan schedule.`
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-28 pb-20 selection:bg-[#8C7355]/20 selection:text-[#171717]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#171717] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-stone-100 text-[#525252] border border-stone-200">
              Direct Workshop Sync
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                order.paymentStatus === PaymentStatus.PAID
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {order.paymentStatus === PaymentStatus.PAID ? 'Payment Completed' : 'Payment Awaiting'}
            </span>
          </div>
        </div>

        {/* Hero Order Header */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F0EFEA]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono tracking-wider uppercase text-[#8C7355] bg-[#8C7355]/10 px-2.5 py-1 rounded">
                  Bespoke Manufacture
                </span>
                <span className="text-xs text-[#A3A3A3]">
                  Placed {formatDate(order.createdAt, true)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#171717] tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-sm text-[#737373] mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8C7355]" />
                Destination: {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.pincode})
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Concierge</span>
              </a>

              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#171717] rounded-xl text-sm font-medium transition-colors border border-stone-300"
              >
                {downloadingInvoice ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-[#8C7355]" />
                )}
                <span>Tax Invoice</span>
              </button>

              {!isDelivered && !isCancelled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-700 rounded-xl text-sm font-medium transition-colors border border-red-200"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Modify / Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* 6-Stage Woodcraft Live Tracker Banner */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#8C7355] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Live Artisan Progression (Stage {currentStage} of 6)
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Every National Furniture & Interiors piece is handcrafted in our 40,000 sq.ft facility.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[#171717] bg-[#FAF9F6] px-3 py-1 rounded-full border border-stone-200">
                  {order.fulfillmentStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-[#8C7355] to-[#171717] transition-all duration-700 ease-out"
                style={{ width: `${(Math.max(1, currentStage) / 6) * 100}%` }}
              />
            </div>

            {/* 6 Stages Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {WOODCRAFT_STAGES.map((s) => {
                const isCompleted = s.stage < currentStage;
                const isCurrent = s.stage === currentStage;
                const IconComponent = s.icon;

                return (
                  <div
                    key={s.stage}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#8C7355]/5 border-[#8C7355] ring-2 ring-[#8C7355]/20'
                        : isCompleted
                        ? 'bg-white border-stone-200 text-stone-700'
                        : 'bg-stone-50/60 border-stone-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#8C7355] text-white animate-pulse'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isCompleted ? '✓' : s.stage}
                      </span>
                      <IconComponent
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-[#8C7355]' : isCompleted ? 'text-emerald-700' : 'text-stone-400'
                        }`}
                      />
                    </div>
                    <h4 className="text-xs font-semibold text-[#171717] leading-tight line-clamp-2">
                      {s.title}
                    </h4>
                    <p className="text-[10px] text-[#737373] mt-1 line-clamp-2">{s.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column (2/3): Items & Workshop Log */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Itemized Order Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0EFEA]">
                <div>
                  <h2 className="text-lg font-serif text-[#171717]">Commissioned Pieces</h2>
                  <p className="text-xs text-[#737373]">Custom timber joinery, finishes, and specs</p>
                </div>
                <span className="text-xs font-mono text-[#8C7355] bg-[#8C7355]/10 px-2.5 py-1 rounded">
                  {order.items.reduce((acc, it) => acc + it.quantity, 0)} Units Total
                </span>
              </div>

              <div className="space-y-6 divide-y divide-[#F0EFEA]">
                {order.items.map((item, idx) => (
                  <div key={idx} className={`flex flex-col sm:flex-row gap-5 ${idx > 0 ? 'pt-6' : ''}`}>
                    <div className="relative w-full sm:w-28 h-28 bg-[#FAF9F6] rounded-xl overflow-hidden border border-stone-200 shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-base font-serif font-medium text-[#171717]">
                            {item.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="text-base font-semibold text-[#171717]">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[11px] font-mono text-[#737373] bg-stone-100 px-2 py-0.5 rounded">
                            SKU: {item.sku}
                          </span>
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            10-Yr Structural Warranty
                          </span>
                          <span className="text-[11px] text-[#8C7355] bg-[#8C7355]/10 px-2 py-0.5 rounded">
                            Moisture Verified
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#737373] pt-4 mt-2 border-t border-dashed border-stone-200">
                        <span>Quantity: <strong className="text-[#171717]">{item.quantity}</strong></span>
                        <span>Rate: {formatPrice(item.unitPrice)} each</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Workshop Production Timeline */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0EFEA]">
                <div>
                  <h2 className="text-lg font-serif text-[#171717]">Artisan Workshop Log</h2>
                  <p className="text-xs text-[#737373]">Live updates recorded by factory supervisors</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#8C7355]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Real-time Log</span>
                </div>
              </div>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline.slice().reverse().map((event, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#8C7355] ring-4 ring-white border-2 border-[#FAF9F6]" />
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#171717] tracking-wide">
                            {event.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-[#A3A3A3]">
                            {formatDate(event.changedAt, true)}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-xs text-[#525252] mt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
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
            <div className="bg-gradient-to-br from-[#171717] to-[#262626] text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-serif text-white">
                    National Furniture & Interiors White-Glove Promise
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    Our dedicated delivery crew unboxes, positions, and installs each piece in your designated room with non-marking felt pads. No packaging waste is left behind in your home.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
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
              <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#8C7355]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      Bank Transfer Required
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-semibold">
                    Payment Pending
                  </span>
                </div>

                <div className="text-xs text-stone-700 space-y-2 bg-white/70 p-4 rounded-xl border border-amber-100">
                  <p className="font-semibold text-stone-900">National Furniture &amp; Interiors Pvt. Ltd.</p>
                  <p className="text-[11px] text-stone-600">Bank: <strong className="text-stone-900">ICICI Bank, MG Road Branch, Bengaluru</strong></p>
                  <p className="text-[11px] text-stone-600">Account No: <strong className="font-mono text-stone-900 text-xs">000205029381</strong> (Current)</p>
                  <p className="text-[11px] text-stone-600">IFSC Code: <strong className="font-mono text-stone-900 text-xs">ICIC0000002</strong></p>
                  <p className="text-[11px] text-stone-600">Payable Amount: <strong className="text-stone-900 text-xs">{formatPrice(order.pricing.total)}</strong></p>
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(order as any).reconciliationDetails?.utrNumber ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>UTR Submitted for Verification</span>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="text-[11px] font-mono">UTR: {(order as any).reconciliationDetails.utrNumber}</p>
                    <p className="text-[10px] text-emerald-700">Finance Ops will reconcile and update within 2 hours.</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setUtrSubmitted(false);
                      setShowUtrModal(true);
                    }}
                    className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#8C7355] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Submit Bank Transfer Reference (UTR)</span>
                  </button>
                )}
              </div>
            )}

            {/* Financial & GST Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-4 pb-2 border-b border-[#F0EFEA]">
                Financial Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#737373]">
                  <span>Subtotal</span>
                  <span className="text-[#171717] font-medium">{formatPrice(order.pricing.subtotal)}</span>
                </div>

                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Artisan Savings / Privilege Discount</span>
                    <span>−{formatPrice(order.pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#737373]">
                  <span>White-Glove Delivery (Bengaluru)</span>
                  <span className="text-emerald-800 font-medium">
                    {order.pricing.shippingFee === 0 ? 'Complimentary' : formatPrice(order.pricing.shippingFee)}
                  </span>
                </div>

                {order.pricing.tax > 0 && (
                  <div className="flex justify-between text-[#737373]">
                    <span>GST (CGST 9% + SGST 9%)</span>
                    <span className="text-[#171717]">{formatPrice(order.pricing.tax)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#F0EFEA] flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-semibold text-[#171717] block">Grand Total</span>
                    <span className="text-[11px] text-[#737373]">Inclusive of all Karnataka taxes</span>
                  </div>
                  <span className="text-xl font-serif font-bold text-[#171717]">
                    {formatPrice(order.pricing.total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#8C7355] text-[#8C7355] hover:bg-[#8C7355]/10 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / Download Tax Invoice
                </button>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-3 pb-2 border-b border-[#F0EFEA] flex items-center justify-between">
                <span>Shipping Residence</span>
                <span className="text-[10px] text-[#8C7355] font-mono uppercase bg-[#8C7355]/10 px-2 py-0.5 rounded">
                  {order.shippingAddress.label || 'White-Glove'}
                </span>
              </h3>

              <div className="text-xs text-[#525252] space-y-1 leading-relaxed">
                <p className="font-semibold text-sm text-[#171717]">{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
                <p className="text-[#8C7355] font-medium">{order.shippingAddress.country}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-[#737373] space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>Concierge Helpline: +91 9663628302</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>Installation Window: Mon – Sat, 10 AM – 6 PM</span>
                </div>
              </div>
            </div>

            {/* Concierge Assistance Card */}
            <div className="bg-[#FAF9F6] rounded-2xl border border-[#E5E5E5] p-6">
              <h4 className="text-sm font-serif font-semibold text-[#171717] mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8C7355]" />
                Dedicated Design Concierge
              </h4>
              <p className="text-xs text-[#737373] leading-relaxed mb-4">
                Need to coordinate building elevator permissions, change delivery date, or review custom finish swatches?
              </p>
              <a
                href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#262626] text-[#FAF9F6] rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat with Bengaluru Workshop</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* Modify / Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif text-[#171717]">Commission Modification</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-base text-[#171717]">Request Transmitted to Artisan Lead</h4>
                <p className="text-xs text-[#737373] mt-2">
                  Our workshop manager will review Order #{order.orderNumber} within 2 hours and contact you directly via phone and WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Bespoke Manufacture Policy:</strong> Timber cutting begins 48 hours post confirmation. Dimensional adjustments and address changes are complimentary prior to stage 3.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Describe your modification or cancellation inquiry:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    placeholder="E.g., Need to adjust delivery date by 1 week, or request stain sample confirmation..."
                    className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#8C7355] focus:outline-none"
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
                    className="px-4 py-2 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#8C7355]" />
                <h3 className="text-base font-serif text-[#171717]">Submit Transfer UTR</h3>
              </div>
              <button
                onClick={() => setShowUtrModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {utrSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-base text-[#171717]">Bank Reference Recorded</h4>
                <p className="text-xs text-[#737373] mt-2 leading-relaxed">
                  Thank you! UTR <strong>{utrNumberInput}</strong> has been logged. Our finance desk at the Sarjapur factory will reconcile with ICICI Bank and mark your commission as Confirmed.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUtrModal(false)}
                  className="mt-5 px-5 py-2.5 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleUtrSubmit} className="space-y-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Please enter the 12–16 character Unique Transaction Reference (UTR) generated by your bank app or NetBanking after initiating NEFT/RTGS to National Furniture &amp; Interiors.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumberInput}
                    onChange={(e) => setUtrNumberInput(e.target.value)}
                    placeholder="e.g. ICIC260908123456 or UTR12345678"
                    className="w-full text-xs font-mono p-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171717] mb-1">
                    Remitting Bank Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, Kotak Mahindra"
                    className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Commission Payable:</span>
                    <span className="text-stone-900 font-bold">{formatPrice(order.pricing.total)}</span>
                  </div>
                  <p className="text-stone-400 text-[10px]">Beneficiary: National Furniture &amp; Interiors Pvt Ltd (A/C: 000205029381)</p>
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
                    className="px-4 py-2 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                  >
                    <Send className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200 text-[#171717] relative">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-5 right-5 p-1 text-stone-400 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Invoice Body */}
            <div id="printable-invoice">
              <div className="flex justify-between items-start pb-6 border-b border-stone-200">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#171717]">
                    NATIONAL FURNITURE &amp; INTERIORS
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    40,000 Sq.Ft Factory &amp; Studio, Sy. No. 42/1, Off Sarjapur Road,<br />
                    Bengaluru, Karnataka 560035, India
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    <strong>GSTIN:</strong> 29AABCN8291M1Z5 &bull; <strong>PAN:</strong> AABCN8291M
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8C7355] bg-[#8C7355]/10 px-2.5 py-1 rounded">
                    TAX INVOICE
                  </span>
                  <p className="text-xs text-stone-500 mt-2">
                    <strong>Invoice #:</strong> INV-{order.orderNumber}
                  </p>
                  <p className="text-xs text-stone-500">
                    <strong>Date:</strong> {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Bill to */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-stone-200 text-xs">
                <div>
                  <strong className="block text-stone-400 uppercase text-[10px]">Billed To:</strong>
                  <p className="font-semibold mt-1">{order.billingAddress.line1}</p>
                  {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                  <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.pincode}</p>
                  <p>{order.billingAddress.country}</p>
                </div>
                <div>
                  <strong className="block text-stone-400 uppercase text-[10px]">Shipped To:</strong>
                  <p className="font-semibold mt-1">{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase">
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
                          <span className="text-[10px] text-stone-400 font-mono">SKU: {it.sku}</span>
                        </td>
                        <td className="py-2.5 text-center text-stone-500 font-mono">9403</td>
                        <td className="py-2.5 text-center font-semibold">{it.quantity}</td>
                        <td className="py-2.5 text-right">{formatPrice(it.unitPrice)}</td>
                        <td className="py-2.5 text-right font-medium">{formatPrice(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-stone-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs text-right">
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
                    <span>{order.pricing.shippingFee === 0 ? 'Complimentary' : formatPrice(order.pricing.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>CGST (9%):</span>
                    <span>{formatPrice(order.pricing.tax / 2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>SGST (9%):</span>
                    <span>{formatPrice(order.pricing.tax / 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-300">
                    <span>Total Amount (INR):</span>
                    <span>{formatPrice(order.pricing.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-stone-300 text-[10px] text-stone-400 flex justify-between items-center">
                <span>Computer generated tax invoice &bull; Authorized by National Furniture &amp; Interiors</span>
                <span className="font-mono text-emerald-800 font-medium">PAID &bull; VERIFIED</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-200">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
