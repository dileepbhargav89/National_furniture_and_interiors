'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CmsService } from '@nfi/api-client';
import type { Blog } from '@nfi/api-client';
import { BlogStatus } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';

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
      setModalError(err instanceof Error ? err.message : 'Failed to save chronicle. Please verify data integrity.');
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
      alert(err instanceof Error ? `Could not update status: ${err.message}` : 'Could not update status');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
            Total Chronicles
          </span>
          <span className="text-2xl font-serif font-semibold text-[#171717] mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-[#2E7D32] font-medium block">
            Live Published
          </span>
          <span className="text-2xl font-serif font-semibold text-[#2E7D32] mt-1 block">
            {stats.published}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-[#B7791F] font-medium block">
            Editorial Drafts
          </span>
          <span className="text-2xl font-serif font-semibold text-[#B7791F] mt-1 block">
            {stats.drafts}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-[#C5A059] font-medium block">
            Total Readership Views
          </span>
          <span className="text-2xl font-serif font-semibold text-[#171717] mt-1 block">
            {stats.totalViews.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Control Strip */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', BlogStatus.PUBLISHED, BlogStatus.DRAFT, BlogStatus.ARCHIVED] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors ${
                  statusFilter === status
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {/* Search input */}
        <div className="relative md:w-72">
          <input
            type="text"
            placeholder="Search chronicles by title or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059] transition-colors"
          />
          <svg
            className="w-4 h-4 text-stone-400 absolute left-3 top-2"
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
        <div className="p-12 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
          <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs uppercase tracking-widest font-light">Loading editorial chronicles…</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 shadow-sm">
          <span className="text-sm font-medium text-[#171717] block mb-1">No Chronicles Found</span>
          <p className="text-xs text-stone-500 font-light mb-4">
            Create your first luxury architectural story or adjust your filter selection.
          </p>
          <NfiButton variant="primary" size="sm" onClick={handleOpenCreateModal}>
            + Create First Story
          </NfiButton>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-wider font-medium text-left">
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
                  <tr key={blog.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.coverImage && (
                          <div className="relative w-12 h-9 rounded-md overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                            <Image
                              src={blog.coverImage}
                              alt={blog.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-serif font-medium text-sm text-[#171717]">
                            {blog.title}
                          </div>
                          <div className="text-stone-400 text-[11px] font-mono">
                            /blogs/{blog.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={blog.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(blog.categoryTags || []).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-stone-600 font-medium">
                      {(blog.viewCount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-light">
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(blog)}
                        className="text-[11px] text-stone-500 hover:text-stone-800 underline decoration-stone-300"
                        title="Toggle Draft/Published"
                      >
                        {blog.status === BlogStatus.PUBLISHED ? 'Make Draft' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(blog)}
                        className="text-[11px] text-[#C5A059] hover:text-[#b08e4a] font-medium"
                      >
                        Edit
                      </button>

                      <Link
                        href={`http://localhost:3000/blogs/${blog.slug}`}
                        target="_blank"
                        className="text-[11px] text-stone-400 hover:text-stone-600"
                      >
                        View ↗
                      </Link>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-base font-serif font-medium text-[#171717]">
                  {editingBlogId ? 'Edit Architectural Story' : 'Author New Architectural Story'}
                </h3>
                <p className="text-[11px] text-stone-500 font-light">
                  Publish bespoke narratives with rich photography and shoppable piece references.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveBlog} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  {modalError}
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Harmonizing Reclaimed Burma Teak…"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="harmonizing-reclaimed-burma-teak"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Excerpt / Lead */}
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Excerpt / Editorial Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                  placeholder="A concise summary displayed on the journal index and social cards…"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Category Tags & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Category Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.categoryTags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, categoryTags: e.target.value }))
                    }
                    placeholder="Architectural Tours, Burma Teak, Penthouses"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value as BlogStatus }))
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value={BlogStatus.PUBLISHED}>PUBLISHED (Live on Storefront)</option>
                    <option value={BlogStatus.DRAFT}>DRAFT (Hidden from Storefront)</option>
                    <option value={BlogStatus.ARCHIVED}>ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, coverImage: e.target.value }))
                  }
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                />
                {formData.coverImage && (
                  <div className="mt-2 relative w-full h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
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
                <label className="block font-medium text-stone-700 mb-1">
                  Story Content (HTML / Prose)
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059] font-mono text-[11px]"
                />
              </div>

              {/* SEO Metadata Details */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-[#C5A059] font-semibold block">
                  SEO & Search Optimization
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-stone-600 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))
                      }
                      placeholder="Defaults to story title"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-600 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.seoKeywords}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, seoKeywords: e.target.value }))
                      }
                      placeholder="teak furniture, penthouse interior, Bangalore"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <NfiButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </NfiButton>

                <NfiButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Chronicle…' : editingBlogId ? 'Update Chronicle' : 'Publish Chronicle'}
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
