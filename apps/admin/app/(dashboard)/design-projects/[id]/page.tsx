'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DesignProjectService, DesignProject, DesignProjectStage } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';

const STAGES_ORDER: DesignProjectStage[] = [
  'LEAD_CAPTURED', 'QUALIFIED', 'CONSULTATION_SCHEDULED', 'SITE_VISIT_COMPLETED',
  'PROPOSAL_IN_PROGRESS', 'QUOTATION_SENT', 'CLIENT_REVIEW', 'REVISION', 'APPROVED',
  'ADVANCE_PAYMENT_COLLECTED', 'PROCUREMENT', 'EXECUTION_IN_PROGRESS', 
  'MILESTONE_PAYMENT_COLLECTED', 'QUALITY_CHECK', 'HANDOVER', 'WARRANTY_AMC'
];

export default function DesignProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<DesignProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'quotations' | 'milestones'>('details');

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetStage, setTargetStage] = useState<DesignProjectStage>('QUALIFIED');
  const [advancing, setAdvancing] = useState(false);

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
        console.error("Failed to load project:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProject();
  }, [id]);

  const handleAdvanceStage = async () => {
    if (!project) return;
    setAdvancing(true);
    try {
      await DesignProjectService.advanceStage(project._id, { targetStage, expectedVersion: project.version });
      const res = await DesignProjectService.getById(id);
      const resData = res as unknown as { data?: DesignProject } & DesignProject;
      setProject(resData.data || resData);
      setShowAdvanceModal(false);
    } catch (error) {
      console.error("Failed to advance stage:", error);
      alert("Failed to advance stage. It might have been updated by someone else.");
    } finally {
      setAdvancing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nfi-primary)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>Loading project details…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(198,40,40,0.1)', color: 'var(--nfi-danger)' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--nfi-text)' }}>Project Not Found</h2>
        <Link href="/design-projects"><NfiButton variant="secondary">Back to Projects</NfiButton></Link>
      </div>
    );
  }

  const currentStageIndex = STAGES_ORDER.indexOf(project.stage);
  const progressPercent = Math.max(5, Math.min(100, (currentStageIndex / (STAGES_ORDER.length - 1)) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.projectCode}
        description={`${project.propertyAddress.city}, ${project.propertyAddress.state}`}
        breadcrumbs={[{ label: 'Services' }, { label: 'Design Projects', href: '/design-projects' }, { label: project.projectCode }]}
        action={
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded" style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}>
              {project.projectType.replace('_', ' ')}
            </span>
            <NfiButton variant="primary" size="sm" onClick={() => setShowAdvanceModal(true)}>
              Advance Stage
            </NfiButton>
          </div>
        }
      />

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-lg border shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
        <div className="flex justify-between items-end mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nfi-text-secondary)' }}>Current Stage</div>
          <div className="text-base font-bold" style={{ color: 'var(--nfi-primary)' }}>{project.stage.replace(/_/g, ' ')}</div>
        </div>
        <div className="w-full rounded-full h-2 overflow-hidden mb-2" style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
          <div className="h-2 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--nfi-primary)' }}>
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider mt-2" style={{ color: 'var(--nfi-text-secondary)' }}>
          <span>Lead Captured</span>
          <span>Quotation</span>
          <span>Execution</span>
          <span>Handover</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--nfi-border)' }}>
        {(['details', 'quotations', 'milestones'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? '' : 'border-transparent'}`}
            style={activeTab === tab ? { borderColor: 'var(--nfi-primary)', color: 'var(--nfi-primary)' } : { color: 'var(--nfi-text-secondary)' }}
          >
            {tab} {tab === 'quotations' ? `(${project.quotations.length})` : tab === 'milestones' ? `(${project.milestones.length})` : ''}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Property Info">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 border-b pb-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Address</span>
                <span className="text-sm font-medium col-span-2" style={{ color: 'var(--nfi-text)' }}>
                  {project.propertyAddress.street}, {project.propertyAddress.city}, <br/>
                  {project.propertyAddress.state} {project.propertyAddress.postalCode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Size</span>
                <span className="text-sm font-medium col-span-2" style={{ color: 'var(--nfi-text)' }}>{project.propertyDetails.areaSqft} sq.ft.</span>
              </div>
              {(project.propertyDetails.rooms || project.propertyDetails.bhk) && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Layout</span>
                  <span className="text-sm font-medium col-span-2" style={{ color: 'var(--nfi-text)' }}>
                    {project.propertyDetails.bhk ? `${project.propertyDetails.bhk} BHK` : ''} 
                    {project.propertyDetails.rooms ? ` (${project.propertyDetails.rooms} Rooms)` : ''}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Financials & Team">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 border-b pb-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Est. Budget</span>
                <span className="text-sm font-medium col-span-2" style={{ color: 'var(--nfi-text)' }}>
                  {formatCurrency(project.budgetRange.min)} - {formatCurrency(project.budgetRange.max)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Customer ID</span>
                <span className="text-sm font-mono col-span-2 px-2 py-1 rounded inline-block w-fit" style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}>
                  {project.customerId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm col-span-1" style={{ color: 'var(--nfi-text-secondary)' }}>Lead Ref</span>
                <span className="text-sm font-mono col-span-2">
                  {project.leadId ? (
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}>{project.leadId}</span>
                  ) : <span style={{ color: 'var(--nfi-text-secondary)' }}>Direct Creation</span>}
                </span>
              </div>
            </div>
          </SectionCard>

          <div className="md:col-span-2">
            <SectionCard title="Stage History">
              <div className="relative border-l ml-3 space-y-6 py-2" style={{ borderColor: 'var(--nfi-border)' }}>
                {project.stageHistory.map((history, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: idx === project.stageHistory.length - 1 ? 'var(--nfi-primary)' : 'var(--nfi-text-secondary)', zIndex: 1 }}></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: idx === project.stageHistory.length - 1 ? 'var(--nfi-text)' : 'var(--nfi-text-secondary)' }}>
                          {history.stage.replace(/_/g, ' ')}
                        </h4>
                        {history.note && <p className="text-xs mt-1 italic" style={{ color: 'var(--nfi-text-secondary)' }}>&quot;{history.note}&quot;</p>}
                      </div>
                      <div className="text-xs whitespace-nowrap" style={{ color: 'var(--nfi-text-secondary)' }}>
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
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
          {project.quotations.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--nfi-text-secondary)' }}>
              <p>No quotations generated yet.</p>
              <div className="mt-4">
                <NfiButton variant="secondary" size="sm">Generate First BOQ</NfiButton>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {project.quotations.map((q, idx) => (
                <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h4 className="text-base font-bold" style={{ color: 'var(--nfi-text)' }}>Version {q.version}</h4>
                      <div className="flex gap-4 text-xs mt-1" style={{ color: 'var(--nfi-text-secondary)' }}>
                        {q.sentAt && <span>Sent: {formatDate(q.sentAt)}</span>}
                        {q.approvedAt && <span style={{ color: 'var(--nfi-success)' }} className="font-medium">Approved: {formatDate(q.approvedAt)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: 'var(--nfi-text)' }}>{formatCurrency(q.totalAmount)}</div>
                      <div className="mt-1">
                        <StatusBadge status={q.approvedAt ? 'success' : 'warning'} label={q.approvedAt ? 'ACCEPTED' : 'PENDING'} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
                    <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--nfi-border)' }}>
                      <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>Item</th>
                          <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>Qty</th>
                          <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>Unit Price</th>
                          <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
                        {q.boqItems.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3" style={{ color: 'var(--nfi-text)' }}>{item.description}</td>
                            <td className="px-4 py-3 text-right" style={{ color: 'var(--nfi-text-secondary)' }}>{item.quantity}</td>
                            <td className="px-4 py-3 text-right" style={{ color: 'var(--nfi-text-secondary)' }}>{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 font-medium text-right" style={{ color: 'var(--nfi-text)' }}>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
           {project.milestones.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--nfi-text-secondary)' }}>
              <p>No payment milestones defined.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {project.milestones.map((m, idx) => (
                <div key={idx} className="p-5 flex justify-between items-center transition-colors hover:bg-gray-50/50">
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--nfi-text)' }}>{m.name}</h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--nfi-text-secondary)' }}>Due: {formatDate(m.dueDate)}</p>
                    {m.paymentId && <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--nfi-text-secondary)' }}>Ref: {m.paymentId}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold mb-1.5" style={{ color: 'var(--nfi-text)' }}>{formatCurrency(m.amount)}</div>
                    <StatusBadge status={m.status === 'PAID' ? 'success' : m.status === 'OVERDUE' ? 'error' : 'default'} label={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advance Stage Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdvanceModal(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md border" style={{ borderColor: 'var(--nfi-border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--nfi-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>Advance Project Stage</h2>
            </div>
            <div className="p-6">
              <p className="text-sm mb-5" style={{ color: 'var(--nfi-text-secondary)' }}>
                Current stage: <strong style={{ color: 'var(--nfi-text)' }}>{project.stage.replace(/_/g, ' ')}</strong>
              </p>
              <FormField label="Target Stage" htmlFor="targetStage">
                <select id="targetStage" value={targetStage} onChange={e => setTargetStage(e.target.value as DesignProjectStage)} className={inputClassName} style={inputStyle}>
                  {STAGES_ORDER.map(stage => <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>)}
                </select>
              </FormField>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface-muted)' }}>
              <NfiButton onClick={() => setShowAdvanceModal(false)} variant="secondary" size="sm">Cancel</NfiButton>
              <NfiButton onClick={handleAdvanceStage} disabled={advancing || targetStage === project.stage} variant="primary" size="sm" loading={advancing}>
                Confirm Transition
              </NfiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
