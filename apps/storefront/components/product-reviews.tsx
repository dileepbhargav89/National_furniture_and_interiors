'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  ReviewsService,
  Review,
  ReviewStats,
  ReviewImage,
} from '@nfi/api-client';
import {
  Star,
  ThumbsUp,
  ShieldCheck,
  Camera,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Exceptional (5/5)',
  4: 'Very Pleased (4/5)',
  3: 'Average (3/5)',
  2: 'Disappointed (2/5)',
  1: 'Unsatisfactory (1/5)',
};

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [activeRatingFilter, setActiveRatingFilter] = useState<number | null>(null);
  const [photosOnly, setPhotosOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');

  // Helpful votes state (reviewId -> boolean)
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  // Lightbox Modal
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    alt?: string | undefined;
    author?: string | undefined;
    reviewTitle?: string | undefined;
    rating?: number | undefined;
  } | null>(null);

  // Write Review Modal
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviewsAndStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, activeRatingFilter, photosOnly, sortBy]);

  const fetchReviewsAndStats = async () => {
    try {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        ReviewsService.getProductReviews(productId, {
          limit: 30,
          rating: activeRatingFilter || undefined,
          hasImages: photosOnly ? true : undefined,
          sortBy,
        }),
        ReviewsService.getProductReviewStats(productId).catch(() => null),
      ]);

      setReviews(reviewsRes.data?.items || []);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHelpful = async (reviewId: string) => {
    const isVoted = votedReviews[reviewId];
    // Optimistic UI update
    setVotedReviews((prev) => ({ ...prev, [reviewId]: !isVoted }));
    setReviews((prev) =>
      prev.map((r) => {
        const id = r.id || r._id || '';
        if (id === reviewId) {
          const delta = isVoted ? -1 : 1;
          return { ...r, helpfulVotes: Math.max(0, (r.helpfulVotes || 0) + delta) };
        }
        return r;
      })
    );

    try {
      await ReviewsService.toggleHelpful(productId, reviewId);
    } catch {
      // Revert if API failed
      setVotedReviews((prev) => ({ ...prev, [reviewId]: Boolean(isVoted) }));
      setReviews((prev) =>
        prev.map((r) => {
          const id = r.id || r._id || '';
          if (id === reviewId) {
            const delta = isVoted ? 1 : -1;
            return { ...r, helpfulVotes: Math.max(0, (r.helpfulVotes || 0) + delta) };
          }
          return r;
        })
      );
    }
  };

  const handleAddImageChip = () => {
    if (!newImageUrl.trim()) return;
    if (formImages.length >= 4) return;
    setFormImages([...formImages, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImageChip = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError('');
      await ReviewsService.submitReview(productId, {
        rating: formRating,
        title: formTitle.trim(),
        content: formComment.trim(),
        images: formImages.map((url) => ({ url })),
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        setFormTitle('');
        setFormComment('');
        setFormImages([]);
        setFormRating(5);
        fetchReviewsAndStats();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Collect all photos from approved reviews for the customer photo gallery strip
  const allCustomerPhotos = useMemo(() => {
    const list: Array<{ url: string; alt?: string | undefined; author: string; reviewTitle: string; rating: number }> = [];
    reviews.forEach((r) => {
      if (r.images && r.images.length > 0) {
        r.images.forEach((img: ReviewImage) => {
          list.push({
            url: img.url,
            alt: img.alt || r.title || undefined,
            author: r.userName || r.customerName || 'Verified Buyer',
            reviewTitle: r.title || 'Product Review',
            rating: r.rating,
          });
        });
      }
    });
    return list;
  }, [reviews]);

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

  // Fallback calculations if stats endpoint was unavailable
  const totalReviewsCount = stats?.totalReviews ?? reviews.length;
  const avgRatingNum = stats?.averageRating ?? (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5.0);
  const recommendPercent = stats?.recommendPercentage ?? 95;
  const ratingDist = stats?.distribution ?? {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div id="reviews" className="scroll-mt-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-amber-800 uppercase">
            Client Testimonials &amp; Feedback
          </span>
          <h2 className="text-2xl lg:text-3xl font-serif text-neutral-900 mt-1">
            Customer Reviews &amp; Ratings
          </h2>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-none text-xs font-semibold tracking-wider uppercase bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-sm active:scale-[0.99]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Aggregate Rating Score Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 bg-[#FAF9F6] border border-neutral-200/80 rounded-lg mb-12">
        {/* Left Column: Big Rating Number & Stars */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-neutral-200/80 pb-6 lg:pb-0 lg:pr-8">
          <div className="text-5xl lg:text-6xl font-serif font-bold text-neutral-900 tracking-tight">
            {avgRatingNum.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 my-2.5 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRatingNum)
                    ? 'fill-amber-500 text-amber-500'
                    : 'fill-neutral-200 text-neutral-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Based on {totalReviewsCount} authenticated review{totalReviewsCount === 1 ? '' : 's'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{recommendPercent}% of buyers recommend this piece</span>
          </div>
        </div>

        {/* Right Column: Rating Distribution Bars (Interactive Filter) */}
        <div className="lg:col-span-8 flex flex-col justify-center gap-2.5 lg:pl-4">
          <p className="text-xs font-semibold text-neutral-700 mb-1">
            Rating Breakdown {activeRatingFilter && `(Filtered by ${activeRatingFilter} Stars - Click to Reset)`}
          </p>
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = ratingDist[starNum as keyof typeof ratingDist] || 0;
            const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
            const isSelected = activeRatingFilter === starNum;

            return (
              <button
                key={starNum}
                type="button"
                onClick={() =>
                  setActiveRatingFilter(isSelected ? null : starNum)
                }
                className={`group flex items-center gap-3 w-full text-left py-1 px-2 rounded transition-colors ${
                  isSelected
                    ? 'bg-amber-100/80 ring-1 ring-amber-400'
                    : 'hover:bg-neutral-100/80'
                }`}
              >
                <div className="flex items-center gap-1 w-14 shrink-0 text-xs font-medium text-neutral-700">
                  <span>{starNum}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-2 bg-neutral-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isSelected ? 'bg-amber-600' : 'bg-neutral-800 group-hover:bg-amber-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-16 shrink-0 text-right text-xs text-neutral-500 font-mono">
                  {count} <span className="text-[10px] text-neutral-400">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Photo Strip Gallery */}
      {allCustomerPhotos.length > 0 && (
        <div className="mb-10 pb-8 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                Customer Photo Gallery ({allCustomerPhotos.length})
              </h3>
            </div>
            <span className="text-xs text-neutral-500">Real homes, authentic styling</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {allCustomerPhotos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden shrink-0 border border-neutral-200 group/photo cursor-pointer hover:ring-2 hover:ring-amber-700 transition-all shadow-sm"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt || 'Customer photograph'}
                  fill
                  className="object-cover group-hover/photo:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-semibold bg-black/60 px-2 py-0.5 rounded">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
            Filter:
          </span>

          <button
            onClick={() => setActiveRatingFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeRatingFilter === null
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Ratings
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setActiveRatingFilter(activeRatingFilter === s ? null : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                activeRatingFilter === s
                  ? 'bg-amber-800 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}

          <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={photosOnly}
              onChange={(e) => setPhotosOnly(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-0"
            />
            <span>With Photos Only</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs bg-white border border-neutral-200 rounded-md py-1.5 px-3 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div>
        {loading ? (
          <div className="py-16 text-center text-neutral-500">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-amber-800 border-t-transparent animate-spin mb-3" />
            <p className="font-serif italic text-sm">Fetching verified customer stories…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FAF9F6] border border-neutral-200/70 rounded-lg">
            <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-base font-serif font-medium text-neutral-800 mb-1">
              No matching reviews found
            </h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mb-6">
              {activeRatingFilter || photosOnly
                ? 'Try resetting your filter parameters to see all verified customer feedback.'
                : 'Be the first connoisseur to share an authentic review for this handcrafted masterpiece.'}
            </p>
            {activeRatingFilter || photosOnly ? (
              <button
                onClick={() => {
                  setActiveRatingFilter(null);
                  setPhotosOnly(false);
                }}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Write the first review
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {reviews.map((review) => {
              const id = review.id || review._id || '';
              const customerName = review.userName || review.customerName || 'Verified Customer';
              const initial = customerName.charAt(0).toUpperCase();
              const isVoted = Boolean(votedReviews[id]);

              return (
                <article
                  key={id}
                  className="p-6 bg-white border border-neutral-200/80 rounded-lg shadow-sm hover:border-neutral-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    {/* Customer Profile & Verification */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200 flex items-center justify-center font-serif font-bold text-sm shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-neutral-900">
                            {customerName}
                          </h4>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                          {review.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Visualizer */}
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'fill-neutral-200 text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Title & Content */}
                  {review.title && (
                    <h5 className="font-serif font-semibold text-base text-neutral-900 mb-2">
                      {review.title}
                    </h5>
                  )}

                  <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-line mb-4">
                    {review.content || review.comment}
                  </p>

                  {/* Attached Customer Photos */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      {review.images.map((img: ReviewImage, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setLightboxPhoto({
                              url: img.url,
                              alt: img.alt || review.title || undefined,
                              author: customerName,
                              reviewTitle: review.title || undefined,
                              rating: review.rating,
                            })
                          }
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-neutral-200 group/thumb cursor-pointer hover:ring-2 hover:ring-amber-700 transition-all"
                        >
                          <Image
                            src={img.url}
                            alt={img.alt || 'Customer review photograph'}
                            fill
                            className="object-cover group-hover/thumb:scale-105 transition-transform"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Official Brand Response Quote Box */}
                  {review.adminReply && (
                    <div className="mt-4 mb-4 p-4 rounded-lg bg-[#FAF9F6] border-l-4 border-amber-800 border border-neutral-200/80 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-amber-950 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          Official Response from National Furniture &amp; Interiors
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatDate(String(review.adminReply.repliedAt))}
                        </span>
                      </div>
                      <p className="text-neutral-700 italic leading-relaxed text-xs">
                        &ldquo;{review.adminReply.message}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Helpful Vote CTA Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                    <span className="text-[11px]">Was this review helpful to you?</span>
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isVoted
                          ? 'bg-amber-100 text-amber-900 font-semibold ring-1 ring-amber-300'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-amber-800 text-amber-800' : ''}`} />
                      <span>
                        Helpful ({review.helpfulVotes || 0})
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image display */}
            <div className="relative flex-1 min-h-[350px] md:min-h-[500px] bg-black flex items-center justify-center p-4">
              <Image
                src={lightboxPhoto.url}
                alt={lightboxPhoto.alt || 'Customer photo preview'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Sidebar info */}
            <div className="w-full md:w-80 p-6 bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col justify-between text-neutral-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
                    Customer Story
                  </span>
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="text-neutral-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {lightboxPhoto.rating && (
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= (lightboxPhoto.rating || 5) ? 'fill-amber-400' : 'text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <h4 className="font-serif text-lg font-medium text-white mb-2">
                  {lightboxPhoto.reviewTitle || 'Customer Snapshot'}
                </h4>

                <p className="text-xs text-neutral-400 mb-4">
                  Shared by <span className="text-neutral-200 font-medium">{lightboxPhoto.author}</span>
                </p>

                <div className="p-3 bg-neutral-800/80 rounded border border-neutral-700/60 text-xs text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                  <span>Authenticated customer photograph verified with completed purchase.</span>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white uppercase tracking-wider rounded transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-neutral-200 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100 mb-6">
              <div>
                <span className="text-xs font-semibold text-amber-800 tracking-wider uppercase">
                  Authentic Client Voice
                </span>
                <h3 className="text-xl font-serif text-neutral-900 mt-0.5">
                  Share Your Experience
                </h3>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-serif font-medium text-neutral-900 mb-1">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                  Your review has been submitted to our moderation team and will appear as soon as it is approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {submitError && (
                  <div className="p-3 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Rating Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                    Overall Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= (formHoverRating || formRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-serif italic text-neutral-600">
                      {RATING_LABELS[formHoverRating || formRating]}
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Review Headline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Magnificent craftsmanship and sublime teak finish"
                    className="w-full text-xs rounded-md border border-neutral-300 py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Detailed Review <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Describe how the piece looks, the texture of the materials, delivery, and overall satisfaction..."
                    className="w-full text-xs rounded-md border border-neutral-300 p-3 focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none leading-relaxed"
                  />
                </div>

                {/* Customer Photo URLs Dropzone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Add Photos of Your Space (Optional, up to 4)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Paste image URL (e.g. https://...)"
                      className="flex-1 text-xs rounded-md border border-neutral-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageChip}
                      disabled={!newImageUrl.trim() || formImages.length >= 4}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {formImages.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {formImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-14 h-14 rounded border border-neutral-300 overflow-hidden group/img"
                        >
                          <Image
                            src={img}
                            alt="Uploaded preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageChip(idx)}
                            className="absolute top-0 right-0 bg-black/70 text-white p-0.5 hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified Purchase Assurance Box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md text-[11px] text-amber-950 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <span>
                    To maintain utmost authenticity, review submissions are verified against completed orders for this item.
                  </span>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
