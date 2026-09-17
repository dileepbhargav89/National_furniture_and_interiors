'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { CmsService } from '@nfi/api-client';
import type { Blog } from '@nfi/api-client';
import { BlogStatus } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { getStorefrontUrl } from '@/lib/storefront';

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  categoryTags: string;
  coverImage: string;
  status: BlogStatus;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

const DEFAULT_FORM_DATA: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  categoryTags: 'Architectural Tours, Bespoke Living',
  coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200',
  status: BlogStatus.PUBLISHED,
  content: '<p>Write your architectural story here…</p>',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BlogStatus>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await CmsService.getBlogs({ limit: 100 });
      setBlogs(res.data?.items || []);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve editorial chronicles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filtered stories
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      if (statusFilter !== 'ALL' && blog.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = blog.title.toLowerCase().includes(q);
        const matchesSlug = blog.slug.toLowerCase().includes(q);
        const matchesTags = (blog.categoryTags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSlug && !matchesTags) return false;
      }
      return true;
    });
  }, [blogs, statusFilter, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const published = blogs.filter((b) => b.status === BlogStatus.PUBLISHED).length;
    const drafts = blogs.filter((b) => b.status === BlogStatus.DRAFT).length;
    const totalViews = blogs.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
    return {
      total: blogs.length,
      published,
      drafts,
      totalViews,
    };
  }, [blogs]);

  const handleOpenCreateModal = () => {
    setEditingBlogId(null);
    setFormData(DEFAULT_FORM_DATA);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog: Blog) => {
    setEditingBlogId(blog.id);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      categoryTags: (blog.categoryTags || []).join(', '),
      coverImage: blog.coverImage || '',
      status: blog.status,
      content: blog.content,
      seoTitle: blog.seo?.title || '',
      seoDescription: blog.seo?.description || '',
      seoKeywords: (blog.seo?.keywords || []).join(', '),
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const newSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title: val,
      // only auto-generate slug if not editing an existing story
      slug: editingBlogId ? prev.slug : newSlug,
    }));
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      setModalError('Title and URL slug are required.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    const payload: Partial<Blog> = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      excerpt: formData.excerpt.trim(),
      categoryTags: formData.categoryTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      coverImage: formData.coverImage.trim(),
      status: formData.status,
      content: formData.content,
      seo: {
        title: formData.seoTitle.trim() || formData.title.trim(),
        description: formData.seoDescription.trim() || formData.excerpt.trim(),
        keywords: formData.seoKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      },
    };

    try {
      if (editingBlogId) {
        await CmsService.updateBlog(editingBlogId, payload);
      } else {
        await CmsService.createBlog(payload);
      }
      setIsModalOpen(false);
      await fetchBlogs();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error
          ? err.message
          : 'Failed to save chronicle. Please verify data integrity.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    const nextStatus =
      blog.status === BlogStatus.PUBLISHED ? BlogStatus.DRAFT : BlogStatus.PUBLISHED;
    try {
      await CmsService.updateBlog(blog.id, { status: nextStatus });
      await fetchBlogs();
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? `Could not update status: ${err.message}`
          : 'Could not update status',
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Journal & Editorial Chronicles"
        description="Curate luxury architectural articles, spatial case studies, and shoppable design stories for the public storefront."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'CMS Engine', href: '/cms/blogs' },
          { label: 'Editorial Journal' },
        ]}
        action={
          <NfiButton variant="primary" size="md" onClick={handleOpenCreateModal}>
            <span className="mr-1.5 font-bold">+</span> New Architectural Story
          </NfiButton>
        }
      />

      {/* 2. Top Executive KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-400">
            Total Chronicles
          </span>
          <span className="mt-1 block font-serif text-2xl font-semibold text-[#171717]">
            {stats.total}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[#2E7D32]">
            Live Published
          </span>
          <span className="mt-1 block font-serif text-2xl font-semibold text-[#2E7D32]">
            {stats.published}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[#B7791F]">
            Editorial Drafts
          </span>
          <span className="mt-1 block font-serif text-2xl font-semibold text-[#B7791F]">
            {stats.drafts}
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[#C5A059]">
            Total Readership Views
          </span>
          <span className="mt-1 block font-serif text-2xl font-semibold text-[#171717]">
            {stats.totalViews.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Control Strip */}
      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', BlogStatus.PUBLISHED, BlogStatus.DRAFT, BlogStatus.ARCHIVED] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                  statusFilter === status
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        {/* Search input */}
        <div className="relative md:w-72">
          <input
            type="text"
            placeholder="Search chronicles by title or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-xs transition-colors focus:border-[#C5A059] focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2 h-4 w-4 text-stone-400"
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
        </div>
      </div>

      {/* 4. Table of Chronicles */}
      {isLoading ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#C5A059] border-t-transparent" />
          <span className="text-xs font-light uppercase tracking-widest">
            Loading editorial chronicles…
          </span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <span className="mb-1 block text-sm font-medium text-[#171717]">No Chronicles Found</span>
          <p className="mb-4 text-xs font-light text-stone-500">
            Create your first luxury architectural story or adjust your filter selection.
          </p>
          <NfiButton variant="primary" size="sm" onClick={handleOpenCreateModal}>
            + Create First Story
          </NfiButton>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50 text-left text-[11px] font-medium uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-3.5">Chronicle</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Category Tags</th>
                  <th className="px-6 py-3.5">Views</th>
                  <th className="px-6 py-3.5">Published Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="transition-colors hover:bg-stone-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.coverImage && (
                          <div className="relative h-9 w-12 flex-shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                            <Image
                              src={blog.coverImage}
                              alt={blog.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-serif text-sm font-medium text-[#171717]">
                            {blog.title}
                          </div>
                          <div className="font-mono text-[11px] text-stone-400">
                            /blogs/{blog.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={blog.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {(blog.categoryTags || []).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-medium text-stone-600">
                      {(blog.viewCount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-light text-stone-500">
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="space-x-2 whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(blog)}
                        className="text-[11px] text-stone-500 underline decoration-stone-300 hover:text-stone-800"
                        title="Toggle Draft/Published"
                      >
                        {blog.status === BlogStatus.PUBLISHED ? 'Make Draft' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(blog)}
                        className="text-[11px] font-medium text-[#C5A059] hover:text-[#b08e4a]"
                      >
                        Edit
                      </button>

                      <a
                        href={getStorefrontUrl(`/blogs/${blog.slug}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-stone-400 hover:text-stone-600"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Create / Edit Story Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
              <div>
                <h3 className="font-serif text-base font-medium text-[#171717]">
                  {editingBlogId ? 'Edit Architectural Story' : 'Author New Architectural Story'}
                </h3>
                <p className="text-[11px] font-light text-stone-500">
                  Publish bespoke narratives with rich photography and shoppable piece references.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lg leading-none text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveBlog}
              className="flex-1 space-y-4 overflow-y-auto p-6 text-xs"
            >
              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
                  {modalError}
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-stone-700">Story Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Harmonizing Reclaimed Burma Teak…"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-stone-700">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="harmonizing-reclaimed-burma-teak"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Excerpt / Lead */}
              <div>
                <label className="mb-1 block font-medium text-stone-700">
                  Excerpt / Editorial Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A concise summary displayed on the journal index and social cards…"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* Category Tags & Status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-stone-700">
                    Category Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.categoryTags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, categoryTags: e.target.value }))
                    }
                    placeholder="Architectural Tours, Burma Teak, Penthouses"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-stone-700">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value as BlogStatus }))
                    }
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                  >
                    <option value={BlogStatus.PUBLISHED}>PUBLISHED (Live on Storefront)</option>
                    <option value={BlogStatus.DRAFT}>DRAFT (Hidden from Storefront)</option>
                    <option value={BlogStatus.ARCHIVED}>ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="mb-1 block font-medium text-stone-700">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                />
                {formData.coverImage && (
                  <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                    <Image
                      src={formData.coverImage}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div>
                <label className="mb-1 block font-medium text-stone-700">
                  Story Content (HTML / Prose)
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-[11px] focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* SEO Metadata Details */}
              <div className="space-y-3 border-t border-stone-100 pt-3">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#C5A059]">
                  SEO & Search Optimization
                </span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-medium text-stone-600">Meta Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))
                      }
                      placeholder="Defaults to story title"
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-stone-600">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.seoKeywords}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, seoKeywords: e.target.value }))
                      }
                      placeholder="teak furniture, penthouse interior, Bangalore"
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
                <NfiButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </NfiButton>

                <NfiButton type="submit" variant="primary" size="sm" disabled={isSaving}>
                  {isSaving
                    ? 'Saving Chronicle…'
                    : editingBlogId
                      ? 'Update Chronicle'
                      : 'Publish Chronicle'}
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
