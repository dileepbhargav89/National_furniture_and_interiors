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
      coverImage: apiBlog.coverImage || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop',
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
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
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
      <div className="min-h-screen flex items-center justify-center bg-white text-stone-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest font-light text-stone-400">
            Unfolding Architectural Chronicle…
          </span>
        </div>
      </div>
    );
  }

  if (notFound || !chronicle) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md text-center bg-white p-8 md:p-12 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium block mb-2">
            Archival Record
          </span>
          <h1 className="text-2xl font-serif text-[#171717] mb-3">Chronicle Not Found</h1>
          <p className="text-xs text-stone-500 font-light leading-relaxed mb-6">
            The requested architectural dispatch may have been updated or retired from public circulation.
          </p>
          <Link
            href="/blogs"
            className="inline-flex items-center px-5 py-2.5 bg-[#171717] hover:bg-[#C5A059] text-white text-xs uppercase tracking-widest font-medium rounded-md transition-colors shadow-sm"
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
      <header className="bg-gradient-to-b from-[#FAF9F6] to-white border-b border-stone-200/60 pt-12 pb-14">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-400 mb-8 font-light">
            <Link href="/" className="hover:text-[#171717] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blogs" className="hover:text-[#171717] transition-colors">
              Journal
            </Link>
            <span>/</span>
            <span className="text-[#C5A059] font-normal truncate max-w-xs md:max-w-md">
              {chronicle.category}
            </span>
          </nav>

          {/* Category Tag Pill */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-[#C5A059] text-[#171717]">
              {chronicle.category}
            </span>
            {chronicle.categoryTags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-stone-500 bg-stone-100 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-5xl font-serif font-light text-[#171717] tracking-tight leading-[1.2] mb-6 [text-wrap:balance]">
            {chronicle.title}
          </h1>

          {/* Subtitle / Excerpt */}
          {chronicle.subtitle && (
            <p className="text-base md:text-xl text-stone-600 font-light leading-relaxed mb-8">
              {chronicle.subtitle}
            </p>
          )}

          {/* Author Byline & Publication Date */}
          <div className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#C5A059]/50 shadow-sm">
                <Image
                  src={chronicle.author.avatar}
                  alt={chronicle.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-[#171717] font-serif">
                  {chronicle.author.name}
                </div>
                <div className="text-xs text-stone-500 font-light">
                  {chronicle.author.role} • {chronicle.author.studio}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400 font-light">
              <span>{new Date(chronicle.publishedAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>{chronicle.readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Cinema-Ratio Cover Image */}
      {chronicle.coverImage && (
        <section className="container mx-auto px-4 md:px-8 max-w-5xl py-8">
          <div className="relative w-full aspect-[21/10] md:aspect-[2.2/1] rounded-2xl overflow-hidden shadow-lg bg-stone-100">
            <Image
              src={chronicle.coverImage}
              alt={chronicle.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
          </div>
          <figcaption className="text-[11px] text-stone-400 text-center font-light italic mt-2.5">
            Photographed in situ by National Furniture & Interiors architectural atelier.
          </figcaption>
        </section>
      )}

      {/* 4. Article Content Body */}
      <section className="container mx-auto px-4 md:px-8 max-w-3xl py-8">
        {/* Social Sharing Header */}
        <SocialShareButtons title={chronicle.title} />

        {/* Formatted HTML Prose */}
        <div
          className="prose prose-lg prose-stone max-w-none 
            prose-headings:font-serif prose-headings:font-light prose-headings:text-[#171717]
            prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-4
            prose-p:text-stone-700 prose-p:font-light prose-p:leading-relaxed prose-p:text-base prose-p:md:text-lg
            prose-blockquote:border-l-2 prose-blockquote:border-[#C5A059] prose-blockquote:bg-stone-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-stone-800 prose-blockquote:rounded-r-lg
            prose-strong:font-semibold prose-strong:text-[#171717]
            prose-li:text-stone-700 prose-li:font-light"
          dangerouslySetInnerHTML={{ __html: chronicle.content }}
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
        <div className="my-12 p-6 md:p-8 rounded-2xl bg-[#FAF9F6] border border-stone-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#C5A059] flex-shrink-0">
            <Image
              src={chronicle.author.avatar}
              alt={chronicle.author.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#C5A059] block mb-1">
              About the Author & Studio
            </span>
            <h4 className="text-lg font-serif font-medium text-[#171717]">
              {chronicle.author.name}
            </h4>
            <p className="text-xs text-stone-500 font-light mb-3">
              {chronicle.author.role} • {chronicle.author.studio}
            </p>
            <p className="text-xs md:text-sm text-stone-600 font-light leading-relaxed">
              Ar. Rao oversees bespoke residential commissions across Karnataka, specializing in the union of reclaimed indigenous hardwoods, passive bioclimatic cooling, and contemporary spatial luxury.
            </p>
          </div>
        </div>

        {/* Social Sharing Footer */}
        <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
          <SocialShareButtons title={chronicle.title} />
          <Link
            href="/blogs"
            className="text-xs uppercase tracking-widest text-[#171717] hover:text-[#C5A059] font-medium transition-colors"
          >
            ← Back to Journal
          </Link>
        </div>
      </section>

      {/* 8. More Chronicles from the Atelier (Recommendation Grid) */}
      {relatedChronicles.length > 0 && (
        <section className="py-16 bg-stone-50 border-t border-stone-200">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium block mb-2">
                CONTINUE EXPLORING
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-light text-[#171717]">
                More Chronicles from the Atelier
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedChronicles.map((rc) => (
                <Link
                  key={rc.id}
                  href={`/blogs/${rc.slug}`}
                  className="group flex flex-col justify-between bg-white rounded-xl overflow-hidden border border-stone-200/80 hover:border-[#C5A059]/60 shadow-sm hover:shadow-md transition-all duration-300"
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
                      <span className="absolute top-3 left-3 bg-[#171717]/85 backdrop-blur-sm text-white text-[9px] tracking-widest uppercase font-medium px-2 py-0.5 rounded-sm">
                        {rc.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <span className="text-[10px] text-stone-400 font-light block mb-1">
                        {rc.readTimeMinutes} min read
                      </span>
                      <h4 className="text-base font-serif font-medium text-[#171717] group-hover:text-[#C5A059] transition-colors line-clamp-2 leading-snug mb-2">
                        {rc.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-light line-clamp-2 leading-relaxed">
                        {rc.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>{rc.author.name}</span>
                    <span className="text-[#171717] group-hover:text-[#C5A059] font-medium flex items-center gap-1">
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
