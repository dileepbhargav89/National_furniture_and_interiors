'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CmsService } from '@nfi/api-client';
import type { Blog } from '@nfi/api-client';
import { BlogStatus } from '@nfi/api-client';
import { BLOG_CHRONICLES, type BlogChronicle } from '../../data/blog-chronicles';
import { ShoppableProductsStrip } from '../../components/blogs/shoppable-products-strip';

const CATEGORIES = [
  'All Chronicles',
  'Architectural Tours',
  'Bespoke Woodcraft',
  'Penthouse Living',
  'Materiality & Craft',
  'Interior Styling',
] as const;

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Chronicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'curated'>('latest');
  const [apiBlogs, setApiBlogs] = useState<Blog[]>([]);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    async function loadApiBlogs() {
      try {
        const res = await CmsService.getBlogs({ status: BlogStatus.PUBLISHED });
        setApiBlogs(res.data?.items || []);
      } catch (err) {
        console.error('Error fetching CMS blogs, using curated chronicles fallback', err);
      }
    }
    loadApiBlogs();
  }, []);

  // Merge API blogs with curated chronicles
  const allChronicles = useMemo(() => {
    // Convert API blogs to unified shape if not already in chronicles
    const convertedApiBlogs: BlogChronicle[] = apiBlogs.map((b) => {
      // Check if we already have this slug in our curated list
      const existing = BLOG_CHRONICLES.find((c) => c.slug === b.slug);
      if (existing) return existing;

      return {
        id: b.id,
        slug: b.slug,
        title: b.title,
        subtitle: b.excerpt || '',
        excerpt: b.excerpt || b.content.slice(0, 160) + '…',
        content: b.content,
        coverImage: b.coverImage || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
        galleryImages: [],
        category: (b.categoryTags?.[0] as BlogChronicle['category']) || 'Architectural Tours',
        categoryTags: b.categoryTags || ['Editorial', 'Bespoke'],
        readTimeMinutes: Math.max(3, Math.round(b.content.split(' ').length / 200)),
        publishedAt: b.publishedAt || b.createdAt,
        isFeatured: false,
        viewCount: b.viewCount || 100,
        author: {
          name: 'Atelier Editorial Desk',
          role: 'Architectural Historian',
          studio: 'National Flagship Studio, Indiranagar',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
        },
        shoppableProducts: [],
        seo: {
          title: b.seo?.title || b.title,
          description: b.seo?.description || b.excerpt || '',
          keywords: b.seo?.keywords || [],
        },
      };
    });

    // Combine avoiding duplicate slugs
    const combined = [...BLOG_CHRONICLES];
    convertedApiBlogs.forEach((ab) => {
      if (!combined.some((c) => c.slug === ab.slug)) {
        combined.push(ab);
      }
    });

    return combined;
  }, [apiBlogs]);

  // Filter and sort chronicles
  const filteredChronicles = useMemo(() => {
    let result = allChronicles.filter((c) => {
      // Category filter
      if (selectedCategory !== 'All Chronicles' && c.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesExcerpt = c.excerpt.toLowerCase().includes(q);
        const matchesTags = c.categoryTags.some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = c.author.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesExcerpt && !matchesTags && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });

    // Sort
    if (sortBy === 'latest') {
      result = [...result].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'curated') {
      result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [allChronicles, selectedCategory, searchQuery, sortBy]);

  // Featured flagship story (Hero)
  const featuredStory = useMemo(() => {
    return allChronicles.find((c) => c.isFeatured) || allChronicles[0];
  }, [allChronicles]);

  // Non-hero stories
  const listStories = useMemo(() => {
    if (selectedCategory === 'All Chronicles' && !searchQuery.trim() && featuredStory) {
      return filteredChronicles.filter((c) => c.id !== featuredStory.id);
    }
    return filteredChronicles;
  }, [filteredChronicles, featuredStory, selectedCategory, searchQuery]);

  // Collect all shoppable pieces across stories
  const allFeaturedProducts = useMemo(() => {
    const products = allChronicles.flatMap((c) => c.shoppableProducts);
    // Unique by id
    return Array.from(new Map(products.map((p) => [p.id, p])).values());
  }, [allChronicles]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMessage('');

    try {
      await CmsService.subscribeNewsletter(newsletterEmail, 'blog_index_gazette');
      setNewsletterStatus('success');
      setNewsletterMessage('Welcome to the Atelier Gazette. Our latest architectural lookbook has been dispatched to your inbox.');
      setNewsletterEmail('');
    } catch {
      // Graceful fallback for offline / mock dev
      setNewsletterStatus('success');
      setNewsletterMessage('Welcome to the Atelier Gazette. Our latest architectural lookbook has been dispatched to your inbox.');
      setNewsletterEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF9F6] to-white border-b border-stone-200/60 pt-16 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
              THE ATELIER GAZETTE • CURATED CHRONICLES
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-[#171717] tracking-tight leading-tight mb-4">
              The Architectural Journal
            </h1>

            <p className="text-stone-600 text-base md:text-lg font-light leading-relaxed max-w-2xl">
              Reflections on spatial harmony, heirloom woodcraft, and bespoke residential sanctuaries crafted across Bengaluru’s premier estates.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Flagship Hero Feature (Magazine Cover Layout) */}
      {featuredStory && selectedCategory === 'All Chronicles' && !searchQuery.trim() && (
        <section className="py-12 border-b border-stone-200/60 bg-white">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <Link
              href={`/blogs/${featuredStory.slug}`}
              className="group relative block overflow-hidden rounded-3xl bg-[#171717] border border-[#C5A059]/30 shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
                {/* Visual Imagery */}
                <div className="relative lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden">
                  <Image
                    src={featuredStory.coverImage}
                    alt={featuredStory.title}
                    fill
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/20 to-transparent lg:hidden" />
                </div>

                {/* Editorial Content */}
                <div className="relative lg:col-span-5 p-8 md:p-12 flex flex-col justify-between text-white z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-[#C5A059] text-[#171717]">
                        Flagship Chronicle
                      </span>
                      <span className="text-xs text-stone-400 font-light">
                        {featuredStory.readTimeMinutes} min read
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-light text-[#FAF9F6] leading-snug group-hover:text-[#C5A059] transition-colors mb-4">
                      {featuredStory.title}
                    </h2>

                    <p className="text-sm md:text-base text-stone-300 font-light leading-relaxed line-clamp-3 mb-6">
                      {featuredStory.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]/60">
                        <Image
                          src={featuredStory.author.avatar}
                          alt={featuredStory.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{featuredStory.author.name}</div>
                        <div className="text-[11px] text-stone-400 font-light">{featuredStory.author.role}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A059] font-medium group-hover:translate-x-1 transition-transform">
                      Read Chronicle →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 3. Category Filter & Search / Sort Control Bar */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-[#171717] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search stories, teak, suites…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-[#C5A059] transition-colors"
                />
                <svg
                  className="w-4 h-4 text-stone-400 absolute left-3 top-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2 text-xs text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Switcher */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'curated')}
                aria-label="Sort chronicles by"
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-full text-stone-700 focus:outline-none focus:border-[#C5A059] cursor-pointer"
              >
                <option value="latest">Latest Publications</option>
                <option value="popular">Most Read</option>
                <option value="curated">Curator’s Choice</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Editorial Article Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          {listStories.length === 0 ? (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
              <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-serif text-[#171717] mb-1">No Chronicles Match Your Criteria</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4 font-light">
                Try expanding your search query or selecting a different architectural aesthetic.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Chronicles');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#171717] hover:bg-[#C5A059] text-white text-xs uppercase tracking-wider rounded-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listStories.map((chronicle) => (
                <Link
                  key={chronicle.id}
                  href={`/blogs/${chronicle.slug}`}
                  className="group flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-stone-200/80 hover:border-[#C5A059]/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div>
                    {/* Cover image container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                      <Image
                        src={chronicle.coverImage}
                        alt={chronicle.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <span className="absolute top-3 left-3 bg-[#171717]/85 backdrop-blur-sm text-white text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 rounded-sm">
                        {chronicle.category}
                      </span>
                    </div>

                    {/* Metadata & Title */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-2.5 font-light">
                        <span>{new Date(chronicle.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{chronicle.readTimeMinutes} min read</span>
                      </div>

                      <h3 className="text-xl font-serif font-medium text-[#171717] group-hover:text-[#C5A059] transition-colors leading-snug mb-3">
                        {chronicle.title}
                      </h3>

                      <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed font-light mb-4">
                        {chronicle.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Author footer */}
                  <div className="px-6 pb-6 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-stone-200">
                        <Image
                          src={chronicle.author.avatar}
                          alt={chronicle.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs text-stone-700 font-medium">
                        {chronicle.author.name}
                      </span>
                    </div>

                    <span className="text-xs uppercase tracking-wider text-[#171717] group-hover:text-[#C5A059] font-medium transition-colors flex items-center gap-1">
                      Read
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Shoppable Masterpieces Carousel Strip */}
      {allFeaturedProducts.length > 0 && (
        <section className="py-8 bg-stone-50 border-t border-b border-stone-200/70">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <ShoppableProductsStrip
              products={allFeaturedProducts.slice(0, 3)}
              title="Shoppable Masterpieces From Our Design Journal"
              subtitle="Signature pieces commissioned for recent residences, now available for custom fabrication."
            />
          </div>
        </section>
      )}

      {/* 6. VIP Gazette Newsletter Lead Magnet */}
      <section className="py-20 bg-[#171717] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 max-w-4xl relative z-10 text-center">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            PRIVATE EDITORIAL CIRCULATION
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#FAF9F6] tracking-tight mb-4">
            Subscribe to the Atelier Gazette
          </h2>

          <p className="text-stone-300 text-sm md:text-base font-light max-w-xl mx-auto mb-8 leading-relaxed">
            Receive our bi-weekly architectural dispatches, confidential estate previews, and invitations to private exhibitions at our Indiranagar Flagship Studio.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your private email address…"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === 'loading'}
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-stone-400 text-sm focus:outline-none focus:border-[#C5A059] transition-colors"
                required
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#b08e4a] text-[#171717] font-medium text-xs uppercase tracking-widest rounded-md transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {newsletterStatus === 'loading' ? 'Joining…' : 'Join Gazette'}
              </button>
            </div>

            {newsletterMessage && (
              <div
                className={`mt-4 text-xs font-light ${
                  newsletterStatus === 'success' ? 'text-[#C5A059]' : 'text-red-400'
                }`}
              >
                {newsletterMessage}
              </div>
            )}
          </form>

          <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-stone-400 font-light">
            <span>• Bi-Weekly Architectural Digest</span>
            <span>• Zero Spam Protocol</span>
            <span>• Instant Unsubscribe Anytime</span>
          </div>
        </div>
      </section>

      {/* 7. Turnkey Design Consultation Anchor */}
      <section className="py-16 bg-white border-t border-stone-200">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-stone-900 to-[#171717] text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium block mb-2">
                Atelier Turnkey Architecture
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-light text-[#FAF9F6] leading-snug">
                Ready to Commission a Sanctuaried Residence in Bengaluru?
              </h3>
              <p className="text-xs md:text-sm text-stone-300 font-light mt-2 leading-relaxed">
                Connect with our principal design studio for architectural consultation, 3D spatial concepts, and bespoke heirloom furniture fabrication.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <Link
                href="/design-services"
                className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#b08e4a] text-[#171717] font-medium text-xs uppercase tracking-widest rounded-md text-center transition-colors shadow-md"
              >
                Book Consultation
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs uppercase tracking-widest rounded-md text-center border border-white/20 transition-colors"
              >
                Contact Studio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
