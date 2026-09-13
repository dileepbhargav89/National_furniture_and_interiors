'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CmsService,
  Banner,
  BannerPlacement,
  CreateBannerInput,
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import {
  Plus,
  Search,
  Eye,
  MousePointerClick,
  TrendingUp,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// Placement human labels and colors
const PLACEMENT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  HOMEPAGE_HERO: {
    label: 'Homepage Hero',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Primary full-width interactive luxury carousel on the homepage',
  },
  CATEGORY_TOP: {
    label: 'Category Top',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    desc: 'Banner appearing atop specific catalog department pages',
  },
  PROMO_STRIP: {
    label: 'Urgency Promo Strip',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    desc: 'High-visibility ticker at the top of the storefront',
  },
  COLLECTION_FEATURE: {
    label: 'Collection Feature',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    desc: 'Editorial spotlight banner within curated lookbooks',
  },
};

const DEFAULT_BANNER_FORM: CreateBannerInput = {
  title: '',
  subtitle: '',
  badgeText: 'EXCLUSIVE LAUNCH',
  imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85',
  mobileImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=85',
  linkUrl: '/catalog',
  ctaText: 'Explore Collection',
  secondaryCtaText: 'Book Consultation',
  secondaryLinkUrl: '/consultation',
  placement: BannerPlacement.HOMEPAGE_HERO,
  targetCategory: '',
  discountCode: '',
  sortOrder: 0,
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Simulator States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBannerInput>(DEFAULT_BANNER_FORM);
  const [simulatorDevice, setSimulatorDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await CmsService.adminGetBanners();
      setBanners(res.data || []);
    } catch (err: unknown) {
      console.error('Failed to load admin banners:', err);
      // Graceful fallback to public banners if admin endpoint fails
      try {
        const publicRes = await CmsService.getBanners();
        setBanners(publicRes.data || []);
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to load marketing banners');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const totalImpressions = banners.reduce((acc, b) => acc + (b.impressionCount || 0), 0);
    const totalClicks = banners.reduce((acc, b) => acc + (b.clickCount || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      total,
      active,
      totalImpressions,
      totalClicks,
      avgCtr: avgCtr.toFixed(2),
    };
  }, [banners]);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const matchesPlacement =
        selectedPlacement === 'ALL' || banner.placement === selectedPlacement;
      const matchesSearch =
        !searchQuery ||
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (banner.subtitle && banner.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (banner.discountCode && banner.discountCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (banner.targetCategory && banner.targetCategory.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPlacement && matchesSearch;
    });
  }, [banners, selectedPlacement, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBannerId(null);
    setFormData(DEFAULT_BANNER_FORM);
    setFormError('');
    setSimulatorDevice('desktop');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner: Banner) => {
    setEditingBannerId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      badgeText: banner.badgeText || '',
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || '',
      linkUrl: banner.linkUrl || '',
      ctaText: banner.ctaText || 'Explore Collection',
      secondaryCtaText: banner.secondaryCtaText || '',
      secondaryLinkUrl: banner.secondaryLinkUrl || '',
      placement: banner.placement,
      targetCategory: banner.targetCategory || '',
      discountCode: banner.discountCode || '',
      sortOrder: banner.sortOrder || 0,
      startDate: banner.startDate ? banner.startDate.substring(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.substring(0, 16) : '',
      isActive: banner.isActive,
    });
    setFormError('');
    setSimulatorDevice('desktop');
    setIsModalOpen(true);
  };

  // Toggle active status
  const handleToggleStatus = async (banner: Banner) => {
    const updatedStatus = !banner.isActive;
    try {
      // Optimistic update
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: updatedStatus } : b))
      );
      await CmsService.toggleBannerStatus(banner.id, updatedStatus);
    } catch (err: unknown) {
      console.error('Failed to toggle banner status:', err);
      // Revert optimistic update
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !updatedStatus } : b))
      );
      alert(err instanceof Error ? err.message : 'Failed to update banner status.');
    }
  };

  // Save Banner (Create or Edit)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Headline title is required.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setFormError('Desktop image URL is required.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      if (editingBannerId) {
        const res = await CmsService.updateBanner(editingBannerId, formData);
        if (res.data) {
          const updated = res.data;
          setBanners((prev) =>
            prev.map((b) => (b.id === editingBannerId ? updated : b))
          );
        }
      } else {
        const res = await CmsService.createBanner(formData);
        if (res.data) {
          const created = res.data;
          setBanners((prev) => [created, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to save banner:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save banner. Please check all fields.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await CmsService.deleteBanner(bannerToDelete.id);
      setBanners((prev) => prev.filter((b) => b.id !== bannerToDelete.id));
      setBannerToDelete(null);
    } catch (err: unknown) {
      console.error('Failed to delete banner:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Marketing Banners & Campaigns"
        description="Architect high-converting promotional banners, campaign scheduling, dual-screen assets, and analyze real-time CTR conversion telemetry."
        action={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{ backgroundColor: '#171717', border: '1px solid #C5A059' }}
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            New Campaign Banner
          </button>
        }
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Campaigns
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              Across all placements
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Active Campaigns
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.active}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live on storefront
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Impressions
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {kpis.totalImpressions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              Storefront views recorded
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Clicks & CTR
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">
                {kpis.totalClicks.toLocaleString()}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {kpis.avgCtr}% CTR
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              High intent conversions
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <MousePointerClick className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Placement Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedPlacement('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedPlacement === 'ALL'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Placements ({banners.length})
            </button>
            {Object.keys(PLACEMENT_CONFIG).map((key) => {
              const count = banners.filter((b) => b.placement === key).length;
              const isSelected = selectedPlacement === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlacement(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {PLACEMENT_CONFIG[key]?.label || key} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search headline, coupon, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Banners Listing Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium">Loading luxury marketing banners...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchBanners}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No campaigns found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery || selectedPlacement !== 'ALL'
                ? 'No banners match your active filter criteria.'
                : 'Get started by creating your first luxury campaign banner.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
              Create Banner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Banner & Copy</th>
                  <th className="py-3.5 px-4">Placement</th>
                  <th className="py-3.5 px-4">CTAs & Destination</th>
                  <th className="py-3.5 px-4 text-center">Telemetry (Views / Clicks)</th>
                  <th className="py-3.5 px-4 text-center">Schedule / Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredBanners.map((banner) => {
                  const placementInfo =
                    PLACEMENT_CONFIG[banner.placement] || {
                      label: banner.placement,
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      border: 'border-gray-200',
                    };
                  const ctr =
                    banner.impressionCount && banner.impressionCount > 0
                      ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Banner Thumbnail & Copy */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-4">
                          <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {banner.mobileImageUrl && (
                              <span
                                title="Mobile 4:5 asset included"
                                className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-sm text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5"
                              >
                                <Smartphone className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 max-w-sm">
                            {banner.badgeText && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200/60">
                                {banner.badgeText}
                              </span>
                            )}
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {banner.title}
                            </h4>
                            {banner.subtitle && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {banner.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              {banner.discountCode && (
                                <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <Tag className="w-3 h-3" />
                                  {banner.discountCode}
                                </span>
                              )}
                              {banner.targetCategory && (
                                <span>Dept: {banner.targetCategory}</span>
                              )}
                              <span>Order: {banner.sortOrder}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Placement */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${placementInfo.bg} ${placementInfo.text} ${placementInfo.border}`}
                        >
                          {placementInfo.label}
                        </span>
                      </td>

                      {/* CTAs */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                            <span>{banner.ctaText || 'Learn More'}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-500 font-normal truncate max-w-[120px]">
                              {banner.linkUrl || '#'}
                            </span>
                          </div>
                          {banner.secondaryCtaText && (
                            <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                              <span>{banner.secondaryCtaText}</span>
                              <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                              <span className="text-gray-400 truncate max-w-[120px]">
                                {banner.secondaryLinkUrl || '#'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Telemetry */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-600">
                              {banner.impressionCount || 0} views
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-900 font-semibold">
                              {banner.clickCount || 0} clicks
                            </span>
                          </div>
                          <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {ctr}% CTR
                          </span>
                        </div>
                      </td>

                      {/* Schedule / Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(banner)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                              banner.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                banner.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] font-medium text-gray-500">
                            {banner.isActive ? 'Live' : 'Paused'}
                          </span>
                          {banner.startDate && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(banner.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(banner)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit banner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBannerToDelete(banner)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL WITH LIVE SIMULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBannerId ? 'Edit Campaign Banner' : 'Create New Campaign Banner'}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure responsive creative assets, persuasive CTAs, and preview before publishing.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split Form + Live Simulator */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
              {/* Form Column */}
              <form
                onSubmit={handleSaveBanner}
                id="bannerForm"
                className="lg:col-span-6 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-gray-200"
              >
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Placement & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Placement *
                    </label>
                    <select
                      value={formData.placement}
                      onChange={(e) =>
                        setFormData({ ...formData, placement: e.target.value as BannerPlacement })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    >
                      <option value={BannerPlacement.HOMEPAGE_HERO}>Homepage Hero</option>
                      <option value={BannerPlacement.CATEGORY_TOP}>Category Top</option>
                      <option value={BannerPlacement.PROMO_STRIP}>Urgency Promo Strip</option>
                      <option value={BannerPlacement.COLLECTION_FEATURE}>Collection Feature</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Campaign Status
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({ ...formData, isActive: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="text-xs font-medium text-gray-700">
                        {formData.isActive ? 'Active Immediately' : 'Paused / Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge Text & Sort Order */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pre-Title Badge Pill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BESPOKE MASTERPIECE"
                      value={formData.badgeText || ''}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Priority Order
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.sortOrder || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Headline & Subtitle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Campaign Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Timeless Architectural Living & Dining"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Editorial Subtitle / Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Handcrafted in solid teak and brushed brass. Custom made to your home's exact dimensions."
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                  />
                </div>

                {/* Media Assets */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Desktop Image URL (16:9 Landscape) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Image URL (4:5 Portrait — Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (optimized for smartphone screens)"
                      value={formData.mobileImageUrl || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, mobileImageUrl: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary CTA Text
                    </label>
                    <input
                      type="text"
                      placeholder="Explore Collection"
                      value={formData.ctaText || ''}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary CTA Destination URL
                    </label>
                    <input
                      type="text"
                      placeholder="/catalog"
                      value={formData.linkUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Secondary CTA Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Book Consultation"
                      value={formData.secondaryCtaText || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryCtaText: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Secondary CTA Destination URL
                    </label>
                    <input
                      type="text"
                      placeholder="/consultation"
                      value={formData.secondaryLinkUrl || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryLinkUrl: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Promo Code & Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Coupon Code / Tag (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LUXURY10"
                      value={formData.discountCode || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, discountCode: e.target.value.toUpperCase() })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Target Department / Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Living Room, Dining"
                      value={formData.targetCategory || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, targetCategory: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Date Scheduling */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Campaign Start (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Campaign End (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:bg-white"
                    />
                  </div>
                </div>
              </form>

              {/* LIVE VISUAL PREVIEW SIMULATOR */}
              <div className="lg:col-span-6 bg-gray-900 p-6 flex flex-col justify-between text-white border-t lg:border-t-0 border-gray-800">
                <div>
                  {/* Simulator Device Switcher */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                        Live Visual Simulator
                      </span>
                    </div>
                    <div className="flex items-center bg-gray-800 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSimulatorDevice('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                          simulatorDevice === 'desktop'
                            ? 'bg-gray-700 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        Desktop (16:9)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatorDevice('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                          simulatorDevice === 'mobile'
                            ? 'bg-gray-700 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Mobile (4:5)
                      </button>
                    </div>
                  </div>

                  {/* Simulator Screen Container */}
                  <div className="flex items-center justify-center">
                    {simulatorDevice === 'desktop' ? (
                      /* Desktop Frame */
                      <div className="w-full max-w-lg aspect-[16/9] rounded-xl overflow-hidden relative shadow-2xl border border-gray-700 group bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.imageUrl || DEFAULT_BANNER_FORM.imageUrl}
                          alt="Desktop Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        {/* Luxury Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent p-6 flex flex-col justify-center max-w-xs">
                          {formData.badgeText && (
                            <span className="inline-block self-start px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 mb-2">
                              {formData.badgeText}
                            </span>
                          )}
                          <h2 className="text-base font-bold text-white leading-tight font-serif">
                            {formData.title || 'Your Luxury Headline Here'}
                          </h2>
                          {formData.subtitle && (
                            <p className="text-[11px] text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                              {formData.subtitle}
                            </p>
                          )}
                          {formData.discountCode && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded self-start">
                              <Tag className="w-2.5 h-2.5" />
                              USE CODE: {formData.discountCode}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <span className="px-3 py-1 rounded text-[11px] font-semibold text-black bg-[#C5A059] shadow-sm">
                              {formData.ctaText || 'Explore'}
                            </span>
                            {formData.secondaryCtaText && (
                              <span className="px-3 py-1 rounded text-[11px] font-semibold text-white border border-white/40">
                                {formData.secondaryCtaText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Frame */
                      <div className="w-56 aspect-[4/5] rounded-2xl overflow-hidden relative shadow-2xl border-4 border-gray-700 bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            formData.mobileImageUrl ||
                            formData.imageUrl ||
                            DEFAULT_BANNER_FORM.imageUrl
                          }
                          alt="Mobile Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        {/* Mobile Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
                          {formData.badgeText && (
                            <span className="inline-block self-start px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 mb-1">
                              {formData.badgeText}
                            </span>
                          )}
                          <h2 className="text-xs font-bold text-white leading-tight font-serif">
                            {formData.title || 'Mobile Headline'}
                          </h2>
                          {formData.discountCode && (
                            <div className="mt-1 text-[9px] text-emerald-400">
                              CODE: {formData.discountCode}
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5 mt-2">
                            <span className="w-full py-1 text-center rounded text-[10px] font-bold text-black bg-[#C5A059]">
                              {formData.ctaText || 'Explore'}
                            </span>
                            {formData.secondaryCtaText && (
                              <span className="w-full py-1 text-center rounded text-[10px] font-bold text-white border border-white/40">
                                {formData.secondaryCtaText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {editingBannerId ? 'Updating existing banner' : 'Creating new banner'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="bannerForm"
                      disabled={isSaving}
                      className="px-5 py-2 text-xs font-bold text-black bg-[#C5A059] hover:bg-[#d4af37] disabled:opacity-50 rounded-lg shadow transition-all active:scale-95"
                    >
                      {isSaving ? 'Saving...' : editingBannerId ? 'Update Banner' : 'Publish Banner'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Campaign Banner?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete the campaign{' '}
              <strong className="text-gray-900">&ldquo;{bannerToDelete.title}&rdquo;</strong>?
              This will remove all associated conversion and CTR analytics records.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBanner}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
