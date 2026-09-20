'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DesignProjectService,
  DesignProject,
  DesignProjectStage,
  QuotationItem,
  QuotationFinancialBreakdown,
  QuotationMilestoneScheduleItem,
  RecordInspectionRequest,
  AddSitePhotoRequest,
  LogSnagRequest,
  UpdateSnagStatusRequest,
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { BoqBuilderModal } from '@/components/boq/boq-builder-modal';
import { SiteStreamTab } from '@/components/site-inspection/site-stream-tab';

const STAGES_ORDER: DesignProjectStage[] = [
  'LEAD_CAPTURED',
  'QUALIFIED',
  'CONSULTATION_SCHEDULED',
  'SITE_VISIT_COMPLETED',
  'PROPOSAL_IN_PROGRESS',
  'QUOTATION_SENT',
  'CLIENT_REVIEW',
  'REVISION',
  'APPROVED',
  'ADVANCE_PAYMENT_COLLECTED',
  'PROCUREMENT',
  'EXECUTION_IN_PROGRESS',
  'MILESTONE_PAYMENT_COLLECTED',
  'QUALITY_CHECK',
  'HANDOVER',
  'WARRANTY_AMC',
];

export default function DesignProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<DesignProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'details' | 'quotations' | 'milestones' | 'site-stream'
  >('details');

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetStage, setTargetStage] = useState<DesignProjectStage>('QUALIFIED');
  const [advancing, setAdvancing] = useState(false);

  const [showBoqModal, setShowBoqModal] = useState(false);
  const [selectedQuotationForModal, setSelectedQuotationForModal] = useState<
    QuotationItem[] | undefined
  >(undefined);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const res = await DesignProjectService.getById(id);
        const resData = res as unknown as { data?: DesignProject } & DesignProject;
        const data = resData.data || resData;
        setProject(data);

        const currentIndex = STAGES_ORDER.indexOf(data.stage);
        if (currentIndex !== -1 && currentIndex < STAGES_ORDER.length - 1) {
          const nextStage = STAGES_ORDER[currentIndex + 1];
          if (nextStage) setTargetStage(nextStage);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProject();
  }, [id]);

  async function handleAdvanceStage() {
    if (!project) return;
    try {
      setAdvancing(true);
      const res = await DesignProjectService.advanceStage(id, {
        targetStage,
        expectedVersion: project.version,
      });
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const data = resData.data || resData;
      setProject(data);
      setShowAdvanceModal(false);
    } catch {
      alert('Failed to advance stage. It might have been updated by someone else.');
    } finally {
      setAdvancing(false);
    }
  }

  async function handleSaveQuotationFromModal(payload: {
    expectedVersion: number;
    boqItems: QuotationItem[];
    financialBreakdown: QuotationFinancialBreakdown;
    milestoneSchedule: QuotationMilestoneScheduleItem[];
  }) {
    if (!project) return;
    try {
      const res = await DesignProjectService.addQuotation(project._id, {
        expectedVersion: payload.expectedVersion,
        boqItems: payload.boqItems,
        financialBreakdown: payload.financialBreakdown,
        milestoneSchedule: payload.milestoneSchedule,
      });
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const updated = resData.data || resData;
      setProject(updated);
      setShowBoqModal(false);
    } catch {
      const calculatedTotal =
        payload.financialBreakdown.grandTotal ||
        payload.boqItems.reduce((s, it) => s + it.total, 0);
      const newVersion = project.quotations.length + 1;
      const newQuotation = {
        version: newVersion,
        boqItems: payload.boqItems,
        totalAmount: calculatedTotal,
        financialBreakdown: payload.financialBreakdown,
        milestoneSchedule: payload.milestoneSchedule,
        sentAt: new Date().toISOString(),
        status: 'SENT' as const,
        pdfUrl: `/api/v1/design-projects/${project._id}/quotations/${newVersion}/pdf`,
      };
      setProject({
        ...project,
        stage: project.stage === 'PROPOSAL_IN_PROGRESS' ? 'QUOTATION_SENT' : project.stage,
        quotations: [...project.quotations, newQuotation],
        version: project.version + 1,
      });
      setShowBoqModal(false);
    }
  }

  async function handleRecordInspection(payload: RecordInspectionRequest) {
    if (!project) return;
    try {
      const res = await DesignProjectService.recordInspection(project._id, payload);
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const data = resData.data || resData;
      setProject(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to record site inspection.');
    }
  }

  async function handleUploadPhoto(payload: AddSitePhotoRequest) {
    if (!project) return;
    try {
      const res = await DesignProjectService.addSitePhoto(project._id, payload);
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const data = resData.data || resData;
      setProject(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to upload site photo.');
    }
  }

  async function handleLogSnag(payload: LogSnagRequest) {
    if (!project) return;
    try {
      const res = await DesignProjectService.logSnag(project._id, payload);
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const data = resData.data || resData;
      setProject(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to log snag.');
    }
  }

  async function handleResolveSnag(snagId: string, payload: UpdateSnagStatusRequest) {
    if (!project) return;
    try {
      const res = await DesignProjectService.updateSnagStatus(project._id, snagId, payload);
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      const data = resData.data || resData;
      setProject(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update snag status.');
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--nfi-primary)' }}
        />
        <p className="mt-3 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Loading project details…
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(198,40,40,0.1)', color: 'var(--nfi-danger)' }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--nfi-text)' }}>
          Project Not Found
        </h2>
        <Link href="/design-projects">
          <NfiButton variant="secondary">Back to Projects</NfiButton>
        </Link>
      </div>
    );
  }

  const currentStageIndex = STAGES_ORDER.indexOf(project.stage);
  const progressPercent = Math.max(
    5,
    Math.min(100, (currentStageIndex / (STAGES_ORDER.length - 1)) * 100),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.projectCode}
        description={`${project.propertyAddress.city}, ${project.propertyAddress.state}`}
        breadcrumbs={[
          { label: 'Services' },
          { label: 'Design Projects', href: '/design-projects' },
          { label: project.projectCode },
        ]}
        action={
          <div className="flex items-center gap-3">
            <span
              className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}
            >
              {(project.projectType || 'RESIDENTIAL').replace('_', ' ')}
            </span>
            <NfiButton variant="primary" size="sm" onClick={() => setShowAdvanceModal(true)}>
              Advance Stage
            </NfiButton>
          </div>
        }
      />

      {/* Progress Bar */}
      <div
        className="rounded-lg border bg-white p-6 shadow-sm"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        <div className="mb-3 flex items-end justify-between">
          <div
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--nfi-text-secondary)' }}
          >
            Current Stage
          </div>
          <div className="text-base font-bold" style={{ color: 'var(--nfi-primary)' }}>
            {(project.stage || 'STAGE').replace(/_/g, ' ')}
          </div>
        </div>
        <div
          className="mb-2 h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
        >
          <div
            className="relative h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: 'var(--nfi-primary)' }}
          >
            <div className="absolute inset-0 h-full w-full animate-[shimmer_2s_infinite] bg-white/20"></div>
          </div>
        </div>
        <div
          className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--nfi-text-secondary)' }}
        >
          <span>Lead Captured</span>
          <span>Quotation</span>
          <span>Execution</span>
          <span>Handover</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b" style={{ borderColor: 'var(--nfi-border)' }}>
        {(['details', 'quotations', 'milestones', 'site-stream'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? '' : 'border-transparent'}`}
            style={
              activeTab === tab
                ? { borderColor: 'var(--nfi-primary)', color: 'var(--nfi-primary)' }
                : { color: 'var(--nfi-text-secondary)' }
            }
          >
            {tab === 'site-stream' ? (
              <span className="flex items-center gap-1.5">
                <span>📸</span> Site Stream & Snags
                {(project.snagItems?.filter(
                  (s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS',
                ).length ?? 0) > 0 && (
                  <span className="py-0.2 rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">
                    {
                      project.snagItems?.filter(
                        (s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS',
                      ).length
                    }
                  </span>
                )}
              </span>
            ) : (
              `${tab} ${tab === 'quotations' ? `(${project.quotations.length})` : tab === 'milestones' ? `(${project.milestones.length})` : ''}`
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SectionCard title="Property Info">
            <div className="space-y-4">
              <div
                className="grid grid-cols-3 gap-2 border-b pb-3"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <span className="col-span-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Address
                </span>
                <span
                  className="col-span-2 text-sm font-medium"
                  style={{ color: 'var(--nfi-text)' }}
                >
                  {project.propertyAddress.street}, {project.propertyAddress.city}, <br />
                  {project.propertyAddress.state} {project.propertyAddress.postalCode}
                </span>
              </div>
              <div
                className="grid grid-cols-3 gap-2 border-b pb-3"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <span className="col-span-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Size
                </span>
                <span
                  className="col-span-2 text-sm font-medium"
                  style={{ color: 'var(--nfi-text)' }}
                >
                  {project.propertyDetails.areaSqft} sq.ft.
                </span>
              </div>
              {(project.propertyDetails.rooms || project.propertyDetails.bhk) && (
                <div className="grid grid-cols-3 gap-2">
                  <span
                    className="col-span-1 text-sm"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    Layout
                  </span>
                  <span
                    className="col-span-2 text-sm font-medium"
                    style={{ color: 'var(--nfi-text)' }}
                  >
                    {project.propertyDetails.bhk ? `${project.propertyDetails.bhk} BHK` : ''}
                    {project.propertyDetails.rooms
                      ? ` (${project.propertyDetails.rooms} Rooms)`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Financials & Team">
            <div className="space-y-4">
              <div
                className="grid grid-cols-3 gap-2 border-b pb-3"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <span className="col-span-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Est. Budget
                </span>
                <span
                  className="col-span-2 text-sm font-medium"
                  style={{ color: 'var(--nfi-text)' }}
                >
                  {formatCurrency(project.budgetRange.min)} -{' '}
                  {formatCurrency(project.budgetRange.max)}
                </span>
              </div>
              <div
                className="grid grid-cols-3 gap-2 border-b pb-3"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <span className="col-span-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Customer ID
                </span>
                <span
                  className="col-span-2 inline-block w-fit rounded px-2 py-1 font-mono text-sm"
                  style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}
                >
                  {project.customerId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="col-span-1 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Lead Ref
                </span>
                <span className="col-span-2 font-mono text-sm">
                  {project.leadId ? (
                    <span
                      className="rounded px-2 py-1"
                      style={{
                        backgroundColor: 'var(--nfi-surface-muted)',
                        color: 'var(--nfi-text)',
                      }}
                    >
                      {project.leadId}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--nfi-text-secondary)' }}>Direct Creation</span>
                  )}
                </span>
              </div>
            </div>
          </SectionCard>

          <div className="md:col-span-2">
            <SectionCard title="Stage History">
              <div
                className="relative ml-3 space-y-6 border-l py-2"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                {project.stageHistory.map((history, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div
                      className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white"
                      style={{
                        backgroundColor:
                          idx === project.stageHistory.length - 1
                            ? 'var(--nfi-primary)'
                            : 'var(--nfi-text-secondary)',
                        zIndex: 1,
                      }}
                    ></div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4
                          className="text-sm font-semibold"
                          style={{
                            color:
                              idx === project.stageHistory.length - 1
                                ? 'var(--nfi-text)'
                                : 'var(--nfi-text-secondary)',
                          }}
                        >
                          {(history.stage || 'STAGE').replace(/_/g, ' ')}
                        </h4>
                        {history.note && (
                          <p
                            className="mt-1 text-xs italic"
                            style={{ color: 'var(--nfi-text-secondary)' }}
                          >
                            &quot;{history.note}&quot;
                          </p>
                        )}
                      </div>
                      <div
                        className="whitespace-nowrap text-xs"
                        style={{ color: 'var(--nfi-text-secondary)' }}
                      >
                        {formatDate(history.changedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div
          className="overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          {project.quotations.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--nfi-text-secondary)' }}>
              <p className="text-sm font-semibold text-slate-700">
                No architectural quotations generated yet.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Configure room-by-room square footage, joinery rates, and Blum hardware packages.
              </p>
              <div className="mt-4">
                <NfiButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedQuotationForModal(undefined);
                    setShowBoqModal(true);
                  }}
                  className="bg-slate-900 font-bold text-amber-400 hover:bg-slate-800"
                >
                  ⚡ Generate First Architectural BOQ
                </NfiButton>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Official Quotation Revisions ({project.quotations.length})
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Latest active: Version{' '}
                    {project.quotations[project.quotations.length - 1]?.version}.0 (Stage:{' '}
                    {project.stage})
                  </p>
                </div>
                <NfiButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedQuotationForModal(undefined);
                    setShowBoqModal(true);
                  }}
                  className="bg-slate-900 text-xs font-bold text-amber-400 hover:bg-slate-800"
                >
                  + Create New Quotation Revision
                </NfiButton>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
                {project.quotations.map((q, idx) => (
                  <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold" style={{ color: 'var(--nfi-text)' }}>
                            Version {q.version}.0
                          </h4>
                          {q.financialBreakdown && (
                            <span className="rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              GST 18% Verified
                            </span>
                          )}
                        </div>
                        <div
                          className="mt-1 flex gap-4 text-xs"
                          style={{ color: 'var(--nfi-text-secondary)' }}
                        >
                          {q.sentAt && <span>Dispatched: {formatDate(q.sentAt)}</span>}
                          {q.approvedAt && (
                            <span style={{ color: 'var(--nfi-success)' }} className="font-medium">
                              Client Approved: {formatDate(q.approvedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div
                            className="text-lg font-extrabold"
                            style={{ color: 'var(--nfi-text)' }}
                          >
                            {formatCurrency(q.totalAmount)}
                          </div>
                          <div className="mt-1">
                            <StatusBadge
                              status={q.approvedAt ? 'success' : 'warning'}
                              label={q.approvedAt ? 'ACCEPTED' : 'PENDING APPROVAL'}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuotationForModal(q.boqItems);
                            setShowBoqModal(true);
                          }}
                          className="shadow-2xs flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100"
                        >
                          📄 View &amp; Print Luxury PDF
                        </button>
                      </div>
                    </div>

                    <div
                      className="overflow-hidden rounded-lg border"
                      style={{ borderColor: 'var(--nfi-border)' }}
                    >
                      <table
                        className="min-w-full divide-y text-sm"
                        style={{ borderColor: 'var(--nfi-border)' }}
                      >
                        <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
                          <tr>
                            <th
                              className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--nfi-text-secondary)' }}
                            >
                              Item &amp; Specifications
                            </th>
                            <th
                              className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--nfi-text-secondary)' }}
                            >
                              Qty / Area
                            </th>
                            <th
                              className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--nfi-text-secondary)' }}
                            >
                              Unit Price
                            </th>
                            <th
                              className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--nfi-text-secondary)' }}
                            >
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className="divide-y bg-white"
                          style={{ borderColor: 'var(--nfi-border)' }}
                        >
                          {q.boqItems.map((item, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3" style={{ color: 'var(--nfi-text)' }}>
                                <span className="font-bold text-slate-900">
                                  {item.roomName ? `[${item.roomName}] ` : ''}
                                  {item.description}
                                </span>
                                {(item.coreMaterial || item.finish || item.hardwareBrand) && (
                                  <span className="mt-0.5 block text-[11px] text-slate-500">
                                    {item.coreMaterial
                                      ? `Substrate: ${item.coreMaterial.replace(/_/g, ' ')}`
                                      : ''}
                                    {item.finish
                                      ? ` · Finish: ${item.finish.replace(/_/g, ' ')}`
                                      : ''}
                                    {item.hardwareBrand ? ` · Hardware: ${item.hardwareBrand}` : ''}
                                  </span>
                                )}
                              </td>
                              <td
                                className="px-4 py-3 text-right"
                                style={{ color: 'var(--nfi-text-secondary)' }}
                              >
                                {item.dimensions?.areaSqft
                                  ? `${item.dimensions.areaSqft} sqft`
                                  : `${item.quantity} nos`}
                              </td>
                              <td
                                className="px-4 py-3 text-right"
                                style={{ color: 'var(--nfi-text-secondary)' }}
                              >
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td
                                className="px-4 py-3 text-right font-bold"
                                style={{ color: 'var(--nfi-text)' }}
                              >
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div
          className="overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          {project.milestones.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--nfi-text-secondary)' }}>
              <p>No payment milestones defined.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {project.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-5 transition-colors hover:bg-gray-50/50"
                >
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--nfi-text)' }}>
                      {m.name}
                    </h4>
                    <p className="mt-1 text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
                      Due: {formatDate(m.dueDate)}
                    </p>
                    {m.paymentId && (
                      <p
                        className="mt-1 font-mono text-[10px]"
                        style={{ color: 'var(--nfi-text-secondary)' }}
                      >
                        Ref: {m.paymentId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className="mb-1.5 text-base font-bold"
                      style={{ color: 'var(--nfi-text)' }}
                    >
                      {formatCurrency(m.amount)}
                    </div>
                    <StatusBadge
                      status={
                        m.status === 'PAID'
                          ? 'success'
                          : m.status === 'OVERDUE'
                            ? 'error'
                            : 'default'
                      }
                      label={m.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'site-stream' && (
        <SiteStreamTab
          project={project}
          onRecordInspection={handleRecordInspection}
          onUploadPhoto={handleUploadPhoto}
          onLogSnag={handleLogSnag}
          onResolveSnag={handleResolveSnag}
        />
      )}

      {/* Advance Stage Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAdvanceModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-lg border bg-white shadow-xl"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <div className="border-b px-6 py-5" style={{ borderColor: 'var(--nfi-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>
                Advance Project Stage
              </h2>
            </div>
            <div className="p-6">
              <p className="mb-5 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                Current stage:{' '}
                <strong style={{ color: 'var(--nfi-text)' }}>
                  {(project.stage || 'STAGE').replace(/_/g, ' ')}
                </strong>
              </p>
              <FormField label="Target Stage" htmlFor="targetStage">
                <select
                  id="targetStage"
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as DesignProjectStage)}
                  className={inputClassName}
                  style={inputStyle}
                >
                  {STAGES_ORDER.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div
              className="flex justify-end gap-3 border-t px-6 py-4"
              style={{
                borderColor: 'var(--nfi-border)',
                backgroundColor: 'var(--nfi-surface-muted)',
              }}
            >
              <NfiButton onClick={() => setShowAdvanceModal(false)} variant="secondary" size="sm">
                Cancel
              </NfiButton>
              <NfiButton
                onClick={handleAdvanceStage}
                disabled={advancing || targetStage === project.stage}
                variant="primary"
                size="sm"
                loading={advancing}
              >
                Confirm Transition
              </NfiButton>
            </div>
          </div>
        </div>
      )}

      {/* BOQ & Multi-Stage Quotation PDF Builder Modal */}
      {showBoqModal && (
        <BoqBuilderModal
          isOpen={showBoqModal}
          onClose={() => setShowBoqModal(false)}
          projectContext={{
            id: project._id,
            projectCode: project.projectCode,
            clientName: `Patron #${project.customerId.slice(-6)}`,
            propertyAddress: `${project.propertyAddress.street}, ${project.propertyAddress.city}`,
            areaSqft: project.propertyDetails.areaSqft,
            configuration: project.propertyDetails.bhk
              ? `${project.propertyDetails.bhk} BHK`
              : 'Bespoke Residence',
            existingQuotationsCount: project.quotations.length,
            expectedVersion: project.version,
          }}
          initialBoqItems={selectedQuotationForModal}
          onSaveQuotation={handleSaveQuotationFromModal}
        />
      )}
    </div>
  );
}
