'use client';

import React, { useEffect, useState, useId, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  DesignProjectService,
  DesignProject,
  DesignProjectFunnelMetrics,
  DesignProjectType,
  DesignProjectStage,
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';
import {
  LayoutGrid,
  ListFilter,
  Search,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';

// ── Kanban Column Configuration ─────────────────────────────────────────────

interface KanbanColumnConfig {
  id: string;
  title: string;
  description: string;
  stages: DesignProjectStage[];
  color: { border: string; bg: string; text: string; badge: string };
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'NEW',
    title: '1. Inquiries & Site Surveys',
    description: 'Initial consultation & 3D site measurement',
    stages: ['LEAD_CAPTURED', 'QUALIFIED', 'CONSULTATION_SCHEDULED', 'SITE_VISIT_COMPLETED'],
    color: {
      border: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.06)',
      text: '#1D4ED8',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  },
  {
    id: 'PROPOSAL',
    title: '2. 3D Design & Quotations',
    description: 'BOQ estimation, 3D renders & client signoff',
    stages: ['PROPOSAL_IN_PROGRESS', 'QUOTATION_SENT', 'CLIENT_REVIEW', 'REVISION'],
    color: {
      border: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.06)',
      text: '#6D28D9',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  },
  {
    id: 'EXECUTION',
    title: '3. Factory & Site Execution',
    description: '40,000 sq.ft factory joinery & on-site fit-out',
    stages: [
      'APPROVED',
      'ADVANCE_PAYMENT_COLLECTED',
      'PROCUREMENT',
      'EXECUTION_IN_PROGRESS',
      'MILESTONE_PAYMENT_COLLECTED',
    ],
    color: {
      border: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.06)',
      text: '#B45309',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  },
  {
    id: 'COMPLETED',
    title: '4. Quality Audit & Handover',
    description: '45-Day handover guarantee & 10-Yr BWP warranty',
    stages: ['QUALITY_CHECK', 'HANDOVER', 'WARRANTY_AMC'],
    color: {
      border: '#10B981',
      bg: 'rgba(16, 185, 129, 0.06)',
      text: '#047857',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  },
];

// Finite state machine next-stage lookup
const NEXT_STAGE_MAP: Partial<Record<DesignProjectStage, DesignProjectStage>> = {
  LEAD_CAPTURED: 'QUALIFIED',
  QUALIFIED: 'CONSULTATION_SCHEDULED',
  CONSULTATION_SCHEDULED: 'SITE_VISIT_COMPLETED',
  SITE_VISIT_COMPLETED: 'PROPOSAL_IN_PROGRESS',
  PROPOSAL_IN_PROGRESS: 'QUOTATION_SENT',
  QUOTATION_SENT: 'CLIENT_REVIEW',
  CLIENT_REVIEW: 'APPROVED',
  APPROVED: 'ADVANCE_PAYMENT_COLLECTED',
  ADVANCE_PAYMENT_COLLECTED: 'PROCUREMENT',
  PROCUREMENT: 'EXECUTION_IN_PROGRESS',
  EXECUTION_IN_PROGRESS: 'QUALITY_CHECK',
  QUALITY_CHECK: 'HANDOVER',
  HANDOVER: 'WARRANTY_AMC',
};

// Form Interface for New Project Modal
interface NewProjectFormData {
  projectType: DesignProjectType;
  street: string;
  locality: string;
  city: string;
  postalCode: string;
  areaSqft: number;
  bhk: number;
  rooms: number;
  minBudgetLakhs: number;
  maxBudgetLakhs: number;
  clientRef: string;
}

const INITIAL_PROJECT_FORM: NewProjectFormData = {
  projectType: 'RESIDENTIAL',
  street: 'Prestige Lakeside Habitat, Tower 4, Flat 1402',
  locality: 'Whitefield',
  city: 'Bengaluru',
  postalCode: '560087',
  areaSqft: 1850,
  bhk: 3,
  rooms: 5,
  minBudgetLakhs: 18.0,
  maxBudgetLakhs: 24.5,
  clientRef: 'Dr. Aniruddh Kulkarni',
};

export default function DesignProjectsPage() {
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [metrics, setMetrics] = useState<DesignProjectFunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<NewProjectFormData>(INITIAL_PROJECT_FORM);
  const [saving, setSaving] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form IDs for a11y
  const projectTypeInputId = useId();
  const streetInputId = useId();
  const localityInputId = useId();
  const cityInputId = useId();
  const areaInputId = useId();
  const bhkInputId = useId();
  const minBudgetInputId = useId();
  const maxBudgetInputId = useId();
  const clientRefInputId = useId();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, metricsRes] = await Promise.all([
        DesignProjectService.list({ limit: 100 }),
        DesignProjectService.getFunnelMetrics(),
      ]);
      const projectsResponse = projectsRes as unknown as {
        data?: { items: DesignProject[] };
        items?: DesignProject[];
      };
      setProjects(projectsResponse.data?.items || projectsResponse.items || []);

      const metricsResponse = metricsRes as unknown as {
        data?: DesignProjectFunnelMetrics;
      } & DesignProjectFunnelMetrics;
      setMetrics(metricsResponse.data || metricsResponse);
    } catch (error) {
      console.error('Failed to load design projects:', error);
      showToast('Error loading design projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard accessibility and body scroll lock for modal
  useEffect(() => {
    if (!createModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [createModalOpen]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Quick Advance Stage directly from card/table
  async function handleQuickAdvance(project: DesignProject) {
    const nextStage = NEXT_STAGE_MAP[project.stage];
    if (!nextStage) {
      showToast('Project is at final completion stage');
      return;
    }

    try {
      setAdvancingId(project._id);
      await DesignProjectService.advanceStage(project._id, {
        targetStage: nextStage,
        expectedVersion: project.version,
        note: `Advanced stage to ${nextStage} via Quick Action in Admin Pipeline`,
      });
      showToast(`Advanced ${project.projectCode} to ${(nextStage || '').replace(/_/g, ' ')}`);
      await loadData();
    } catch (err: unknown) {
      console.error('Advance stage error:', err);
      showToast(`Advance failed: ${(err as Error)?.message || 'Conflict occurred'}`);
    } finally {
      setAdvancingId(null);
    }
  }

  // Handle Create Project Submit
  async function handleCreateProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const minPaise = Math.round(Number(formData.minBudgetLakhs) * 100000 * 100);
      const maxPaise = Math.round(Number(formData.maxBudgetLakhs) * 100000 * 100);

      const payload = {
        customerId: '6a9b29e529b983a1cda18b5d', // Active Admin Customer ID
        projectType: formData.projectType,
        budgetRange: {
          min: minPaise,
          max: maxPaise,
        },
        propertyAddress: {
          street: formData.street,
          city: formData.city || 'Bengaluru',
          state: 'Karnataka',
          postalCode: formData.postalCode || '560087',
          country: 'India',
        },
        propertyDetails: {
          areaSqft: Number(formData.areaSqft),
          bhk: Number(formData.bhk),
          rooms: Number(formData.rooms || 5),
        },
      };

      await DesignProjectService.create(payload);
      showToast('Design project created successfully');
      setCreateModalOpen(false);
      setFormData(INITIAL_PROJECT_FORM);
      await loadData();
    } catch (err: unknown) {
      console.error('Create project error:', err);
      showToast(`Failed to create project: ${(err as Error)?.message || 'Error'}`);
    } finally {
      setSaving(false);
    }
  }

  // Seed 5 Sample Bangalore Pipeline Projects (Instant Demo Readiness)
  async function handleSeedSamplePipeline() {
    if (
      !confirm(
        'Populate 5 sample Bangalore residential and commercial client projects into the active pipeline?',
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const samples = [
        {
          customerId: '6a9b29e529b983a1cda18b5d',
          projectType: 'RESIDENTIAL' as const,
          budgetRange: { min: 220000000, max: 280000000 },
          propertyAddress: {
            street: 'Sobha Dream Acres, Wing B, Apt 904',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560087',
            country: 'India',
          },
          propertyDetails: { areaSqft: 1980, bhk: 3, rooms: 5 },
        },
        {
          customerId: '6a9b29e529b983a1cda18b5d',
          projectType: 'MODULAR_KITCHEN' as const,
          budgetRange: { min: 85000000, max: 120000000 },
          propertyAddress: {
            street: 'Kingfisher Towers, Penthouse 24',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
          propertyDetails: { areaSqft: 3200, bhk: 4, rooms: 7 },
        },
        {
          customerId: '6a9b29e529b983a1cda18b5d',
          projectType: 'COMMERCIAL' as const,
          budgetRange: { min: 450000000, max: 600000000 },
          propertyAddress: {
            street: 'RMZ EcoWorld, Campus 4, Level 3',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560103',
            country: 'India',
          },
          propertyDetails: { areaSqft: 5200, rooms: 12 },
        },
        {
          customerId: '6a9b29e529b983a1cda18b5d',
          projectType: 'RESTAURANT' as const,
          budgetRange: { min: 350000000, max: 480000000 },
          propertyAddress: {
            street: '100 Feet Rd, Near 12th Main',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
          },
          propertyDetails: { areaSqft: 3400, rooms: 6 },
        },
      ];

      for (const sample of samples) {
        await DesignProjectService.create(sample);
      }
      showToast('Successfully seeded 4 sample Bangalore pipeline projects!');
      await loadData();
    } catch (err: unknown) {
      showToast(`Seeding error: ${(err as Error)?.message || 'Error'}`);
    } finally {
      setLoading(false);
    }
  }

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Type filter
      if (typeFilter !== 'ALL' && p.projectType !== typeFilter) return false;

      // Stage Group filter
      if (stageFilter !== 'ALL') {
        const targetCol = KANBAN_COLUMNS.find((c) => c.id === stageFilter);
        if (targetCol && !targetCol.stages.includes(p.stage)) return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.projectCode.toLowerCase().includes(q) ||
        p.propertyAddress.street.toLowerCase().includes(q) ||
        p.propertyAddress.city.toLowerCase().includes(q) ||
        p.projectType.toLowerCase().includes(q) ||
        p.stage.toLowerCase().includes(q)
      );
    });
  }, [projects, typeFilter, stageFilter, searchQuery]);

  // Helper: filter projects for a specific Kanban column
  const getProjectsForColumn = (columnStages: DesignProjectStage[]) => {
    return filteredProjects.filter((p) => columnStages.includes(p.stage));
  };

  // Helper currency formatter
  const formatCurrency = (amountPaise: number) => {
    const rupees = amountPaise / 100;
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)} Lakhs`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  // Compute Total Active Pipeline Value
  const totalPipelineValuePaise = useMemo(() => {
    return projects
      .filter((p) => p.stage !== 'LOST')
      .reduce((sum, p) => sum + (p.budgetRange.min + p.budgetRange.max) / 2, 0);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Luxury Toast Notification */}
      {toastMessage && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-[#171717] px-5 py-3 text-xs font-medium text-white shadow-2xl">
          <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Design Projects &amp; Client Pipeline"
        description="End-to-end management of residential turnkey homes and commercial fit-outs across Bengaluru."
        breadcrumbs={[{ label: 'Services' }, { label: 'Design Projects' }]}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/design-projects/portfolio"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200"
            >
              <Sparkles size={14} className="text-[#8C7355]" />
              <span>Design Portfolio Portal</span>
              <ExternalLink size={12} className="text-stone-400" />
            </Link>

            {projects.length < 3 && (
              <NfiButton variant="secondary" size="sm" onClick={handleSeedSamplePipeline}>
                <FolderPlus size={14} />
                <span>Seed Sample Pipeline</span>
              </NfiButton>
            )}

            <NfiButton variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} />
              <span>New Client Project</span>
            </NfiButton>
          </div>
        }
      />

      {/* ── Business & Financial Pipeline Metrics Strip ── */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Active Pipeline
            </span>
            <TrendingUp size={14} className="text-[#8C7355]" />
          </div>
          <p className="mt-1 text-xl font-bold text-stone-900 sm:text-2xl">
            {formatCurrency(totalPipelineValuePaise)}
          </p>
          <span className="mt-0.5 block text-[10px] text-stone-400">
            {projects.length} Active Client Projects
          </span>
        </div>

        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              In Consultation
            </span>
            <Clock size={14} className="text-blue-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-blue-700 sm:text-2xl">
            {metrics?.inConsultation ||
              getProjectsForColumn(KANBAN_COLUMNS[0]?.stages ?? []).length}
          </p>
          <span className="mt-0.5 block text-[10px] text-stone-400">Leads &amp; Site Visits</span>
        </div>

        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
              3D Quoted
            </span>
            <Sparkles size={14} className="text-purple-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-purple-700 sm:text-2xl">
            {metrics?.quotationSent || getProjectsForColumn(KANBAN_COLUMNS[1]?.stages ?? []).length}
          </p>
          <span className="mt-0.5 block text-[10px] text-stone-400">Proposals &amp; BOQ Sent</span>
        </div>

        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              In Execution
            </span>
            <RefreshCw size={14} className="text-amber-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-amber-700 sm:text-2xl">
            {metrics?.inProgress || getProjectsForColumn(KANBAN_COLUMNS[2]?.stages ?? []).length}
          </p>
          <span className="mt-0.5 block text-[10px] text-stone-400">
            Factory &amp; Site Fit-Out
          </span>
        </div>

        <div className="shadow-2xs col-span-2 rounded-xl border border-stone-200 bg-white p-4 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Handed Over
            </span>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-700 sm:text-2xl">
            {metrics?.completed || getProjectsForColumn(KANBAN_COLUMNS[3]?.stages ?? []).length}
          </p>
          <span className="mt-0.5 block text-[10px] text-stone-400">10-Year BWP Warranty</span>
        </div>
      </div>

      {/* ── Filter Toolbar & View Mode Switcher ── */}
      <div className="shadow-2xs flex flex-col items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 md:flex-row">
        {/* Left: View Mode Toggle & Project Type */}
        <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
          <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'shadow-xs bg-white font-semibold text-stone-900'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'shadow-xs bg-white font-semibold text-stone-900'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ListFilter size={13} />
              <span>Data Table</span>
            </button>
          </div>

          {/* Project Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
          >
            <option value="ALL">All Project Types</option>
            <option value="RESIDENTIAL">Residential Full Home</option>
            <option value="MODULAR_KITCHEN">Modular Kitchen</option>
            <option value="COMMERCIAL">Corporate Office</option>
            <option value="RESTAURANT">Restaurant &amp; Café</option>
            <option value="HOTEL">Hotel &amp; Hospitality</option>
          </select>

          {/* Stage Group Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
          >
            <option value="ALL">All Stages ({filteredProjects.length})</option>
            <option value="NEW">1. Inquiries &amp; Surveys</option>
            <option value="PROPOSAL">2. 3D Proposals &amp; Quotes</option>
            <option value="EXECUTION">3. Factory Execution</option>
            <option value="COMPLETED">4. Handover &amp; Warranty</option>
          </select>
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by code, society, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2 pl-8 pr-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
          />
        </div>
      </div>

      {/* ── Main Content Area (Kanban vs Table) ── */}
      {loading ? (
        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-16 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#8C7355] border-t-transparent" />
          <p className="text-xs font-medium text-stone-500">Loading design projects pipeline…</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State with Immediate Actions */
        <div className="shadow-2xs rounded-xl border border-stone-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-[#8C7355]">
            <Sparkles size={24} />
          </div>
          <h3 className="text-base font-semibold text-stone-800">
            No Design Projects Match Your Filter
          </h3>
          <p className="mx-auto mb-6 mt-1 max-w-md text-xs text-stone-500">
            Create a new client project to begin tracking 3D proposals, factory execution, and
            milestones, or populate sample Bangalore projects.
          </p>
          <div className="inline-flex items-center gap-3">
            <NfiButton variant="secondary" size="sm" onClick={handleSeedSamplePipeline}>
              Seed 4 Sample Bangalore Projects
            </NfiButton>
            <NfiButton variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
              + Create Client Project
            </NfiButton>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ── KANBAN VIEW ── */
        <div className="grid grid-cols-1 items-start gap-4 overflow-x-auto pb-4 md:grid-cols-2 lg:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnProjects = getProjectsForColumn(col.stages);
            return (
              <div
                key={col.id}
                className="shadow-2xs flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50/80"
              >
                {/* Column Header */}
                <div
                  className="flex items-center justify-between border-b-2 bg-white px-4 py-3"
                  style={{ borderBottomColor: col.color.border }}
                >
                  <div>
                    <h3 className="text-xs font-semibold text-stone-900">{col.title}</h3>
                    <p className="line-clamp-1 text-[10px] text-stone-400">{col.description}</p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: col.color.bg, color: col.color.text }}
                  >
                    {columnProjects.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex flex-1 flex-col gap-3 p-3">
                  {columnProjects.length === 0 ? (
                    <div className="px-4 py-12 text-center text-xs italic text-stone-400">
                      No active projects in this stage
                    </div>
                  ) : (
                    columnProjects.map((project) => {
                      const nextStage = NEXT_STAGE_MAP[project.stage];
                      const isAdvancing = advancingId === project._id;

                      return (
                        <div
                          key={project._id}
                          className="shadow-2xs group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 transition-all hover:shadow-md"
                        >
                          <div>
                            {/* Card Top Pill & Code */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <Link
                                href={`/design-projects/${project._id}`}
                                className="font-mono text-[11px] font-semibold text-stone-900 transition-colors hover:text-[#8C7355]"
                              >
                                {project.projectCode}
                              </Link>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  project.projectType === 'COMMERCIAL' ||
                                  project.projectType === 'RESTAURANT'
                                    ? 'bg-amber-100 text-amber-800'
                                    : project.projectType === 'MODULAR_KITCHEN'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-stone-100 text-stone-800'
                                }`}
                              >
                                {(project.projectType || 'RESIDENTIAL').replace('_', ' ')}
                              </span>
                            </div>

                            {/* Property & Society */}
                            <h4 className="mb-1 line-clamp-1 text-xs font-semibold text-stone-900">
                              {project.propertyAddress.street}
                            </h4>

                            <div className="mb-2.5 flex items-center gap-1 text-[11px] text-stone-500">
                              <MapPin size={11} className="text-[#8C7355]" />
                              <span className="truncate">
                                {project.propertyAddress.city} ·{' '}
                                {project.propertyDetails.areaSqft.toLocaleString()} sq.ft
                                {project.propertyDetails.bhk
                                  ? ` (${project.propertyDetails.bhk} BHK)`
                                  : ''}
                              </span>
                            </div>

                            {/* Sub-Stage Indicator Pill */}
                            <div className="mb-3">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#8C7355]" />
                                <span>{(project.stage || 'STAGE').replace(/_/g, ' ')}</span>
                              </span>
                            </div>
                          </div>

                          {/* Card Footer with Budget & Quick Actions */}
                          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                            <div>
                              <span className="block text-[10px] font-medium text-stone-400">
                                Budget Range
                              </span>
                              <span className="text-xs font-bold text-stone-900">
                                {formatCurrency(project.budgetRange.min)} -{' '}
                                {formatCurrency(project.budgetRange.max)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {nextStage && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdvance(project)}
                                  disabled={isAdvancing}
                                  title={`Advance to ${(nextStage || '').replace(/_/g, ' ')}`}
                                  className="rounded-lg bg-stone-100 p-1.5 text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white disabled:opacity-50"
                                >
                                  {isAdvancing ? (
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-500 border-t-transparent" />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </button>
                              )}
                              <Link
                                href={`/design-projects/${project._id}`}
                                className="rounded-lg bg-stone-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-black"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── INTERACTIVE DATA TABLE VIEW ── */
        <div className="shadow-2xs overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Project Code &amp; Society</th>
                  <th className="px-5 py-3.5">Type &amp; Specs</th>
                  <th className="px-5 py-3.5">Locality</th>
                  <th className="px-5 py-3.5">Budget Range</th>
                  <th className="px-5 py-3.5">Current Stage</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredProjects.map((project) => {
                  const nextStage = NEXT_STAGE_MAP[project.stage];
                  const isAdvancing = advancingId === project._id;

                  return (
                    <tr key={project._id} className="transition-colors hover:bg-stone-50/70">
                      {/* Project Code & Society */}
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/design-projects/${project._id}`}
                          className="mb-0.5 block font-mono font-bold text-stone-900 hover:text-[#8C7355]"
                        >
                          {project.projectCode}
                        </Link>
                        <span className="block max-w-xs truncate text-[11px] text-stone-500">
                          {project.propertyAddress.street}
                        </span>
                      </td>

                      {/* Type & Specs */}
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold text-stone-800">
                          {(project.projectType || 'RESIDENTIAL').replace('_', ' ')}
                        </span>
                        <span className="block text-[11px] text-stone-500">
                          {project.propertyDetails.areaSqft.toLocaleString()} sq.ft
                          {project.propertyDetails.bhk
                            ? ` · ${project.propertyDetails.bhk} BHK`
                            : ''}
                        </span>
                      </td>

                      {/* Locality */}
                      <td className="px-5 py-3.5">
                        <span className="block font-medium text-stone-800">
                          {project.propertyAddress.city}
                        </span>
                        <span className="block text-[11px] text-stone-400">
                          {project.propertyAddress.postalCode}
                        </span>
                      </td>

                      {/* Budget Range */}
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold text-stone-900">
                          {formatCurrency(project.budgetRange.min)}
                        </span>
                        <span className="block text-[11px] text-stone-400">
                          up to {formatCurrency(project.budgetRange.max)}
                        </span>
                      </td>

                      {/* Current Stage */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8C7355]" />
                          <span>{(project.stage || 'STAGE').replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="space-x-2 px-5 py-3.5 text-right">
                        {nextStage && (
                          <button
                            type="button"
                            onClick={() => handleQuickAdvance(project)}
                            disabled={isAdvancing}
                            className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white"
                          >
                            {isAdvancing
                              ? 'Advancing…'
                              : `Advance → ${(nextStage || '').replace(/_/g, ' ')}`}
                          </button>
                        )}
                        <Link
                          href={`/design-projects/${project._id}`}
                          className="inline-block rounded-lg bg-[#171717] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE NEW DESIGN PROJECT MODAL ── */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-modal-title"
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
        >
          <div className="animate-scale-up my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
              <div>
                <h3
                  id="create-project-modal-title"
                  className="text-base font-semibold text-stone-900"
                >
                  Create New Client Design Project
                </h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Initiates 3D consultation, site measurement, and turnkey pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-2 text-lg leading-none text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-700"
                aria-label="Close modal dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreateProjectSubmit}
              className="max-h-[75vh] space-y-4 overflow-y-auto p-6 text-xs"
            >
              {/* Project Type */}
              <div>
                <label
                  htmlFor={projectTypeInputId}
                  className="mb-1 block font-semibold text-stone-800"
                >
                  Project Type *
                </label>
                <select
                  id={projectTypeInputId}
                  value={formData.projectType}
                  onChange={(e) =>
                    setFormData({ ...formData, projectType: e.target.value as DesignProjectType })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                >
                  <option value="RESIDENTIAL">Full Home Turnkey Interiors</option>
                  <option value="MODULAR_KITCHEN">Modular Kitchen &amp; Dining</option>
                  <option value="COMMERCIAL">Corporate Office &amp; Workspace</option>
                  <option value="RESTAURANT">Fine Dining &amp; Café</option>
                  <option value="HOTEL">Hotel &amp; Hospitality Suites</option>
                  <option value="BEDROOM">Master Bedroom &amp; Walk-in Closet</option>
                  <option value="LIVING_ROOM">Luxury Living &amp; Entertainment</option>
                </select>
              </div>

              {/* Client / Society Details */}
              <div>
                <label
                  htmlFor={clientRefInputId}
                  className="mb-1 block font-semibold text-stone-800"
                >
                  Client Name / Reference *
                </label>
                <input
                  id={clientRefInputId}
                  type="text"
                  required
                  value={formData.clientRef}
                  onChange={(e) => setFormData({ ...formData, clientRef: e.target.value })}
                  placeholder="e.g. Dr. Aniruddh Kulkarni"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                />
              </div>

              {/* Street / Society Address */}
              <div>
                <label htmlFor={streetInputId} className="mb-1 block font-semibold text-stone-800">
                  Building / Society / Street Address *
                </label>
                <input
                  id={streetInputId}
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="e.g. Prestige Lakeside Habitat, Tower 4, Flat 1402"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                />
              </div>

              {/* Locality & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={localityInputId}
                    className="mb-1 block font-semibold text-stone-800"
                  >
                    Locality *
                  </label>
                  <input
                    id={localityInputId}
                    type="text"
                    required
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="e.g. Whitefield"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
                <div>
                  <label htmlFor={cityInputId} className="mb-1 block font-semibold text-stone-800">
                    City *
                  </label>
                  <input
                    id={cityInputId}
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
              </div>

              {/* Area & BHK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={areaInputId} className="mb-1 block font-semibold text-stone-800">
                    Carpet Area (sq.ft) *
                  </label>
                  <input
                    id={areaInputId}
                    type="number"
                    required
                    value={formData.areaSqft}
                    onChange={(e) => setFormData({ ...formData, areaSqft: Number(e.target.value) })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
                <div>
                  <label htmlFor={bhkInputId} className="mb-1 block font-semibold text-stone-800">
                    BHK Config (optional)
                  </label>
                  <input
                    id={bhkInputId}
                    type="number"
                    value={formData.bhk}
                    onChange={(e) => setFormData({ ...formData, bhk: Number(e.target.value) })}
                    placeholder="e.g. 3"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
              </div>

              {/* Budget Range (₹ Lakhs) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={minBudgetInputId}
                    className="mb-1 block font-semibold text-stone-800"
                  >
                    Min Budget (₹ Lakhs) *
                  </label>
                  <input
                    id={minBudgetInputId}
                    type="number"
                    step="0.5"
                    required
                    value={formData.minBudgetLakhs}
                    onChange={(e) =>
                      setFormData({ ...formData, minBudgetLakhs: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
                <div>
                  <label
                    htmlFor={maxBudgetInputId}
                    className="mb-1 block font-semibold text-stone-800"
                  >
                    Max Budget (₹ Lakhs) *
                  </label>
                  <input
                    id={maxBudgetInputId}
                    type="number"
                    step="0.5"
                    required
                    value={formData.maxBudgetLakhs}
                    onChange={(e) =>
                      setFormData({ ...formData, maxBudgetLakhs: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8C7355]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="shadow-xs rounded-lg bg-[#171717] px-5 py-2 font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? 'Creating Project…' : 'Create Design Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
