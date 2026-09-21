'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CmsService } from '@nfi/api-client';
import type { Blog } from '@nfi/api-client';
import { BLOG_CHRONICLES, type BlogChronicle } from '../../../data/blog-chronicles';
import { ReadingProgressBar } from '../../../components/blogs/reading-progress-bar';
import { ShoppableProductsStrip } from '../../../components/blogs/shoppable-products-strip';
import { ArticleConsultationCta } from '../../../components/blogs/article-consultation-cta';
import { SocialShareButtons } from '../../../components/blogs/social-share-buttons';
import { sanitizeHtml } from '../../../lib/sanitize-html';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [apiBlog, setApiBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Check local curated chronicles first
  const localChronicle = useMemo(() => {
    return BLOG_CHRONICLES.find((c) => c.slug === slug) || null;
  }, [slug]);

  useEffect(() => {
    // If found in curated chronicles, we're ready immediately!
    if (localChronicle) {
      setIsLoading(false);
      return;
    }

    async function loadRemoteBlog() {
      try {
        const res = await CmsService.getBlogBySlug(slug);
        if (res.data) {
          setApiBlog(res.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error loading chronicle', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadRemoteBlog();
    }
  }, [slug, localChronicle]);

  // Unified chronicle shape
  const chronicle: BlogChronicle | null = useMemo(() => {
    if (localChronicle) return localChronicle;
    if (!apiBlog) return null;

    return {
      id: apiBlog.id,
      slug: apiBlog.slug,
      title: apiBlog.title,
      subtitle: apiBlog.excerpt || '',
      excerpt: apiBlog.excerpt || '',
      content: apiBlog.content,
      coverImage:
        apiBlog.coverImage ||
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop',
      galleryImages: [],
      category: (apiBlog.categoryTags?.[0] as BlogChronicle['category']) || 'Architectural Tours',
      categoryTags: apiBlog.categoryTags || ['Bespoke', 'Atelier'],
      readTimeMinutes: Math.max(3, Math.round(apiBlog.content.split(' ').length / 200)),
      publishedAt: apiBlog.publishedAt || apiBlog.createdAt,
      viewCount: apiBlog.viewCount || 120,
      author: {
        name: 'Atelier Editorial Desk',
        role: 'Architectural Historian',
        studio: 'National Flagship Studio, Indiranagar',
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
      },
      shoppableProducts: [],
      seo: {
        title: apiBlog.seo?.title || apiBlog.title,
        description: apiBlog.seo?.description || apiBlog.excerpt || '',
        keywords: apiBlog.seo?.keywords || [],
      },
    };
  }, [localChronicle, apiBlog]);

  // Related chronicles
  const relatedChronicles = useMemo(() => {
    if (!chronicle) return [];
    return BLOG_CHRONICLES.filter((c) => c.slug !== chronicle.slug).slice(0, 3);
  }, [chronicle]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-stone-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A059] border-t-transparent" />
          <span className="text-xs font-light uppercase tracking-widest text-stone-400">
            Unfolding Architectural Chronicle…
          </span>
        </div>
      </div>
    );
  }

  if (notFound || !chronicle) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm md:p-12">
          <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-[#C5A059]">
            Archival Record
          </span>
          <h1 className="mb-3 font-serif text-2xl text-[#171717]">Chronicle Not Found</h1>
          <p className="mb-6 text-xs font-light leading-relaxed text-stone-500">
            The requested architectural dispatch may have been updated or retired from public
            circulation.
          </p>
          <Link
            href="/blogs"
            className="inline-flex items-center rounded-md bg-[#171717] px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#C5A059]"
          >
            ← Return to Journal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white text-[#171717]">
      {/* 1. Viewport Reading Progress Bar */}
      <ReadingProgressBar />

      {/* 2. Breadcrumbs & Header Section */}
      <header className="border-b border-stone-200/60 bg-gradient-to-b from-[#FAF9F6] to-white pb-14 pt-12">
        <div className="container mx-auto max-w-4xl px-4 md:px-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-xs font-light text-stone-400"
          >
            <Link href="/" className="transition-colors hover:text-[#171717]">
              Home
            </Link>
            <span>/</span>
            <Link href="/blogs" className="transition-colors hover:text-[#171717]">
              Journal
            </Link>
            <span>/</span>
            <span className="max-w-xs truncate font-normal text-[#C5A059] md:max-w-md">
              {chronicle.category}
            </span>
          </nav>

          {/* Category Tag Pill */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#C5A059] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#171717]">
              {chronicle.category}
            </span>
            {chronicle.categoryTags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-500"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="mb-6 font-serif text-3xl font-light leading-[1.2] tracking-tight text-[#171717] [text-wrap:balance] md:text-5xl lg:text-5xl">
            {chronicle.title}
          </h1>

          {/* Subtitle / Excerpt */}
          {chronicle.subtitle && (
            <p className="mb-8 text-base font-light leading-relaxed text-stone-600 md:text-xl">
              {chronicle.subtitle}
            </p>
          )}

          {/* Author Byline & Publication Date */}
          <div className="flex flex-col justify-between gap-4 border-t border-stone-200/80 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#C5A059]/50 shadow-sm">
                <Image
                  src={chronicle.author.avatar}
                  alt={chronicle.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-serif text-sm font-medium text-[#171717]">
                  {chronicle.author.name}
                </div>
                <div className="text-xs font-light text-stone-500">
                  {chronicle.author.role} • {chronicle.author.studio}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-light text-stone-400">
              <span>
                {new Date(chronicle.publishedAt).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{chronicle.readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Cinema-Ratio Cover Image */}
      {chronicle.coverImage && (
        <section className="container mx-auto max-w-5xl px-4 py-8 md:px-8">
          <div className="relative aspect-[21/10] w-full overflow-hidden rounded-2xl bg-stone-100 shadow-lg md:aspect-[2.2/1]">
            <Image
              src={chronicle.coverImage}
              alt={chronicle.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
          </div>
          <figcaption className="mt-2.5 text-center text-[11px] font-light italic text-stone-400">
            Photographed in situ by National Furniture & Interiors architectural atelier.
          </figcaption>
        </section>
      )}

      {/* 4. Article Content Body */}
      <section className="container mx-auto max-w-3xl px-4 py-8 md:px-8">
        {/* Social Sharing Header */}
        <SocialShareButtons title={chronicle.title} />

        {/* Formatted HTML Prose */}
        <div
          className="prose prose-lg prose-stone prose-headings:font-serif prose-headings:font-light prose-headings:text-[#171717] prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-stone-700 prose-p:font-light prose-p:leading-relaxed prose-p:text-base prose-p:md:text-lg prose-blockquote:border-l-2 prose-blockquote:border-[#C5A059] prose-blockquote:bg-stone-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-stone-800 prose-blockquote:rounded-r-lg prose-strong:font-semibold prose-strong:text-[#171717] prose-li:text-stone-700 prose-li:font-light max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(chronicle.content) }}
        />

        {/* 5. Business Oriented: Shoppable Pieces Inset */}
        {chronicle.shoppableProducts && chronicle.shoppableProducts.length > 0 && (
          <ShoppableProductsStrip
            products={chronicle.shoppableProducts}
            title="Featured in this Residence"
            subtitle="Heirloom furnishings crafted by our master joiners for this architectural commission."
          />
        )}

        {/* 6. Business Oriented: Lead Consultation Banner */}
        <ArticleConsultationCta storyTitle={chronicle.title} />

        {/* 7. Author Bio & Atelier Credentials */}
        <div className="my-12 flex flex-col items-center gap-6 rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-6 sm:flex-row sm:items-start md:p-8">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#C5A059]">
            <Image
              src={chronicle.author.avatar}
              alt={chronicle.author.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-left">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-[#C5A059]">
              About the Author & Studio
            </span>
            <h4 className="font-serif text-lg font-medium text-[#171717]">
              {chronicle.author.name}
            </h4>
            <p className="mb-3 text-xs font-light text-stone-500">
              {chronicle.author.role} • {chronicle.author.studio}
            </p>
            <p className="text-xs font-light leading-relaxed text-stone-600 md:text-sm">
              Ar. Rao oversees bespoke residential commissions across Karnataka, specializing in the
              union of reclaimed indigenous hardwoods, passive bioclimatic cooling, and contemporary
              spatial luxury.
            </p>
          </div>
        </div>

        {/* Social Sharing Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 pt-6">
          <SocialShareButtons title={chronicle.title} />
          <Link
            href="/blogs"
            className="text-xs font-medium uppercase tracking-widest text-[#171717] transition-colors hover:text-[#C5A059]"
          >
            ← Back to Journal
          </Link>
        </div>
      </section>

      {/* 8. More Chronicles from the Atelier (Recommendation Grid) */}
      {relatedChronicles.length > 0 && (
        <section className="border-t border-stone-200 bg-stone-50 py-16">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-[#C5A059]">
                CONTINUE EXPLORING
              </span>
              <h3 className="font-serif text-2xl font-light text-[#171717] md:text-3xl">
                More Chronicles from the Atelier
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {relatedChronicles.map((rc) => (
                <Link
                  key={rc.id}
                  href={`/blogs/${rc.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition-all duration-300 hover:border-[#C5A059]/60 hover:shadow-md"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                      <Image
                        src={rc.coverImage}
                        alt={rc.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <span className="absolute left-3 top-3 rounded-sm bg-[#171717]/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white backdrop-blur-sm">
                        {rc.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <span className="mb-1 block text-[10px] font-light text-stone-400">
                        {rc.readTimeMinutes} min read
                      </span>
                      <h4 className="mb-2 line-clamp-2 font-serif text-base font-medium leading-snug text-[#171717] transition-colors group-hover:text-[#C5A059]">
                        {rc.title}
                      </h4>
                      <p className="line-clamp-2 text-xs font-light leading-relaxed text-stone-500">
                        {rc.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 px-5 pb-5 pt-3 text-xs text-stone-400">
                    <span>{rc.author.name}</span>
                    <span className="flex items-center gap-1 font-medium text-[#171717] group-hover:text-[#C5A059]">
                      Read →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
