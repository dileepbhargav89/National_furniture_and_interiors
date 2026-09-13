'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { ReviewsService, Review, ReviewImage } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { ConfirmModal } from '@/components/ui/confirm-modal';

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill={star <= rating ? '#B7791F' : '#E3E3E0'}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsDashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [hasPhotosFilter, setHasPhotosFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  const [activePhoto, setActivePhoto] = useState<{ url: string; alt?: string; title?: string; customer?: string } | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ReviewsService.listReviews({ limit: 100 });
      setReviews(response.data?.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const featured = reviews.filter((r) => r.isFeatured).length;
    const avgRating =
      approved > 0
        ? (
            reviews
              .filter((r) => r.status === 'APPROVED')
              .reduce((sum, r) => sum + r.rating, 0) / approved
          ).toFixed(1)
        : total > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : '0.0';

    return { total, pending, approved, featured, avgRating };
  }, [reviews]);

  // Tab & Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Tab filter
      if (activeTab === 'PENDING' && review.status !== 'PENDING') return false;
      if (activeTab === 'APPROVED' && review.status !== 'APPROVED') return false;
      if (activeTab === 'REJECTED' && review.status !== 'REJECTED') return false;
      if (activeTab === 'FEATURED' && !review.isFeatured) return false;

      // Rating filter
      if (ratingFilter && review.rating !== parseInt(ratingFilter, 10)) return false;

      // Has photos filter
      if (hasPhotosFilter && (!review.images || review.images.length === 0)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customer = (review.userName || review.customerName || '').toLowerCase();
        const title = (review.title || '').toLowerCase();
        const content = (review.content || review.comment || '').toLowerCase();
        const product = (review.productName || review.productId || '').toLowerCase();
        const sku = (review.productSku || '').toLowerCase();

        return (
          customer.includes(query) ||
          title.includes(query) ||
          content.includes(query) ||
          product.includes(query) ||
          sku.includes(query)
        );
      }

      return true;
    });
  }, [reviews, activeTab, ratingFilter, hasPhotosFilter, searchQuery]);

  const handleModerate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await ReviewsService.moderateReview(id, { status });
      setReviews((prev) =>
        prev.map((r) => ((r.id === id || r._id === id) ? { ...r, status } : r))
      );
    } catch (err) {
      console.error('Failed to moderate review', err);
    }
  };

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      const review = reviews.find((r) => r.id === id || r._id === id);
      if (!review) return;
      await ReviewsService.moderateReview(id, {
        status: 'APPROVED',
        isFeatured: !currentFeatured,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id ? { ...r, isFeatured: !currentFeatured } : r
        )
      );
    } catch (err) {
      console.error('Failed to toggle featured', err);
    }
  };

  const handleOpenReplyModal = (review: Review) => {
    setReplyReview(review);
    setReplyMessage(review.adminReply?.message || '');
    setReplyError('');
  };

  const handleSubmitReply = async () => {
    if (!replyReview) return;
    const id = replyReview.id || replyReview._id || '';
    if (!replyMessage.trim()) {
      setReplyError('Reply message cannot be blank');
      return;
    }

    try {
      setReplySubmitting(true);
      setReplyError('');
      const response = await ReviewsService.replyToReview(id, { message: replyMessage.trim() });
      const updated = response.data;
      if (updated) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id || r._id === id ? { ...r, adminReply: updated.adminReply } : r))
        );
      }
      setReplyReview(null);
      setReplyMessage('');
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleteLoading(true);
      await ReviewsService.deleteReview(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId && r._id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete review', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <PageHeader
        title="Customer Reviews & Ratings"
        description="Moderate customer testimonials, curate featured social proof, and respond with official brand replies."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Reviews' }]}
        action={
          <div className="flex items-center gap-2">
            <NfiButton variant="secondary" size="sm" onClick={fetchReviews} disabled={loading}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </NfiButton>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-white rounded-lg p-5 border flex items-center justify-between"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Reviews
            </p>
            <p className="text-2xl font-bold mt-1 text-neutral-900">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        </div>

        <div
          className="bg-white rounded-lg p-5 border flex items-center justify-between"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Pending Moderation
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-neutral-900">{stats.pending}</span>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
                  Requires Action
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div
          className="bg-white rounded-lg p-5 border flex items-center justify-between"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Approved Reviews
            </p>
            <p className="text-2xl font-bold mt-1 text-neutral-900">{stats.approved}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div
          className="bg-white rounded-lg p-5 border flex items-center justify-between"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Average Rating
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-bold text-neutral-900">{stats.avgRating}</span>
              <span className="text-amber-500 text-lg">★</span>
              <span className="text-xs text-neutral-400 font-normal">/ 5.0</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-5 p-4 rounded-md text-sm border flex items-center justify-between"
          style={{
            backgroundColor: 'rgba(198,40,40,0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198,40,40,0.2)',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Tabs & Advanced Filters */}
      <div
        className="bg-white rounded-t-lg border border-b-0 p-4"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b lg:border-b-0 pb-2 lg:pb-0 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Reviews', count: stats.total },
              { key: 'PENDING', label: 'Pending', count: stats.pending },
              { key: 'APPROVED', label: 'Approved', count: stats.approved },
              { key: 'FEATURED', label: 'Featured', count: stats.featured },
              { key: 'REJECTED', label: 'Rejected', count: reviews.filter((r) => r.status === 'REJECTED').length },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reviews, customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs rounded-md border py-1.5 pl-8 pr-3 bg-neutral-50 focus:bg-white w-60 transition-colors"
                style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
              />
              <svg
                className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="text-xs rounded-md border py-1.5 pl-2.5 pr-7 bg-neutral-50"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text)' }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer select-none bg-neutral-50 border px-2.5 py-1.5 rounded-md" style={{ borderColor: 'var(--nfi-border)' }}>
              <input
                type="checkbox"
                checked={hasPhotosFilter}
                onChange={(e) => setHasPhotosFilter(e.target.checked)}
                className="rounded text-amber-700 focus:ring-0"
              />
              <span>With Photos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div
        className="bg-white rounded-b-lg border overflow-hidden shadow-sm"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                <th
                  className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  style={{ width: '22%' }}
                >
                  Product
                </th>
                <th
                  className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  style={{ width: '18%' }}
                >
                  Customer & Date
                </th>
                <th
                  className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  style={{ width: '38%' }}
                >
                  Review Content & Photos
                </th>
                <th
                  className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  style={{ width: '10%' }}
                >
                  Status
                </th>
                <th
                  className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  style={{ width: '12%' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-neutral-500">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--nfi-primary)' }}
                      />
                      <span className="font-serif italic">Loading customer testimonials…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-neutral-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="font-medium text-neutral-800">No reviews found</p>
                      <p className="text-xs text-neutral-500">
                        Try adjusting your filters or active tab criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const id = review.id || review._id || '';
                  const customerName = review.userName || review.customerName || 'Anonymous Customer';
                  const title = review.title || 'Review';
                  const content = review.content || review.comment || '';
                  const images = review.images || [];

                  return (
                    <tr
                      key={id}
                      className="group transition-colors hover:bg-neutral-50/70"
                    >
                      {/* Product details */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded border bg-neutral-100 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                            {review.productImage ? (
                              <Image
                                src={review.productImage}
                                alt={review.productName || 'Product'}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 truncate max-w-[180px]">
                              {review.productName || 'Product'}
                            </p>
                            {review.productSku && (
                              <p className="text-[10px] text-neutral-500 font-mono">
                                SKU: {review.productSku}
                              </p>
                            )}
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate max-w-[150px]">
                              ID: {review.productId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Timestamp */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-neutral-900 leading-snug">
                              {customerName}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {formatDate(review.createdAt)}
                            </p>
                            {review.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-200/50">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Review details, stars, comment & customer photo thumbnails */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-xs font-bold text-neutral-900">{title}</span>
                          </div>

                          <p className="text-xs text-neutral-700 leading-relaxed max-w-xl">
                            {content}
                          </p>

                          {/* Customer Photos thumbnail gallery */}
                          {images.length > 0 && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {images.map((img: ReviewImage, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    setActivePhoto({
                                      url: img.url,
                                      alt: img.alt || title,
                                      title,
                                      customer: customerName,
                                    })
                                  }
                                  className="w-12 h-12 rounded border bg-neutral-100 relative overflow-hidden group/photo cursor-pointer hover:ring-2 hover:ring-amber-700 transition-all flex-shrink-0"
                                >
                                  <Image
                                    src={img.url}
                                    alt={img.alt || 'Customer photo'}
                                    fill
                                    className="object-cover group-hover/photo:scale-105 transition-transform"
                                    unoptimized
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                  </div>
                                </button>
                              ))}
                              <span className="text-[10px] text-neutral-400 font-medium">
                                ({images.length} photo{images.length > 1 ? 's' : ''})
                              </span>
                            </div>
                          )}

                          {/* Brand official reply quote if exists */}
                          {review.adminReply && (
                            <div className="mt-2.5 p-2.5 rounded bg-amber-50/70 border border-amber-200/60 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-amber-900 flex items-center gap-1 text-[11px]">
                                  <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  Official Response from National Furniture
                                </span>
                                <span className="text-[10px] text-amber-800/60">
                                  {formatDate(String(review.adminReply.repliedAt))}
                                </span>
                              </div>
                              <p className="text-amber-950/80 italic text-[11px]">
                                &ldquo;{review.adminReply.message}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Helpful votes indicator */}
                          <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                              {review.helpfulVotes || 0} helpful vote{review.helpfulVotes === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status & Featured */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2 items-start">
                          <StatusBadge
                            status={review.status?.toLowerCase() ?? 'pending'}
                            label={review.status}
                          />

                          <button
                            type="button"
                            onClick={() => handleToggleFeature(id, review.isFeatured)}
                            disabled={review.status !== 'APPROVED'}
                            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${
                              review.isFeatured
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                            } ${review.status !== 'APPROVED' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={review.status !== 'APPROVED' ? 'Approve review first to feature' : 'Toggle Featured'}
                          >
                            <svg
                              className={`w-3 h-3 ${review.isFeatured ? 'text-amber-600 fill-amber-500' : 'text-neutral-400'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            {review.isFeatured ? 'Featured' : 'Feature'}
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {review.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleModerate(id, 'APPROVED')}
                              className="text-xs font-semibold px-2.5 py-1 rounded transition-colors text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm"
                            >
                              Approve
                            </button>
                          )}

                          {review.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleModerate(id, 'REJECTED')}
                              className="text-xs font-medium px-2.5 py-1 rounded border text-rose-700 border-rose-200 hover:bg-rose-50 transition-colors"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReplyModal(review)}
                            className="text-xs font-medium px-2.5 py-1 rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            {review.adminReply ? 'Edit Reply' : 'Reply'}
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(id)}
                            className="text-xs text-neutral-400 hover:text-rose-600 transition-colors pt-1"
                            title="Delete review"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredReviews.length > 0 && (
          <div
            className="px-5 py-3 border-t flex items-center justify-between text-xs text-neutral-500"
            style={{
              borderColor: 'var(--nfi-border)',
              backgroundColor: 'var(--nfi-surface-muted)',
            }}
          >
            <span>
              Showing {filteredReviews.length} of {reviews.length} total reviews
            </span>
            <span className="font-mono text-[11px] text-neutral-400">
              National Furniture Moderation Engine
            </span>
          </div>
        )}
      </div>

      {/* Admin Reply Modal */}
      {replyReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border relative"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {replyReview.adminReply ? 'Update Official Response' : 'Compose Official Response'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Publishing as National Furniture &amp; Interiors
                </p>
              </div>
              <button
                onClick={() => setReplyReview(null)}
                className="text-neutral-400 hover:text-neutral-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Context review snippet */}
            <div className="p-3 rounded bg-neutral-50 border text-xs mb-4" style={{ borderColor: 'var(--nfi-border)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-neutral-800">
                  {replyReview.userName || replyReview.customerName || 'Customer'}
                </span>
                <span className="text-amber-600 font-medium">
                  {replyReview.rating} ★
                </span>
              </div>
              <p className="text-neutral-600 italic line-clamp-2">
                &ldquo;{replyReview.content || replyReview.comment}&rdquo;
              </p>
            </div>

            {replyError && (
              <div className="mb-3 p-2.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200">
                {replyError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Official Brand Message
              </label>
              <textarea
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Thank you for sharing your feedback. At National Furniture & Interiors, our artisan craftsmen..."
                className="w-full text-xs rounded-md border p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-700"
                style={{ borderColor: 'var(--nfi-border)' }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <NfiButton
                variant="secondary"
                size="sm"
                onClick={() => setReplyReview(null)}
                disabled={replySubmitting}
              >
                Cancel
              </NfiButton>
              <NfiButton
                variant="primary"
                size="sm"
                onClick={handleSubmitReply}
                loading={replySubmitting}
              >
                Publish Response
              </NfiButton>
            </div>
          </div>
        </div>
      )}

      {/* Customer Photo Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-neutral-300">
              <div>
                <p className="text-xs font-semibold text-white">{activePhoto.title || 'Customer Photo'}</p>
                <p className="text-[11px] text-neutral-400">Uploaded by {activePhoto.customer || 'Customer'}</p>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative flex-1 min-h-[400px] w-full bg-black flex items-center justify-center p-2">
              <Image
                src={activePhoto.url}
                alt={activePhoto.alt || 'Customer photo preview'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={Boolean(deleteTargetId)}
        title="Delete Customer Review"
        description="Are you sure you want to permanently delete this customer review? If this review was approved, product rating averages will automatically be recalculated."
        confirmLabel="Delete Review"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
}
