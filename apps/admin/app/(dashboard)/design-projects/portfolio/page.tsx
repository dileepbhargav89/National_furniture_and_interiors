'use client';

import React, { useEffect, useState, useId, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { PortfolioService, PortfolioProject, PortfolioSector, PortfolioCategory } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';

interface ProjectFormData {
  id?: string | undefined;
  title: string;
  subtitle: string;
  slug: string;
  community: string;
  locality: string;
  city: string;
  sector: PortfolioSector;
  category: PortfolioCategory;
  categoryLabel: string;
  areaSqFt: number;
  budgetInLakhs: number;
  turnaroundDays: number;
  style: string;
  coverImage: string;
  galleryImagesStr: string;
  scopeStr: string;
  designerNotes: string;
  clientName: string;
  clientSociety: string;
  clientQuote: string;
  clientRating: number;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

const INITIAL_FORM: ProjectFormData = {
  title: '',
  subtitle: '',
  slug: '',
  community: '',
  locality: 'Whitefield',
  city: 'Bengaluru',
  sector: 'residential',
  category: '3bhk-4bhk',
  categoryLabel: '3 & 4 BHK',
  areaSqFt: 1800,
  budgetInLakhs: 15.0,
  turnaroundDays: 42,
  style: 'Warm Contemporary',
  coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
  galleryImagesStr: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop\nhttps://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200&auto=format&fit=crop',
  scopeStr: 'Full Home Turnkey Interiors\nModular Kitchen with Island\nMaster Walk-in Wardrobe',
  designerNotes: '',
  clientName: '',
  clientSociety: '',
  clientQuote: '',
  clientRating: 5,
  isPublished: true,
  isFeatured: false,
  displayOrder: 0,
};

export default function DesignPortfolioAdminPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<'all' | 'residential' | 'commercial'>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keyboard accessibility and body scroll lock for modal
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const titleInputId = useId();
  const slugInputId = useId();
  const subtitleInputId = useId();
  const sectorInputId = useId();
  const categoryInputId = useId();
  const communityInputId = useId();
  const localityInputId = useId();
  const areaInputId = useId();
  const budgetInputId = useId();
  const daysInputId = useId();
  const styleInputId = useId();
  const coverImageInputId = useId();
  const galleryInputId = useId();
  const scopeInputId = useId();
  const notesInputId = useId();
  const clientNameInputId = useId();
  const clientSocietyInputId = useId();
  const clientQuoteInputId = useId();
  const publishedCheckboxId = useId();
  const featuredCheckboxId = useId();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PortfolioService.adminList({ limit: 100 });
      const resObj = res as unknown as { data?: { items: PortfolioProject[] }; items?: PortfolioProject[] };
      const items = resObj.data?.items || resObj.items || [];
      setProjects(items);
    } catch (err: unknown) {
      console.error('Failed to load portfolio projects:', err);
      showToast('Failed to load portfolio projects from API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleSeedDefaults() {
    if (!confirm('Seed or refresh the default 12 Bangalore residential & commercial projects?')) return;
    try {
      setLoading(true);
      const res = await PortfolioService.adminSeed();
      const resObj = res as unknown as { data?: { seeded?: number }; seeded?: number };
      const count = resObj.data?.seeded ?? resObj.seeded ?? 0;
      showToast(`Default portfolio ready (${count} projects added/verified)`);
      await loadProjects();
    } catch (err: unknown) {
      showToast(`Seeding error: ${(err as Error)?.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  }

  function handleOpenEditModal(p: PortfolioProject) {
    setEditingId(p.id || p._id || null);
    setFormData({
      id: p.id || p._id,
      title: p.title,
      subtitle: p.subtitle,
      slug: p.slug,
      community: p.community,
      locality: p.locality,
      city: p.city || 'Bengaluru',
      sector: p.sector || 'residential',
      category: p.category,
      categoryLabel: p.categoryLabel,
      areaSqFt: p.areaSqFt,
      budgetInLakhs: p.budgetInLakhs,
      turnaroundDays: p.turnaroundDays,
      style: p.style,
      coverImage: p.coverImage,
      galleryImagesStr: (p.galleryImages || []).join('\n'),
      scopeStr: (p.scope || []).join('\n'),
      designerNotes: p.designerNotes || '',
      clientName: p.clientTestimonial?.clientName || '',
      clientSociety: p.clientTestimonial?.society || '',
      clientQuote: p.clientTestimonial?.quote || '',
      clientRating: p.clientTestimonial?.rating || 5,
      isPublished: p.isPublished !== false,
      isFeatured: !!p.isFeatured,
      displayOrder: p.displayOrder || 0,
    });
    setModalOpen(true);
  }

  async function handleDelete(p: PortfolioProject) {
    const id = p.id || p._id;
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${p.title}"?`)) return;

    try {
      await PortfolioService.adminDelete(id);
      showToast(`Deleted "${p.title}"`);
      setProjects((prev) => prev.filter((item) => (item.id || item._id) !== id));
    } catch (err: unknown) {
      showToast(`Delete failed: ${(err as Error)?.message || 'Error'}`);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const galleryImages = formData.galleryImagesStr
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const scope = formData.scopeStr
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Partial<PortfolioProject> = {
        title: formData.title,
        subtitle: formData.subtitle,
        community: formData.community,
        locality: formData.locality,
        city: formData.city,
        sector: formData.sector,
        category: formData.category,
        categoryLabel:
          formData.categoryLabel ||
          (formData.category === '3bhk-4bhk'
            ? '3 & 4 BHK'
            : formData.category === '2bhk'
            ? '2 BHK'
            : formData.category === 'villa'
            ? 'Luxury Villa'
            : formData.category === 'kitchen'
            ? 'Modular Kitchen'
            : formData.category === 'penthouse'
            ? 'Penthouse & Luxury'
            : formData.category === 'office'
            ? 'Office & Workspace'
            : formData.category === 'restaurant'
            ? 'Restaurant & Café'
            : formData.category === 'hotel'
            ? 'Hotel & Hospitality'
            : 'Shop & Retail Showroom'),
        areaSqFt: Number(formData.areaSqFt),
        budgetInLakhs: Number(formData.budgetInLakhs),
        budgetString: `₹${Number(formData.budgetInLakhs).toFixed(1)} Lakhs`,
        turnaroundDays: Number(formData.turnaroundDays),
        style: formData.style,
        coverImage: formData.coverImage,
        galleryImages: galleryImages.length > 0 ? galleryImages : [formData.coverImage],
        scope: scope.length > 0 ? scope : ['Full Turnkey Interior Architecture'],
        designerNotes: formData.designerNotes,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        displayOrder: Number(formData.displayOrder),
      };

      if (formData.slug?.trim()) {
        payload.slug = formData.slug.trim();
      }
      if (formData.clientName?.trim()) {
        payload.clientTestimonial = {
          clientName: formData.clientName,
          society: formData.clientSociety || formData.community,
          quote: formData.clientQuote || 'Exceptional design craftsmanship delivered on time.',
          rating: Number(formData.clientRating) || 5,
        };
      }

      if (editingId) {
        await PortfolioService.adminUpdate(editingId, payload);
        showToast(`Updated "${formData.title}"`);
      } else {
        await PortfolioService.adminCreate(payload);
        showToast(`Created "${formData.title}"`);
      }

      setModalOpen(false);
      await loadProjects();
    } catch (err: unknown) {
      showToast(`Save failed: ${(err as Error)?.message || 'Error saving project'}`);
    } finally {
      setSaving(false);
    }
  }

  // Filtered list (memoized for instantaneous responsiveness)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedSector !== 'all' && p.sector !== selectedSector) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.community?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q)
      );
    });
  }, [projects, selectedSector, searchQuery]);

  const totalCount = projects.length;
  const resCount = projects.filter((p) => p.sector !== 'commercial').length;
  const commCount = projects.filter((p) => p.sector === 'commercial').length;
  const pubCount = projects.filter((p) => p.isPublished !== false).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717] text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-500/40 text-xs font-medium flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Design Services Portfolio"
        description="Manage published and draft interior design case studies across Bengaluru residential and commercial sectors."
        breadcrumbs={[{ label: 'Services' }, { label: 'Design Projects' }, { label: 'Portfolio' }]}
        action={
          <div className="flex items-center gap-2.5">
            <NfiButton variant="secondary" size="sm" onClick={handleSeedDefaults}>
              Seed 12 Bangalore Projects
            </NfiButton>
            <NfiButton variant="primary" size="sm" onClick={handleOpenCreateModal}>
              + Add Portfolio Project
            </NfiButton>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Projects</span>
          <p className="text-2xl font-bold text-stone-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Residential Homes</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{resCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Commercial &amp; F&amp;B</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{commCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Live on Storefront</span>
          <p className="text-2xl font-bold text-[#8C7355] mt-1">{pubCount}</p>
        </div>
      </div>

      {/* Search & Sector Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedSector('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSector === 'all' ? 'bg-[#171717] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Projects ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('residential')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSector === 'residential' ? 'bg-[#171717] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Residential ({resCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('commercial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSector === 'commercial' ? 'bg-[#171717] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Commercial ({commCount})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by title, society, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8C7355] bg-stone-50"
          />
        </div>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500 font-medium">Loading portfolio projects from API...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-16 text-center">
          <p className="text-sm font-semibold text-stone-800">No portfolio projects found</p>
          <p className="text-xs text-stone-500 mt-1 mb-4">Click below to seed the 12 default Bangalore projects or add a new project.</p>
          <div className="inline-flex gap-2">
            <NfiButton variant="secondary" size="sm" onClick={handleSeedDefaults}>
              Seed 12 Bangalore Projects
            </NfiButton>
            <NfiButton variant="primary" size="sm" onClick={handleOpenCreateModal}>
              Add First Project
            </NfiButton>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left">
              <thead className="bg-stone-50 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Sector &amp; Category</th>
                  <th className="px-5 py-3">Locality</th>
                  <th className="px-5 py-3">Area / Budget</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredProjects.map((p) => {
                  const id = p.id || p._id || '';
                  const isComm = p.sector === 'commercial';
                  return (
                    <tr key={id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-stone-100 relative shrink-0 border border-stone-200">
                            {p.coverImage && (
                              <Image
                                src={p.coverImage}
                                alt={p.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-stone-900 block line-clamp-1">{p.title}</span>
                            <span className="text-[11px] text-stone-500 block truncate max-w-xs">{p.community}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                              isComm ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.sector}
                          </span>
                          <span className="block text-[11px] text-stone-600 font-medium">{p.categoryLabel}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-stone-800 font-medium block">{p.locality}</span>
                        <span className="text-[11px] text-stone-400 block">{p.city}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-stone-900 block">{p.budgetString}</span>
                        <span className="text-[11px] text-stone-500 block">{p.areaSqFt} sq.ft · {p.turnaroundDays}d</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            p.isPublished !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.isPublished !== false ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          {p.isPublished !== false ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        <a
                          href={`http://localhost:3000/design-services#portfolio`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-500 hover:text-stone-800 text-[11px] font-medium"
                        >
                          Preview
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="text-[#8C7355] hover:text-[#6a563d] font-semibold text-xs ml-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-portfolio-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-scale-up">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 id="admin-portfolio-modal-title" className="font-semibold text-stone-900 text-base">
                  {editingId ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Changes sync immediately to the storefront design service portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg leading-none p-2 rounded-lg hover:bg-stone-200/50 transition-colors"
                aria-label="Close modal dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={titleInputId} className="font-semibold text-stone-800 block mb-1">Project Title *</label>
                  <input
                    id={titleInputId}
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. The Botanist Bistro"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={slugInputId} className="font-semibold text-stone-800 block mb-1">URL Slug (optional)</label>
                  <input
                    id={slugInputId}
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-if-blank"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label htmlFor={subtitleInputId} className="font-semibold text-stone-800 block mb-1">Subtitle / One-Line Summary *</label>
                <input
                  id={subtitleInputId}
                  type="text"
                  required
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Fine dining architecture with curved teakwood bar..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                />
              </div>

              {/* Sector & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={sectorInputId} className="font-semibold text-stone-800 block mb-1">Sector *</label>
                  <select
                    id={sectorInputId}
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value as PortfolioSector })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none bg-white"
                  >
                    <option value="residential">Residential Interiors</option>
                    <option value="commercial">Commercial &amp; Hospitality</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={categoryInputId} className="font-semibold text-stone-800 block mb-1">Category *</label>
                  <select
                    id={categoryInputId}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PortfolioCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none bg-white"
                  >
                    <optgroup label="Residential">
                      <option value="3bhk-4bhk">3 &amp; 4 BHK</option>
                      <option value="2bhk">2 BHK</option>
                      <option value="villa">Luxury Villa</option>
                      <option value="kitchen">Modular Kitchen</option>
                      <option value="penthouse">Penthouse &amp; Luxury</option>
                    </optgroup>
                    <optgroup label="Commercial &amp; Hospitality">
                      <option value="office">Corporate Office &amp; Workspace</option>
                      <option value="restaurant">Restaurant &amp; Café</option>
                      <option value="hotel">Hotel &amp; Hospitality</option>
                      <option value="retail">Shop &amp; Retail Showroom</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Community & Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={communityInputId} className="font-semibold text-stone-800 block mb-1">Society / Commercial Complex *</label>
                  <input
                    id={communityInputId}
                    type="text"
                    required
                    value={formData.community}
                    onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                    placeholder="e.g. Prestige Lakeside / 100 Feet Rd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={localityInputId} className="font-semibold text-stone-800 block mb-1">Bangalore Locality *</label>
                  <input
                    id={localityInputId}
                    type="text"
                    required
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="e.g. Indiranagar / Whitefield / Lavelle Road"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
              </div>

              {/* Area, Budget, Turnaround */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor={areaInputId} className="font-semibold text-stone-800 block mb-1">Area (sq.ft) *</label>
                  <input
                    id={areaInputId}
                    type="number"
                    required
                    value={formData.areaSqFt}
                    onChange={(e) => setFormData({ ...formData, areaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={budgetInputId} className="font-semibold text-stone-800 block mb-1">Budget (₹ Lakhs) *</label>
                  <input
                    id={budgetInputId}
                    type="number"
                    step="0.1"
                    required
                    value={formData.budgetInLakhs}
                    onChange={(e) => setFormData({ ...formData, budgetInLakhs: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={daysInputId} className="font-semibold text-stone-800 block mb-1">Days Handover *</label>
                  <input
                    id={daysInputId}
                    type="number"
                    required
                    value={formData.turnaroundDays}
                    onChange={(e) => setFormData({ ...formData, turnaroundDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
              </div>

              {/* Style & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={styleInputId} className="font-semibold text-stone-800 block mb-1">Design Style *</label>
                  <input
                    id={styleInputId}
                    type="text"
                    required
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    placeholder="e.g. Neo-Classical Luxury / Japandi"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={coverImageInputId} className="font-semibold text-stone-800 block mb-1">Cover Image URL *</label>
                  <input
                    id={coverImageInputId}
                    type="url"
                    required
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Gallery Images (one per line) */}
              <div>
                <label htmlFor={galleryInputId} className="font-semibold text-stone-800 block mb-1">Gallery Image URLs (one per line)</label>
                <textarea
                  id={galleryInputId}
                  rows={2}
                  value={formData.galleryImagesStr}
                  onChange={(e) => setFormData({ ...formData, galleryImagesStr: e.target.value })}
                  placeholder="https://...\nhttps://..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none font-mono"
                />
              </div>

              {/* Scope (one per line) */}
              <div>
                <label htmlFor={scopeInputId} className="font-semibold text-stone-800 block mb-1">Scope Highlights (one per line)</label>
                <textarea
                  id={scopeInputId}
                  rows={2}
                  value={formData.scopeStr}
                  onChange={(e) => setFormData({ ...formData, scopeStr: e.target.value })}
                  placeholder="Modular Kitchen with Quartz Island\nMaster Walk-in Closet"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                />
              </div>

              {/* Designer Notes */}
              <div>
                <label htmlFor={notesInputId} className="font-semibold text-stone-800 block mb-1">Principal Architect Notes</label>
                <textarea
                  id={notesInputId}
                  rows={2}
                  value={formData.designerNotes}
                  onChange={(e) => setFormData({ ...formData, designerNotes: e.target.value })}
                  placeholder="Architectural intent, acoustic treatment, or lighting layout..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#8C7355] focus:outline-none"
                />
              </div>

              {/* Client Testimonial */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-800 block">Client Testimonial (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={clientNameInputId} className="sr-only">Client Name</label>
                    <input
                      id={clientNameInputId}
                      type="text"
                      placeholder="Client / Founder Name"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={clientSocietyInputId} className="sr-only">Client Society</label>
                    <input
                      id={clientSocietyInputId}
                      type="text"
                      placeholder="Society or Business Name"
                      value={formData.clientSociety}
                      onChange={(e) => setFormData({ ...formData, clientSociety: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={clientQuoteInputId} className="sr-only">Client Quote</label>
                  <input
                    id={clientQuoteInputId}
                    type="text"
                    placeholder="Quote snippet..."
                    value={formData.clientQuote}
                    onChange={(e) => setFormData({ ...formData, clientQuote: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label htmlFor={publishedCheckboxId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={publishedCheckboxId}
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8C7355] focus:ring-[#8C7355]"
                  />
                  <span className="font-medium text-stone-800">Publish Immediately</span>
                </label>
                <label htmlFor={featuredCheckboxId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={featuredCheckboxId}
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8C7355] focus:ring-[#8C7355]"
                  />
                  <span className="font-medium text-stone-800">Feature on Hero</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#171717] text-white hover:bg-black font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
