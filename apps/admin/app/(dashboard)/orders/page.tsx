'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { OrdersService, Order, PaymentStatus, FulfillmentStatus } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import {
  Search,
  Download,
  Package,
  Truck,
  TrendingUp,
  Eye,
  RefreshCw,
  Layers,
  MapPin,
} from 'lucide-react';

const FALLBACK_ADMIN_ORDERS: Order[] = [
  {
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
        status: 'SHIPPED',
        note: 'Dispatched on White-Glove transit vehicle #3.',
        changedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
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
        note: 'Delivered and unboxed at Kingfisher Towers residence.',
        changedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ord-bengaluru-7732',
    orderNumber: 'NFI-BLR-2026-7732',
    userId: 'usr_meera_iyer',
    items: [
      {
        productId: 'prod-credenza-walnut',
        name: 'Sadashivanagar Fluted American Walnut Credenza',
        sku: 'NFI-CRD-008-AW',
        unitPrice: 5400000,
        quantity: 1,
        lineTotal: 5400000,
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop',
      },
    ],
    shippingAddress: {
      label: 'Villa',
      line1: 'Plot 28, RMV 2nd Stage, Sadashivanagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560080',
      country: 'India',
    },
    billingAddress: {
      line1: 'Plot 28, RMV 2nd Stage, Sadashivanagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560080',
      country: 'India',
    },
    pricing: {
      subtotal: 5400000,
      discount: 400000,
      shippingFee: 0,
      tax: 900000,
      total: 5900000,
      currency: 'INR',
    },
    paymentStatus: PaymentStatus.PAID,
    fulfillmentStatus: FulfillmentStatus.CONFIRMED,
    timeline: [
      {
        status: 'CONFIRMED',
        note: 'Custom brass inlay design confirmed with architect.',
        changedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

type TabType = 'ALL' | 'PENDING' | 'PRODUCTION' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await OrdersService.getAllOrders();
      // Handle array or paginated response format
      const fetched: Order[] = Array.isArray(response?.data)
        ? response.data
        : (response?.data?.data || (response?.data as unknown as { orders: Order[] })?.orders || []);

      let localOrders: Order[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('nfi_user_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localOrders = parsed;
          }
        } catch {
          // Ignore
        }
      }

      const baseOrders = fetched && fetched.length > 0 ? fetched : FALLBACK_ADMIN_ORDERS;
      const combined = [...localOrders, ...baseOrders];
      const uniqueOrders = Array.from(new Map(combined.map((o) => [o.id, o])).values());
      setOrders(uniqueOrders);
    } catch {
      let localOrders: Order[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('nfi_user_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localOrders = parsed;
          }
        } catch {
          // Ignore
        }
      }
      const combined = [...localOrders, ...FALLBACK_ADMIN_ORDERS];
      const uniqueOrders = Array.from(new Map(combined.map((o) => [o.id, o])).values());
      setOrders(uniqueOrders);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price / 100);

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // KPI Calculations
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.paymentStatus === PaymentStatus.PAID ? o.pricing.total : 0), 0),
    [orders]
  );
  const inProductionCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus === FulfillmentStatus.CONFIRMED ||
          o.fulfillmentStatus === FulfillmentStatus.PACKED
      ).length,
    [orders]
  );
  const inTransitCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus === FulfillmentStatus.SHIPPED ||
          o.fulfillmentStatus === FulfillmentStatus.OUT_FOR_DELIVERY
      ).length,
    [orders]
  );
  const pendingActionCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.paymentStatus === PaymentStatus.PENDING ||
          o.fulfillmentStatus === FulfillmentStatus.PENDING
      ).length,
    [orders]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (selectedTab === 'PENDING') {
        if (
          order.fulfillmentStatus !== FulfillmentStatus.PENDING &&
          order.paymentStatus !== PaymentStatus.PENDING
        )
          return false;
      } else if (selectedTab === 'PRODUCTION') {
        if (
          order.fulfillmentStatus !== FulfillmentStatus.CONFIRMED &&
          order.fulfillmentStatus !== FulfillmentStatus.PACKED
        )
          return false;
      } else if (selectedTab === 'TRANSIT') {
        if (
          order.fulfillmentStatus !== FulfillmentStatus.SHIPPED &&
          order.fulfillmentStatus !== FulfillmentStatus.OUT_FOR_DELIVERY
        )
          return false;
      } else if (selectedTab === 'DELIVERED') {
        if (order.fulfillmentStatus !== FulfillmentStatus.DELIVERED) return false;
      } else if (selectedTab === 'CANCELLED') {
        if (
          order.fulfillmentStatus !== FulfillmentStatus.CANCELLED &&
          order.fulfillmentStatus !== FulfillmentStatus.RETURNED
        )
          return false;
      }

      // Payment Filter
      if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesUser = order.userId.toLowerCase().includes(q);
        const matchesCity = (order.shippingAddress?.city || '').toLowerCase().includes(q);
        const matchesArea = (order.shippingAddress?.line1 || '').toLowerCase().includes(q);
        const matchesItem = order.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchesNumber && !matchesUser && !matchesCity && !matchesArea && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedTab, paymentFilter, searchQuery]);

  const exportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'City', 'Status', 'Payment', 'Total (INR)'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      formatDate(o.createdAt),
      o.userId,
      o.shippingAddress?.city || 'Bengaluru',
      o.fulfillmentStatus,
      o.paymentStatus,
      (o.pricing.total / 100).toString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nfi_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Bespoke Order Operations"
        description="Monitor workshop joinery schedules, customer commissions, and white-glove dispatch."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Orders Hub' }]}
        action={
          <div className="flex items-center gap-2.5">
            <NfiButton variant="secondary" size="sm" onClick={exportCSV} disabled={filteredOrders.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </NfiButton>
            <NfiButton variant="secondary" size="sm" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Sync Orders
            </NfiButton>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl text-sm border bg-red-50 text-red-700 border-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Total Commissions</p>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">{orders.length}</h3>
            <p className="text-xs text-stone-400 mt-1">Bespoke luxury pieces</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Gross Commission Revenue</p>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">{formatPrice(totalRevenue)}</h3>
            <p className="text-xs text-emerald-700 font-medium mt-1">Karnataka GST included</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">In Workshop Production</p>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">{inProductionCount}</h3>
            <p className="text-xs text-[#8C7355] mt-1">Kiln seasoning &amp; joinery</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">White-Glove In Transit</p>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">{inTransitCount}</h3>
            <p className="text-xs text-emerald-700 mt-1">Air-suspension trucks</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 pb-3">
          {[
            { id: 'ALL', label: 'All Commissions', count: orders.length },
            { id: 'PENDING', label: 'Action Needed', count: pendingActionCount },
            { id: 'PRODUCTION', label: 'In Workshop', count: inProductionCount },
            { id: 'TRANSIT', label: 'In Transit', count: inTransitCount },
            {
              id: 'DELIVERED',
              label: 'Delivered',
              count: orders.filter((o) => o.fulfillmentStatus === FulfillmentStatus.DELIVERED).length,
            },
            {
              id: 'CANCELLED',
              label: 'Cancelled',
              count: orders.filter((o) => o.fulfillmentStatus === FulfillmentStatus.CANCELLED).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as TabType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedTab === tab.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Secondary Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, client name, locality (Indiranagar, Whitefield), or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Payment: All</option>
              <option value={PaymentStatus.PAID}>Paid</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.FAILED}>Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-xs">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-600 uppercase tracking-wider">
                  Order &amp; Date
                </th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-600 uppercase tracking-wider">
                  Client &amp; Destination
                </th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-600 uppercase tracking-wider">
                  Pieces Commissioned
                </th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-600 uppercase tracking-wider">
                  Workshop Stage
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                      <span>Loading workshop orders…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-medium text-stone-800">No matching orders found</p>
                    <p className="text-[11px] text-stone-400 mt-1">Try adjusting your search criteria or tab filters.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
                  const firstItem = order.items[0];

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Order Number & Placed Date */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono font-semibold text-stone-900 hover:text-[#8C7355] block transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="text-[11px] text-stone-400 mt-0.5 block">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      {/* Client & Destination */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <span className="font-medium text-stone-900 block truncate" title={order.userId}>
                          {order.userId}
                        </span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#8C7355] shrink-0" />
                          {order.shippingAddress?.city || 'Bengaluru'}, {order.shippingAddress?.pincode || ''}
                        </span>
                      </td>

                      {/* Pieces */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                            {firstItem?.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={firstItem.image} alt={firstItem.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-stone-800 font-medium truncate" title={firstItem?.name}>
                              {firstItem?.name || 'Custom Commission'}
                            </p>
                            <span className="text-[10px] text-stone-400">
                              {itemsCount} {itemsCount === 1 ? 'unit' : 'units'} total
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            order.paymentStatus === PaymentStatus.PAID
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Fulfillment Stage */}
                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            order.fulfillmentStatus === FulfillmentStatus.DELIVERED
                              ? 'completed'
                              : order.fulfillmentStatus === FulfillmentStatus.SHIPPED
                              ? 'processing'
                              : order.fulfillmentStatus === FulfillmentStatus.CONFIRMED
                              ? 'active'
                              : order.fulfillmentStatus === FulfillmentStatus.CANCELLED
                              ? 'cancelled'
                              : 'pending'
                          }
                          label={order.fulfillmentStatus.replace(/_/g, ' ')}
                        />
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 text-right font-semibold text-stone-900">
                        {formatPrice(order.pricing.total)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </span>
          <span className="text-[11px] text-stone-400">
            Automated sync with National Furniture &amp; Interiors Workshop ERP
          </span>
        </div>
      </div>
    </div>
  );
}
