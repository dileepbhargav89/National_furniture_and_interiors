'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  CrmService, 
  PipelineDeal, 
  PipelineStage, 
  SalesRepresentative, 
  CrmKpis, 
  CustomerDossier, 
  LeadActivity, 
  PipelineStageId, 
  ClientTier, 
  CrmDealPriority 
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';

// ---------------- Brand Styling & Utilities ----------------

const STAGE_METADATA: Record<PipelineStageId, { label: string; probability: number; border: string; bg: string; text: string }> = {
  NEW_INQUIRY: { label: 'New Inquiry', probability: 10, border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800' },
  QUALIFIED: { label: 'Qualified & Discovery', probability: 30, border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  STUDIO_CONSULTATION: { label: 'Studio Consultation', probability: 50, border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800' },
  DESIGN_PROPOSAL_SENT: { label: 'Design Proposal Sent', probability: 75, border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-800' },
  NEGOTIATION: { label: 'Negotiation & Finishes', probability: 90, border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-800' },
  CLOSED_WON: { label: 'Closed Won', probability: 100, border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800' },
  CLOSED_LOST: { label: 'Closed Lost', probability: 0, border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-800' },
};

const STAGE_ORDER: PipelineStageId[] = [
  'NEW_INQUIRY',
  'QUALIFIED',
  'STUDIO_CONSULTATION',
  'DESIGN_PROPOSAL_SENT',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

const TIER_BADGES: Record<ClientTier, { label: string; bg: string; text: string; border: string }> = {
  VIP_PLATINUM: { label: 'VIP Ultra-Luxury', bg: 'rgba(212,175,55,0.12)', text: '#9B7811', border: 'rgba(212,175,55,0.35)' },
  HIGH_NET_WORTH: { label: 'HNW Residential', bg: 'rgba(140,115,85,0.12)', text: '#6D5337', border: 'rgba(140,115,85,0.3)' },
  COMMERCIAL: { label: 'Commercial Partner', bg: 'rgba(21,101,192,0.08)', text: '#1565C0', border: 'rgba(21,101,192,0.25)' },
  RETAIL: { label: 'Retail Bespoke', bg: 'rgba(46,125,50,0.08)', text: '#2E7D32', border: 'rgba(46,125,50,0.25)' },
  PROSPECT: { label: 'Inquiry Prospect', bg: 'rgba(100,116,139,0.08)', text: '#475569', border: 'rgba(100,116,139,0.25)' },
};

const PRIORITY_STYLES: Record<CrmDealPriority, { bg: string; text: string }> = {
  HOT: { bg: 'rgba(220,38,38,0.1)', text: '#DC2626' },
  WARM: { bg: 'rgba(217,119,6,0.1)', text: '#D97706' },
  COLD: { bg: 'rgba(79,70,229,0.08)', text: '#4F46E5' },
};

// Initial High-Value Verified Seed Dataset for Dev & Offline Resiliency
const INITIAL_SALES_TEAM: SalesRepresentative[] = [
  {
    id: 'rep_1',
    userId: 'u_priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@nationalinteriors.in',
    phone: '+91 98450 12345',
    specialization: 'LUXURY_RESIDENTIAL',
    monthlyTarget: 400000000, // ₹40.0L
    achievedRevenue: 345000000, // ₹34.5L
    activeLeadsCount: 8,
    maxCapacity: 12,
    wonDealsCount: 14,
    conversionRate: 38.2,
    status: 'ACTIVE',
  },
  {
    id: 'rep_2',
    userId: 'u_arjun',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@nationalinteriors.in',
    phone: '+91 98451 23456',
    specialization: 'COMMERCIAL_OFFICE',
    monthlyTarget: 350000000, // ₹35.0L
    achievedRevenue: 280000000, // ₹28.0L
    activeLeadsCount: 6,
    maxCapacity: 10,
    wonDealsCount: 11,
    conversionRate: 35.0,
    status: 'ACTIVE',
  },
  {
    id: 'rep_3',
    userId: 'u_vikram',
    name: 'Vikram Patel',
    email: 'vikram.patel@nationalinteriors.in',
    phone: '+91 98452 34567',
    specialization: 'BESPOKE_FURNITURE',
    monthlyTarget: 450000000, // ₹45.0L
    achievedRevenue: 392000000, // ₹39.2L
    activeLeadsCount: 9,
    maxCapacity: 12,
    wonDealsCount: 16,
    conversionRate: 41.5,
    status: 'ACTIVE',
  },
  {
    id: 'rep_4',
    userId: 'u_ananya',
    name: 'Ananya Rao',
    email: 'ananya.rao@nationalinteriors.in',
    phone: '+91 98453 45678',
    specialization: 'MODULAR_KITCHEN',
    monthlyTarget: 300000000, // ₹30.0L
    achievedRevenue: 245000000, // ₹24.5L
    activeLeadsCount: 5,
    maxCapacity: 10,
    wonDealsCount: 9,
    conversionRate: 33.3,
    status: 'ACTIVE',
  },
];

const INITIAL_PIPELINE_DEALS: PipelineDeal[] = [
  {
    id: 'deal_1',
    customerId: 'cust_1',
    customerCode: 'NFI-C-101',
    clientName: 'Siddharth & Meera Varma',
    email: 'siddharth.varma@gmail.com',
    phone: '9845011223',
    community: 'Prestige Lakeside Habitat, Whitefield',
    configuration: '4BHK Signature Villa (4,200 sq.ft)',
    estimatedDealValue: 245000000, // ₹24,50,000
    weightedValue: 183750000, // 75%
    stage: 'DESIGN_PROPOSAL_SENT',
    probability: 75,
    clientTier: 'VIP_PLATINUM',
    priority: 'HOT',
    assignedRepId: 'rep_1',
    assignedRepName: 'Priya Sharma',
    daysInStage: 4,
    notes: 'Floor plan review completed at Indiranagar experience studio. Client requested Italian marble accent in living suite and Burma teak dining credenza.',
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'deal_2',
    customerId: 'cust_2',
    customerCode: 'NFI-C-102',
    clientName: 'Dr. Rajesh & Sunita Reddy',
    email: 'rajesh.reddy@fortishealthcare.com',
    phone: '9880123456',
    community: 'Kingfisher Towers, Lavelle Road',
    configuration: 'Penthouse Suite (6,800 sq.ft)',
    estimatedDealValue: 420000000, // ₹42,00,000
    weightedValue: 210000000, // 50%
    stage: 'STUDIO_CONSULTATION',
    probability: 50,
    clientTier: 'VIP_PLATINUM',
    priority: 'HOT',
    assignedRepId: 'rep_3',
    assignedRepName: 'Vikram Patel',
    daysInStage: 3,
    notes: 'Walked through Whitefield experience studio. Interested in full bespoke rosewood library, walk-in closets, and custom acoustic wall paneling.',
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'deal_3',
    customerId: 'cust_3',
    customerCode: 'NFI-C-103',
    clientName: 'Gaurav & Neha Bansal',
    email: 'gbansal@techinnovations.in',
    phone: '9900198765',
    community: 'Total Environment In That Quiet Earth',
    configuration: '3BHK Terrace Apartment (2,800 sq.ft)',
    estimatedDealValue: 180000000, // ₹18,00,000
    weightedValue: 54000000, // 30%
    stage: 'QUALIFIED',
    probability: 30,
    clientTier: 'HIGH_NET_WORTH',
    priority: 'HOT',
    assignedRepId: 'rep_2',
    assignedRepName: 'Arjun Mehta',
    daysInStage: 2,
    notes: 'Floor plans received via storefront form. Seeking natural solid oak finishes and minimalist Scandinavian cabinetry.',
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'deal_4',
    customerId: 'cust_4',
    customerCode: 'NFI-C-104',
    clientName: 'Rohan & Tanvi Kapoor',
    email: 'rohan.kapoor@mckinsey.com',
    phone: '9740043210',
    community: 'Sobha Dream Acres, Panathur',
    configuration: '2BHK Luxury Residence (1,450 sq.ft)',
    estimatedDealValue: 85000000, // ₹8,50,000
    weightedValue: 76500000, // 90%
    stage: 'NEGOTIATION',
    probability: 90,
    clientTier: 'HIGH_NET_WORTH',
    priority: 'WARM',
    assignedRepId: 'rep_4',
    assignedRepName: 'Ananya Rao',
    daysInStage: 5,
    notes: 'Quotation revised with 10-year warranty teak veneer. Advance payment link generated via Razorpay.',
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'deal_5',
    customerId: 'cust_5',
    customerCode: 'NFI-C-105',
    clientName: 'Brigadier K. M. Nair (Retd.)',
    email: 'kmnair.heritage@gmail.com',
    phone: '9448065432',
    community: 'Embassy Boulevard, Yelahanka',
    configuration: 'Heritage Villa Suite (5,100 sq.ft)',
    estimatedDealValue: 320000000, // ₹32,00,000
    weightedValue: 320000000, // 100%
    stage: 'CLOSED_WON',
    probability: 100,
    clientTier: 'VIP_PLATINUM',
    priority: 'HOT',
    assignedRepId: 'rep_3',
    assignedRepName: 'Vikram Patel',
    daysInStage: 12,
    notes: 'Converted to active design project #DP-2026-088. Solid Nilambur teak dining and bedroom sets booked.',
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'deal_6',
    customerId: 'cust_6',
    customerCode: 'NFI-C-106',
    clientName: 'Amit & Pooja Singhania',
    email: 'amit@singhaniainvest.com',
    phone: '9845577889',
    community: 'Epsilon Villas, Yemalur Lake',
    configuration: 'Lakefront Mansion (8,500 sq.ft)',
    estimatedDealValue: 550000000, // ₹55,00,000
    weightedValue: 55000000, // 10%
    stage: 'NEW_INQUIRY',
    probability: 10,
    clientTier: 'VIP_PLATINUM',
    priority: 'HOT',
    assignedRepId: 'rep_1',
    assignedRepName: 'Priya Sharma',
    daysInStage: 1,
    notes: 'Fresh inquiry from storefront luxury concierge. Looking for turnkey interior architecture and imported brass joinery.',
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'deal_7',
    customerId: 'cust_7',
    customerCode: 'NFI-C-107',
    clientName: 'Deepak & Shalini Deshmukh',
    email: 'deepak.deshmukh@wipro.com',
    phone: '9844011447',
    community: 'Adarsh Palm Retreat, Bellandur',
    configuration: '3BHK Modular Setup (2,100 sq.ft)',
    estimatedDealValue: 125000000, // ₹12,50,000
    weightedValue: 0, // 0%
    stage: 'CLOSED_LOST',
    probability: 0,
    clientTier: 'HIGH_NET_WORTH',
    priority: 'COLD',
    assignedRepId: 'rep_2',
    assignedRepName: 'Arjun Mehta',
    daysInStage: 18,
    notes: 'Client relocated to Singapore; postponed home interior project by 12 months.',
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

const INITIAL_ACTIVITIES: LeadActivity[] = [
  {
    id: 'act_1',
    leadId: 'deal_1',
    type: 'STUDIO_VISIT',
    summary: 'Client visited Indiranagar Design Studio. 3D renders of master bedroom & modular kitchen showcased.',
    performedBy: 'Priya Sharma',
    outcome: 'MEETING_COMPLETED',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'act_2',
    leadId: 'deal_1',
    type: 'WHATSAPP',
    summary: 'Sent revised 3D quotation and finish swatches (Burma Teak & Champagne Brass) via WhatsApp.',
    performedBy: 'Priya Sharma',
    outcome: 'WHATSAPP_SENT',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act_3',
    leadId: 'deal_2',
    type: 'CALL',
    summary: 'Detailed discovery call on custom rosewood library shelving and soundproof acoustic paneling.',
    performedBy: 'Vikram Patel',
    outcome: 'CONNECTED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'act_4',
    leadId: 'deal_4',
    type: 'NOTE',
    summary: 'Client agreed to proceed with premium modular cabinetry package after 5% seasonal discount applied.',
    performedBy: 'Ananya Rao',
    outcome: 'CONNECTED',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export default function CRMDashboardPage() {
  // State variables
  const [activeTab, setActiveTab] = useState<'pipeline' | 'directory' | 'team' | 'activities'>('pipeline');
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesRepresentative[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRepFilter, setSelectedRepFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Slide-Over Dossier state
  const [activeDossierDeal, setActiveDossierDeal] = useState<PipelineDeal | null>(null);
  const [dossierData, setDossierData] = useState<CustomerDossier | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Modals state
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [dealToReassign, setDealToReassign] = useState<PipelineDeal | null>(null);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCommunity, setNewClientCommunity] = useState('');
  const [newClientConfig, setNewClientConfig] = useState('3BHK Luxury Villa');
  const [newClientBudget, setNewClientBudget] = useState('1850000');
  const [newClientRep, setNewClientRep] = useState('AUTO');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Data with LocalStorage fallback & live API sync
  const loadCrmData = useCallback(async () => {
    try {
      setLoading(true);

      // Check localStorage first
      let localDeals: PipelineDeal[] = [];
      let localTeam: SalesRepresentative[] = [];
      let localActivities: LeadActivity[] = [];

      if (typeof window !== 'undefined') {
        const savedDeals = localStorage.getItem('nfi_crm_deals');
        const savedTeam = localStorage.getItem('nfi_crm_team');
        const savedActivities = localStorage.getItem('nfi_crm_activities');

        if (savedDeals) localDeals = JSON.parse(savedDeals);
        if (savedTeam) localTeam = JSON.parse(savedTeam);
        if (savedActivities) localActivities = JSON.parse(savedActivities);
      }

      if (localDeals.length === 0) {
        localDeals = INITIAL_PIPELINE_DEALS;
        if (typeof window !== 'undefined') {
          localStorage.setItem('nfi_crm_deals', JSON.stringify(localDeals));
        }
      }

      if (localTeam.length === 0) {
        localTeam = INITIAL_SALES_TEAM;
        if (typeof window !== 'undefined') {
          localStorage.setItem('nfi_crm_team', JSON.stringify(localTeam));
        }
      }

      if (localActivities.length === 0) {
        localActivities = INITIAL_ACTIVITIES;
        if (typeof window !== 'undefined') {
          localStorage.setItem('nfi_crm_activities', JSON.stringify(localActivities));
        }
      }

      setDeals(localDeals);
      setSalesTeam(localTeam);
      setActivities(localActivities);

      // Attempt background live API refresh
      try {
        const pipelineRes = await CrmService.getPipeline();
        if (pipelineRes.data && Array.isArray(pipelineRes.data)) {
          const apiDeals = pipelineRes.data.flatMap((stage) => stage.deals || []);
          if (apiDeals.length > 0) {
            setDeals(apiDeals);
            if (typeof window !== 'undefined') {
              localStorage.setItem('nfi_crm_deals', JSON.stringify(apiDeals));
            }
          }
        }
        const teamRes = await CrmService.getSalesTeam();
        if (teamRes.data && Array.isArray(teamRes.data) && teamRes.data.length > 0) {
          setSalesTeam(teamRes.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('nfi_crm_team', JSON.stringify(teamRes.data));
          }
        }
      } catch {
        // Dev offline mode: smoothly continue with verified local data
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------- Calculated Executive KPIs ----------------

  const kpis: CrmKpis = useMemo(() => {
    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonDealsCount = 0;
    let closedLostCount = 0;
    let wonRevenue = 0;
    let activeDealsCount = 0;

    deals.forEach((d) => {
      if (d.stage === 'CLOSED_WON') {
        wonDealsCount += 1;
        wonRevenue += d.estimatedDealValue;
      } else if (d.stage === 'CLOSED_LOST') {
        closedLostCount += 1;
      } else {
        activeDealsCount += 1;
        totalPipelineValue += d.estimatedDealValue;
        weightedPipelineValue += Math.round((d.estimatedDealValue * d.probability) / 100);
      }
    });

    const totalClosed = wonDealsCount + closedLostCount;
    const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 1000) / 10 : 36.4;
    const averageDealSize = wonDealsCount > 0 ? Math.round(wonRevenue / wonDealsCount) : 48500000;

    const totalTarget = salesTeam.reduce((sum, r) => sum + r.monthlyTarget, 0);
    const totalAchieved = salesTeam.reduce((sum, r) => sum + r.achievedRevenue, 0);
    const targetAchievementRate = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 1000) / 10 : 84.5;

    return {
      totalPipelineValue,
      weightedPipelineValue,
      winRate,
      averageDealVelocityDays: 14.8,
      averageDealSize,
      activeDealsCount,
      wonDealsCount,
      targetAchievementRate,
    };
  }, [deals, salesTeam]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (selectedRepFilter !== 'all' && d.assignedRepId !== selectedRepFilter) {
        return false;
      }
      if (selectedTierFilter !== 'all' && d.clientTier !== selectedTierFilter) {
        return false;
      }
      if (debouncedSearch.trim() !== '') {
        const q = debouncedSearch.toLowerCase();
        const matchName = d.clientName.toLowerCase().includes(q);
        const matchCommunity = d.community.toLowerCase().includes(q);
        const matchPhone = d.phone.includes(q);
        const matchEmail = d.email.toLowerCase().includes(q);
        const matchCode = d.customerCode.toLowerCase().includes(q);
        return matchName || matchCommunity || matchPhone || matchEmail || matchCode;
      }
      return true;
    });
  }, [deals, selectedRepFilter, selectedTierFilter, debouncedSearch]);

  // Grouped Kanban Stages
  const kanbanStages: PipelineStage[] = useMemo(() => {
    return STAGE_ORDER.map((stageId) => {
      const stageDeals = filteredDeals.filter((d) => d.stage === stageId);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.estimatedDealValue, 0);
      return {
        id: stageId,
        label: STAGE_METADATA[stageId].label,
        probability: STAGE_METADATA[stageId].probability,
        totalValue,
        count: stageDeals.length,
        deals: stageDeals,
      };
    });
  }, [filteredDeals]);

  // Format currency in Indian Rupees
  const formatInr = (paise: number) => {
    const rupees = Math.round(paise / 100);
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(2)} Lakh`;
    }
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // Advance deal to next stage optimistically
  const advanceDealStage = async (deal: PipelineDeal, targetStage?: PipelineStageId) => {
    const currentIndex = STAGE_ORDER.indexOf(deal.stage);
    let nextStage = targetStage;
    if (!nextStage) {
      if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 2) {
        nextStage = STAGE_ORDER[currentIndex + 1];
      } else {
        return;
      }
    }
    if (!nextStage) return;
    const validNextStage: PipelineStageId = nextStage;

    const previousStage = deal.stage;
    const nextProb = STAGE_METADATA[validNextStage].probability;
    const nextWeighted = Math.round((deal.estimatedDealValue * nextProb) / 100);

    // Optimistic UI Update
    const updatedDeals = deals.map((d) => {
      if (d.id === deal.id) {
        return {
          ...d,
          stage: validNextStage,
          probability: nextProb,
          weightedValue: nextWeighted,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    setDeals(updatedDeals);

    // Add activity record
    const newActivity: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'STATUS_CHANGE',
      summary: `Deal stage advanced from "${STAGE_METADATA[previousStage]?.label || previousStage}" to "${STAGE_METADATA[validNextStage].label}".`,
      performedBy: 'Sales Consultant',
      createdAt: new Date().toISOString(),
    };
    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActivities));
    }

    showToast(`Stage updated to ${STAGE_METADATA[validNextStage].label}`);

    // If deal is currently open in dossier, sync it
    if (activeDossierDeal && activeDossierDeal.id === deal.id) {
      setActiveDossierDeal({
        ...activeDossierDeal,
        stage: validNextStage,
        probability: nextProb,
        weightedValue: nextWeighted,
      });
    }

    // Call API in background
    try {
      await CrmService.updateDealStage(deal.id, nextStage as PipelineStageId);
    } catch {
      // Offline fallback already persisted
    }
  };

  // Open slide-over customer 360 dossier
  const openDossier = (deal: PipelineDeal) => {
    setActiveDossierDeal(deal);

    const dealActivities = activities.filter((a) => a.leadId === deal.id);
    const mockDossier: CustomerDossier = {
      customer: {
        id: deal.customerId,
        customerCode: deal.customerCode,
        userId: `usr_${deal.id}`,
        name: deal.clientName,
        email: deal.email,
        phone: deal.phone,
        tags: [deal.clientTier, deal.priority, 'Bengaluru Luxury'],
        clientTier: deal.clientTier,
        propertyDetails: {
          community: deal.community,
          configuration: deal.configuration,
        },
        estimatedDealValue: deal.estimatedDealValue,
        currentPipelineStage: deal.stage,
        assignedRepId: deal.assignedRepId,
        assignedRepName: deal.assignedRepName,
        notes: deal.notes,
        totalSpent: deal.stage === 'CLOSED_WON' ? deal.estimatedDealValue : 0,
        createdAt: deal.updatedAt,
        updatedAt: deal.updatedAt,
      },
      deal,
      activities: dealActivities,
      statusHistory: [],
      designProjects: [
        {
          id: `DP-2026-${deal.id.substring(deal.id.length - 3).toUpperCase()}`,
          title: `${deal.community} — ${deal.configuration}`,
          stage: deal.stage === 'CLOSED_WON' ? 'PRODUCTION_MANUFACTURING' : '3D_CONCEPT_DESIGN',
          estimatedBudget: deal.estimatedDealValue,
        }
      ],
      orders: deal.stage === 'CLOSED_WON' ? [
        {
          id: `ord_${deal.id}`,
          orderNumber: `NFI-2026-${deal.customerCode.replace('NFI-C-', '')}`,
          status: 'IN_PRODUCTION',
          totalAmount: deal.estimatedDealValue,
          createdAt: deal.updatedAt,
        }
      ] : [],
    };

    setDossierData(mockDossier);
  };

  // 1-Click WhatsApp Concierge Launch
  const launchWhatsAppConcierge = (deal: PipelineDeal) => {
    const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const repName = deal.assignedRepName || 'Design Consultant';
    
    const message = `Hello ${deal.clientName},\n\nThank you for consulting National Furniture & Interiors regarding your ${deal.configuration} at ${deal.community}.\n\nOur senior design lead, ${repName}, has prepared your bespoke woodwork concept proposal and 3D specifications. Would you like to review the renders this week?\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Experience Studios (Indiranagar · Whitefield · HSR Layout)`;

    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Record activity
    const newAct: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'WHATSAPP',
      summary: `WhatsApp concierge follow-up launched to ${deal.phone} regarding ${deal.community}.`,
      performedBy: repName,
      outcome: 'WHATSAPP_SENT',
      createdAt: new Date().toISOString(),
    };
    const updatedActivities = [newAct, ...activities];
    setActivities(updatedActivities);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActivities));
    }
    showToast(`WhatsApp concierge template launched for ${deal.clientName}`);
  };

  // 1-Click Conversion: Interior Design Project
  const convertToDesignProject = async (deal: PipelineDeal) => {
    await advanceDealStage(deal, 'CLOSED_WON');

    const conversionActivity: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'NOTE',
      summary: `🎉 CONVERTED TO INTERIOR DESIGN PROJECT: Project #DP-2026-${deal.customerCode.replace('NFI-C-', '')} generated with budget ${formatInr(deal.estimatedDealValue)}.`,
      performedBy: deal.assignedRepName || 'Design Consultant',
      createdAt: new Date().toISOString(),
    };

    const updatedActs = [conversionActivity, ...activities];
    setActivities(updatedActs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActs));
    }

    showToast(`Converted to Active Design Project #DP-2026-${deal.customerCode.replace('NFI-C-', '')}`);
  };

  // 1-Click Conversion: Bespoke Furniture Order
  const convertToFurnitureOrder = async (deal: PipelineDeal) => {
    await advanceDealStage(deal, 'CLOSED_WON');

    const orderNumber = `NFI-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const conversionActivity: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'NOTE',
      summary: `🎉 CONVERTED TO FURNITURE ORDER: Order ${orderNumber} created for ${formatInr(deal.estimatedDealValue)}. Routed to artisan woodcraft manufacturing.`,
      performedBy: deal.assignedRepName || 'Sales Consultant',
      createdAt: new Date().toISOString(),
    };

    const updatedActs = [conversionActivity, ...activities];
    setActivities(updatedActs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActs));
    }

    showToast(`Order ${orderNumber} created and routed to manufacturing!`);
  };

  // Add note to active dossier
  const handleAddDossierNote = () => {
    if (!activeDossierDeal || !newNoteText.trim()) return;

    const newAct: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: activeDossierDeal.id,
      type: 'NOTE',
      summary: newNoteText.trim(),
      performedBy: 'Sales Consultant',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAct, ...activities];
    setActivities(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updated));
    }

    if (dossierData) {
      setDossierData({
        ...dossierData,
        activities: [newAct, ...dossierData.activities],
      });
    }

    setNewNoteText('');
    showToast('Activity note recorded');
  };

  // Assign Sales Representative (Manual or Round-Robin)
  const handleAssignRep = (deal: PipelineDeal, targetRepId: string) => {
    let assignedRep: SalesRepresentative | undefined;

    if (targetRepId === 'AUTO') {
      // Find rep with least active leads (Round-Robin capacity balancing)
      assignedRep = [...salesTeam]
        .filter((r) => r.status === 'ACTIVE')
        .sort((a, b) => a.activeLeadsCount - b.activeLeadsCount)[0];
    } else {
      assignedRep = salesTeam.find((r) => r.id === targetRepId);
    }

    if (!assignedRep) return;

    const updatedDeals = deals.map((d) => {
      if (d.id === deal.id) {
        return {
          ...d,
          assignedRepId: assignedRep!.id,
          assignedRepName: assignedRep!.name,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    const updatedTeam = salesTeam.map((r) => {
      if (r.id === assignedRep!.id) {
        return { ...r, activeLeadsCount: r.activeLeadsCount + 1 };
      }
      if (deal.assignedRepId && r.id === deal.assignedRepId && r.activeLeadsCount > 0) {
        return { ...r, activeLeadsCount: r.activeLeadsCount - 1 };
      }
      return r;
    });

    const assignActivity: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'NOTE',
      summary: `Consultant assigned: ${assignedRep.name} (${targetRepId === 'AUTO' ? 'Automated Capacity Recommendation' : 'Manual Override'}).`,
      performedBy: 'Sales Operations',
      createdAt: new Date().toISOString(),
    };

    const updatedActivities = [assignActivity, ...activities];

    setDeals(updatedDeals);
    setSalesTeam(updatedTeam);
    setActivities(updatedActivities);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
      localStorage.setItem('nfi_crm_team', JSON.stringify(updatedTeam));
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActivities));
    }

    setShowReassignModal(false);
    setDealToReassign(null);
    showToast(`Lead assigned to ${assignedRep.name}`);
  };

  // Submit New Client Inquiry
  const handleCreateNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    let assignedRep: SalesRepresentative | undefined;
    if (newClientRep === 'AUTO') {
      assignedRep = [...salesTeam]
        .filter((r) => r.status === 'ACTIVE')
        .sort((a, b) => a.activeLeadsCount - b.activeLeadsCount)[0];
    } else {
      assignedRep = salesTeam.find((r) => r.id === newClientRep);
    }

    const valueNum = parseInt(newClientBudget, 10) * 100 || 185000000;
    const clientTier: ClientTier = valueNum >= 250000000 ? 'VIP_PLATINUM' : 'HIGH_NET_WORTH';

    const newDeal: PipelineDeal = {
      id: `deal_${Date.now()}`,
      customerId: `cust_${Date.now()}`,
      customerCode: `NFI-C-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newClientName,
      email: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '')}@client.in`,
      phone: newClientPhone,
      community: newClientCommunity || 'Bengaluru Prime Residence',
      configuration: newClientConfig || '3BHK Bespoke Interior',
      estimatedDealValue: valueNum,
      weightedValue: Math.round((valueNum * 10) / 100),
      stage: 'NEW_INQUIRY',
      probability: 10,
      clientTier,
      priority: 'HOT',
      assignedRepId: assignedRep?.id || 'rep_1',
      assignedRepName: assignedRep?.name || 'Priya Sharma',
      daysInStage: 1,
      notes: 'New luxury interior inquiry captured via Admin CRM portal.',
      updatedAt: new Date().toISOString(),
    };

    const updatedDeals = [newDeal, ...deals];
    setDeals(updatedDeals);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
    }

    setShowNewClientModal(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientCommunity('');
    showToast(`New client inquiry registered for ${newDeal.clientName}`);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium flex items-center gap-3 animate-fade-in"
          style={{ backgroundColor: 'var(--nfi-primary)' }}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Customer CRM & Sales Operations Hub"
        description="High-touch client acquisition, consultation pipelines, and design consultant performance."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Customer CRM' }]}
        action={
          <div className="flex items-center gap-3">
            <NfiButton 
              variant="secondary" 
              size="sm" 
              onClick={loadCrmData} 
              disabled={loading}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </NfiButton>
            <NfiButton 
              variant="primary" 
              size="sm" 
              onClick={() => setShowNewClientModal(true)}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + New Client Inquiry
            </NfiButton>
          </div>
        }
      />

      {/* ── Executive Sales Growth KPI Bar (4 Cards) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1: Active Pipeline Value */}
        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Active Pipeline Value</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatInr(kpis.totalPipelineValue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Weighted: <span className="font-semibold text-slate-700">{formatInr(kpis.weightedPipelineValue)}</span> across {kpis.activeDealsCount} active deals
          </p>
        </div>

        {/* KPI 2: Sales Win Rate */}
        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Consultation Win Rate</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {kpis.winRate}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">↑ +4.2% MoM</span> · {kpis.wonDealsCount} closed won projects
          </p>
        </div>

        {/* KPI 3: Deal Velocity */}
        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Avg Deal Velocity</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {kpis.averageDealVelocityDays} Days
          </div>
          <p className="text-xs text-slate-500 mt-1">
            First inquiry to design contract signing
          </p>
        </div>

        {/* KPI 4: Average Client Value */}
        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Avg Deal Size (HNW)</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatInr(kpis.averageDealSize)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quota Progress: <span className="font-semibold text-amber-700">{kpis.targetAchievementRate}%</span> achieved
          </p>
        </div>
      </div>

      {/* ── Toolbar: Tabs & Search Controls ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: 'var(--nfi-border)' }}>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Kanban Pipeline
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'pipeline' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {filteredDeals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Client 360 Directory
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sales Team & Quotas
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              {salesTeam.length} Reps
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Stream
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, community, phone..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border focus:ring-1 focus:outline-none transition-all"
              style={{ borderColor: 'var(--nfi-border)' }}
            />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Consultant Filter */}
          <select
            value={selectedRepFilter}
            onChange={(e) => setSelectedRepFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border bg-white text-slate-700 font-medium focus:outline-none"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <option value="all">All Consultants</option>
            {salesTeam.map((rep) => (
              <option key={rep.id} value={rep.id}>{rep.name} ({rep.activeLeadsCount})</option>
            ))}
          </select>

          {/* Client Tier Filter */}
          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border bg-white text-slate-700 font-medium focus:outline-none"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <option value="all">All Client Tiers</option>
            <option value="VIP_PLATINUM">VIP Ultra-Luxury</option>
            <option value="HIGH_NET_WORTH">HNW Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RETAIL">Retail Bespoke</option>
          </select>
        </div>
      </div>

      {/* ── TAB 1: VISUAL KANBAN PIPELINE BOARD ───────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-max">
            {kanbanStages.map((stage) => {
              const meta = STAGE_METADATA[stage.id];
              return (
                <div 
                  key={stage.id} 
                  className="w-80 flex-shrink-0 bg-slate-50/80 rounded-xl border flex flex-col max-h-[calc(100vh-320px)] shadow-sm"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b bg-white rounded-t-xl" style={{ borderColor: 'var(--nfi-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${meta.bg} ${meta.border} border`} />
                        {meta.label}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {stage.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Prob: {meta.probability}%</span>
                      <span className="font-semibold text-slate-800">{formatInr(stage.totalValue)}</span>
                    </div>
                  </div>

                  {/* Column Cards Container */}
                  <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {stage.deals.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed rounded-lg text-slate-400 text-xs my-4" style={{ borderColor: 'var(--nfi-border)' }}>
                        No deals in this stage
                      </div>
                    ) : (
                      stage.deals.map((deal) => {
                        const tier = TIER_BADGES[deal.clientTier] || TIER_BADGES.PROSPECT;
                        const prio = PRIORITY_STYLES[deal.priority] || PRIORITY_STYLES.WARM;

                        return (
                          <div
                            key={deal.id}
                            className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            style={{ borderColor: 'var(--nfi-border)' }}
                            onClick={() => openDossier(deal)}
                          >
                            {/* Card Top: Community & Priority */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                                style={{ backgroundColor: tier.bg, color: tier.text, borderColor: tier.border }}
                              >
                                {tier.label}
                              </span>
                              <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: prio.bg, color: prio.text }}
                              >
                                {deal.priority}
                              </span>
                            </div>

                            {/* Client Name & Community */}
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                              {deal.clientName}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                              📍 {deal.community}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {deal.configuration}
                            </p>

                            {/* Deal Value */}
                            <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--nfi-border)' }}>
                              <span className="text-xs text-slate-500">Estimated Budget</span>
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatInr(deal.estimatedDealValue)}
                              </span>
                            </div>

                            {/* Consultant & Days in Stage */}
                            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                                  {deal.assignedRepName ? deal.assignedRepName.charAt(0) : 'D'}
                                </div>
                                <span className="truncate max-w-[100px] text-[11px] font-medium text-slate-700">
                                  {deal.assignedRepName || 'Unassigned'}
                                </span>
                              </div>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {deal.daysInStage}d in stage
                              </span>
                            </div>

                            {/* Card Footer: Quick Action Buttons */}
                            <div className="mt-3 pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--nfi-border)' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  launchWhatsAppConcierge(deal);
                                }}
                                className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                title="Open WhatsApp Concierge"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.033-.496-1.637-.688-2.684-2.355-2.766-2.464-.082-.109-.659-.877-.659-1.672 0-.796.417-1.188.566-1.348.149-.16.326-.2.435-.2.11 0 .218.001.313.006.101.006.236-.038.37.283.138.331.472 1.15.513 1.233.041.083.069.18.014.288-.055.109-.082.176-.164.271-.082.096-.173.214-.247.287-.083.082-.169.171-.073.336.096.165.426.702.914 1.136.629.56 1.159.733 1.325.815.166.083.263.069.361-.042.097-.111.417-.485.528-.651.111-.166.222-.138.375-.083.153.055.972.458 1.139.541.167.083.278.125.319.194.042.07.042.404-.102.809z"/>
                                </svg>
                                WhatsApp
                              </button>

                              {deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    advanceDealStage(deal);
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800 hover:bg-amber-100 hover:text-amber-900 transition-colors flex items-center gap-1"
                                >
                                  Advance →
                                </button>
                              )}
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
        </div>
      )}

      {/* ── TAB 2: CLIENT 360 DIRECTORY (TABLE VIEW) ──────────────────────── */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer & Community</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tier & Priority</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Budget</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Stage</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Design Consultant</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                      No matching clients found in directory.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const tier = TIER_BADGES[deal.clientTier] || TIER_BADGES.PROSPECT;
                    const stageMeta = STAGE_METADATA[deal.stage];
                    return (
                      <tr 
                        key={deal.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => openDossier(deal)}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">{deal.clientName}</p>
                          <p className="text-xs text-slate-600 font-medium">📍 {deal.community}</p>
                          <p className="text-[11px] text-slate-400">{deal.email} · {deal.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                              style={{ backgroundColor: tier.bg, color: tier.text, borderColor: tier.border }}
                            >
                              {tier.label}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Priority: <strong className="text-slate-700">{deal.priority}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-extrabold text-slate-900">{formatInr(deal.estimatedDealValue)}</span>
                          <p className="text-[11px] text-slate-500">{deal.configuration}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stageMeta.bg} ${stageMeta.text} ${stageMeta.border}`}>
                            {stageMeta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                              {deal.assignedRepName ? deal.assignedRepName.charAt(0) : 'U'}
                            </div>
                            <span className="text-xs font-medium text-slate-800">{deal.assignedRepName || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => launchWhatsAppConcierge(deal)}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                            >
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDealToReassign(deal);
                                setShowReassignModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                            >
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: SALES TEAM MANAGEMENT & QUOTA LEADERBOARD ───────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {salesTeam.map((rep, idx) => {
              const quotaPercent = Math.round((rep.achievedRevenue / rep.monthlyTarget) * 100);
              const capacityPercent = Math.round((rep.activeLeadsCount / rep.maxCapacity) * 100);
              return (
                <div 
                  key={rep.id} 
                  className="bg-white rounded-xl border p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {/* Rank badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Rank #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rep.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rep.status}
                    </span>
                  </div>

                  {/* Rep Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-400 font-bold text-lg flex items-center justify-center shadow">
                      {rep.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rep.name}</h4>
                      <p className="text-xs text-amber-800 font-semibold">{rep.specialization.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-500">{rep.phone}</p>
                    </div>
                  </div>

                  {/* Monthly Quota Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Monthly Quota</span>
                      <span className="text-slate-900 font-bold">{quotaPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, quotaPercent)}%`,
                          backgroundColor: quotaPercent >= 90 ? '#10B981' : quotaPercent >= 70 ? '#D97706' : '#3B82F6'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Achieved: {formatInr(rep.achievedRevenue)}</span>
                      <span>Target: {formatInr(rep.monthlyTarget)}</span>
                    </div>
                  </div>

                  {/* Active Lead Workload & Capacity */}
                  <div className="pt-3 border-t space-y-2 text-xs" style={{ borderColor: 'var(--nfi-border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Active Consultations:</span>
                      <span className="font-bold text-slate-800">{rep.activeLeadsCount} / {rep.maxCapacity} ({capacityPercent}%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Deals Won:</span>
                      <span className="font-bold text-emerald-700">{rep.wonDealsCount} Closed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Win Rate:</span>
                      <span className="font-bold text-slate-800">{rep.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: OMNICHANNEL ACTIVITY STREAM ─────────────────────────────── */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-xl border shadow-sm p-5 max-w-4xl" style={{ borderColor: 'var(--nfi-border)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Omnichannel Client Timeline & Interaction Audit
          </h3>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-amber-700 border-4 border-white shadow" />
                <div className="bg-slate-50 rounded-xl p-3.5 border flex-1" style={{ borderColor: 'var(--nfi-border)' }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {act.type}
                      </span>
                      {act.performedBy}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(act.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{act.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CUSTOMER 360° SLIDE-OVER DOSSIER ───────────────────────────────── */}
      {activeDossierDeal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setActiveDossierDeal(null)}
          />

          {/* Drawer Body */}
          <div 
            className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 animate-slide-in-right border-l"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                    {activeDossierDeal.customerCode}
                  </span>
                  <span className="text-xs font-semibold text-amber-200">
                    {activeDossierDeal.clientTier.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {activeDossierDeal.clientName}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  📍 {activeDossierDeal.community}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveDossierDeal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Action Concierge Bar */}
            <div className="p-4 bg-slate-50 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--nfi-border)' }}>
              <button
                type="button"
                onClick={() => launchWhatsAppConcierge(activeDossierDeal)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.033-.496-1.637-.688-2.684-2.355-2.766-2.464-.082-.109-.659-.877-.659-1.672 0-.796.417-1.188.566-1.348.149-.16.326-.2.435-.2.11 0 .218.001.313.006.101.006.236-.038.37.283.138.331.472 1.15.513 1.233.041.083.069.18.014.288-.055.109-.082.176-.164.271-.082.096-.173.214-.247.287-.083.082-.169.171-.073.336.096.165.426.702.914 1.136.629.56 1.159.733 1.325.815.166.083.263.069.361-.042.097-.111.417-.485.528-.651.111-.166.222-.138.375-.083.153.055.972.458 1.139.541.167.083.278.125.319.194.042.07.042.404-.102.809z"/>
                </svg>
                WhatsApp Concierge
              </button>

              <a
                href={`tel:${activeDossierDeal.phone}`}
                className="px-3 py-1.5 rounded-lg bg-white border text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                📞 Call Client
              </a>

              <button
                type="button"
                onClick={() => {
                  setDealToReassign(activeDossierDeal);
                  setShowReassignModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                👤 Reassign ({activeDossierDeal.assignedRepName || 'Unassigned'})
              </button>
            </div>

            {/* Direct Conversion Action Banner */}
            <div className="p-4 bg-amber-50 border-b flex items-center justify-between gap-3" style={{ borderColor: 'rgba(217,119,6,0.2)' }}>
              <div>
                <p className="text-xs font-bold text-amber-900">1-Click Conversion Actions</p>
                <p className="text-[11px] text-amber-700">Convert this CRM lead into an active project or manufacturing order.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => convertToDesignProject(activeDossierDeal)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800 shadow"
                >
                  + Convert to Design Project
                </button>
                <button
                  type="button"
                  onClick={() => convertToFurnitureOrder(activeDossierDeal)}
                  className="px-3 py-1.5 rounded-lg bg-white border text-amber-900 text-xs font-bold hover:bg-amber-100 shadow-sm"
                  style={{ borderColor: 'rgba(217,119,6,0.3)' }}
                >
                  + Bespoke Order
                </button>
              </div>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Client Details Card */}
              <div className="bg-slate-50 rounded-xl p-4 border space-y-3" style={{ borderColor: 'var(--nfi-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Commercial & Project Specs</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Estimated Deal Value</span>
                    <span className="text-base font-extrabold text-slate-900">{formatInr(activeDossierDeal.estimatedDealValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pipeline Stage</span>
                    <span className="font-bold text-slate-800">{STAGE_METADATA[activeDossierDeal.stage]?.label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Configuration</span>
                    <span className="font-semibold text-slate-700">{activeDossierDeal.configuration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assigned Consultant</span>
                    <span className="font-semibold text-amber-900">{activeDossierDeal.assignedRepName || 'Unassigned'}</span>
                  </div>
                </div>
                {activeDossierDeal.notes && (
                  <div className="pt-2 border-t text-xs text-slate-600 italic" style={{ borderColor: 'var(--nfi-border)' }}>
                    &ldquo;{activeDossierDeal.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Add Note / Activity Form */}
              <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: 'var(--nfi-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Record Consultation Activity Note</h4>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record phone discussion, WhatsApp outcome, or studio meeting notes..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border focus:outline-none focus:ring-1 transition-all"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
                <div className="flex justify-end mt-2">
                  <NfiButton variant="primary" size="sm" onClick={handleAddDossierNote} disabled={!newNoteText.trim()}>
                    Save Activity Note
                  </NfiButton>
                </div>
              </div>

              {/* Linked Projects & Orders */}
              {dossierData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Linked Design Projects & Deliverables</h4>
                  {dossierData.designProjects.map((proj) => (
                    <div key={proj.id} className="p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between text-xs" style={{ borderColor: 'var(--nfi-border)' }}>
                      <div>
                        <p className="font-bold text-slate-900">{proj.title}</p>
                        <p className="text-[11px] text-slate-500">ID: {proj.id} · Budget: {formatInr(proj.estimatedBudget)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        {proj.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity Stream */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Interaction History</h4>
                <div className="space-y-3">
                  {activities.filter((a) => a.leadId === activeDossierDeal.id).map((act) => (
                    <div key={act.id} className="p-3 bg-slate-50 rounded-xl border text-xs" style={{ borderColor: 'var(--nfi-border)' }}>
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800">{act.type} by {act.performedBy}</span>
                        <span className="text-[10px]">{formatDate(act.createdAt)}</span>
                      </div>
                      <p className="text-slate-700">{act.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REASSIGN SALES CONSULTANT ──────────────────────────────── */}
      {showReassignModal && dealToReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border" style={{ borderColor: 'var(--nfi-border)' }}>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reassign Lead: {dealToReassign.clientName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Balance consultant capacity or match with a dedicated luxury interior specialist.
            </p>

            {/* Automated Recommendation Card */}
            <div className="bg-amber-50 border rounded-xl p-4 mb-4" style={{ borderColor: 'rgba(217,119,6,0.25)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900">✨ Automated Capacity Recommendation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Best Match</span>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                Round-robin capacity algorithm assigns to the consultant with the fewest active consultations.
              </p>
              <button
                type="button"
                onClick={() => handleAssignRep(dealToReassign, 'AUTO')}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 text-amber-400 font-bold text-xs hover:bg-slate-800 shadow"
              >
                Apply Automated Assignment
              </button>
            </div>

            {/* Manual List of Consultants */}
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Manual Selection</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {salesTeam.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => handleAssignRep(dealToReassign, rep.id)}
                  className="w-full text-left p-3 rounded-xl border hover:bg-slate-50 transition-colors flex items-center justify-between"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rep.name}</p>
                    <p className="text-[11px] text-slate-500">{rep.specialization.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700">{rep.activeLeadsCount} active</span>
                    <p className="text-[10px] text-emerald-600 font-medium">{rep.conversionRate}% Win Rate</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <NfiButton variant="secondary" size="sm" onClick={() => setShowReassignModal(false)}>
                Cancel
              </NfiButton>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE NEW CLIENT INQUIRY ───────────────────────────────── */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border" style={{ borderColor: 'var(--nfi-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Register New Luxury Client Inquiry
              </h3>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className="w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bengaluru Property / Gated Community *</label>
                <input
                  type="text"
                  required
                  value={newClientCommunity}
                  onChange={(e) => setNewClientCommunity(e.target.value)}
                  placeholder="e.g. Prestige Lakeside Habitat, Whitefield"
                  className="w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Configuration</label>
                  <select
                    value={newClientConfig}
                    onChange={(e) => setNewClientConfig(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border bg-white focus:outline-none"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    <option value="4BHK Signature Villa (4,200 sq.ft)">4BHK Luxury Villa</option>
                    <option value="Penthouse Sky Suite (5,800 sq.ft)">Penthouse Sky Suite</option>
                    <option value="3BHK Luxury Residence (2,800 sq.ft)">3BHK Luxury Residence</option>
                    <option value="2BHK Bespoke Living (1,500 sq.ft)">2BHK Bespoke Living</option>
                    <option value="Bespoke Solid Wood Furniture">Standalone Furniture Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <select
                    value={newClientBudget}
                    onChange={(e) => setNewClientBudget(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border bg-white focus:outline-none"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    <option value="4200000">₹42,00,000 (VIP Ultra-Luxury)</option>
                    <option value="2500000">₹25,00,000 (Whole Villa)</option>
                    <option value="1850000">₹18,50,000 (3BHK Premium)</option>
                    <option value="1200000">₹12,00,000 (2BHK Premium)</option>
                    <option value="650000">₹6,50,000 (Bespoke Woodwork)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Consultant</label>
                <select
                  value={newClientRep}
                  onChange={(e) => setNewClientRep(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border bg-white focus:outline-none"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <option value="AUTO">✨ Automated Recommendation (Least Loaded)</option>
                  {salesTeam.map((rep) => (
                    <option key={rep.id} value={rep.id}>{rep.name} ({rep.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--nfi-border)' }}>
                <NfiButton variant="secondary" size="sm" type="button" onClick={() => setShowNewClientModal(false)}>
                  Cancel
                </NfiButton>
                <NfiButton variant="primary" size="sm" type="submit">
                  Register Client
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
