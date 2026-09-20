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
  CrmDealPriority,
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';
import { BoqBuilderModal } from '@/components/boq/boq-builder-modal';

// ---------------- Brand Styling & Utilities ----------------

const STAGE_METADATA: Record<
  PipelineStageId,
  { label: string; probability: number; border: string; bg: string; text: string }
> = {
  NEW_INQUIRY: {
    label: 'New Inquiry',
    probability: 10,
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  QUALIFIED: {
    label: 'Qualified & Discovery',
    probability: 30,
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
  },
  STUDIO_CONSULTATION: {
    label: 'Studio Consultation',
    probability: 50,
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
  },
  DESIGN_PROPOSAL_SENT: {
    label: 'Design Proposal Sent',
    probability: 75,
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
  NEGOTIATION: {
    label: 'Negotiation & Finishes',
    probability: 90,
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
  },
  CLOSED_WON: {
    label: 'Closed Won',
    probability: 100,
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
  },
  CLOSED_LOST: {
    label: 'Closed Lost',
    probability: 0,
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
  },
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

const TIER_BADGES: Record<ClientTier, { label: string; bg: string; text: string; border: string }> =
  {
    VIP_PLATINUM: {
      label: 'VIP Ultra-Luxury',
      bg: 'rgba(212,175,55,0.12)',
      text: '#9B7811',
      border: 'rgba(212,175,55,0.35)',
    },
    HIGH_NET_WORTH: {
      label: 'HNW Residential',
      bg: 'rgba(140,115,85,0.12)',
      text: '#6D5337',
      border: 'rgba(140,115,85,0.3)',
    },
    COMMERCIAL: {
      label: 'Commercial Partner',
      bg: 'rgba(21,101,192,0.08)',
      text: '#1565C0',
      border: 'rgba(21,101,192,0.25)',
    },
    RETAIL: {
      label: 'Retail Bespoke',
      bg: 'rgba(46,125,50,0.08)',
      text: '#2E7D32',
      border: 'rgba(46,125,50,0.25)',
    },
    PROSPECT: {
      label: 'Inquiry Prospect',
      bg: 'rgba(100,116,139,0.08)',
      text: '#475569',
      border: 'rgba(100,116,139,0.25)',
    },
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
    notes:
      'Floor plan review completed at Indiranagar experience studio. Client requested Italian marble accent in living suite and Burma teak dining credenza.',
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
    notes:
      'Walked through Whitefield experience studio. Interested in full bespoke rosewood library, walk-in closets, and custom acoustic wall paneling.',
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
    swatchKitOrder: {
      kitType: 'HARDWOOD_VENEERS',
      deliveryAddress: {
        line1: 'Tower 4, Apt 802, Total Environment In That Quiet Earth',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560049',
      },
      depositAmount: 49900,
      isDepositRefundable: true,
      dispatchStatus: 'DISPATCHED',
      courierTrackingNumber: 'BLR-EXP-98231',
    },
    assignedRepId: 'rep_2',
    assignedRepName: 'Arjun Mehta',
    daysInStage: 2,
    notes:
      'Floor plans received via storefront form. Seeking natural solid oak finishes and minimalist Scandinavian cabinetry.',
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
    notes:
      'Quotation revised with 10-year warranty teak veneer. Advance payment link generated via Razorpay.',
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
    notes:
      'Converted to active design project #DP-2026-088. Solid Nilambur teak dining and bedroom sets booked.',
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
    notes:
      'Fresh inquiry from storefront luxury concierge. Looking for turnkey interior architecture and imported brass joinery.',
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
    summary:
      'Client visited Indiranagar Design Studio. 3D renders of master bedroom & modular kitchen showcased.',
    performedBy: 'Priya Sharma',
    outcome: 'MEETING_COMPLETED',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'act_2',
    leadId: 'deal_1',
    type: 'WHATSAPP',
    summary:
      'Sent revised 3D quotation and finish swatches (Burma Teak & Champagne Brass) via WhatsApp.',
    performedBy: 'Priya Sharma',
    outcome: 'WHATSAPP_SENT',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act_3',
    leadId: 'deal_2',
    type: 'CALL',
    summary:
      'Detailed discovery call on custom rosewood library shelving and soundproof acoustic paneling.',
    performedBy: 'Vikram Patel',
    outcome: 'CONNECTED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'act_4',
    leadId: 'deal_4',
    type: 'NOTE',
    summary:
      'Client agreed to proceed with premium modular cabinetry package after 5% seasonal discount applied.',
    performedBy: 'Ananya Rao',
    outcome: 'CONNECTED',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export default function CRMDashboardPage() {
  // State variables
  const [activeTab, setActiveTab] = useState<
    'inbox' | 'pipeline' | 'directory' | 'team' | 'activities'
  >('pipeline');
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesRepresentative[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedDealId, setHighlightedDealId] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRepFilter, setSelectedRepFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<
    'all' | 'today' | 'unassigned' | 'high_value' | 'scheduled' | 'swatches'
  >('all');

  // Slide-Over Dossier state
  const [activeDossierDeal, setActiveDossierDeal] = useState<PipelineDeal | null>(null);
  const [dossierData, setDossierData] = useState<CustomerDossier | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Modals state
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [dealToReassign, setDealToReassign] = useState<PipelineDeal | null>(null);
  const [boqModalDeal, setBoqModalDeal] = useState<PipelineDeal | null>(null);

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
          const apiDeals = pipelineRes.data.flatMap((stage: PipelineStage) => stage.deals || []);
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

  // Periodic background polling (every 45s) for real-time inquiry arrival
  useEffect(() => {
    const timer = setInterval(() => {
      CrmService.getPipeline()
        .then((pipelineRes) => {
          if (pipelineRes.data && Array.isArray(pipelineRes.data)) {
            const apiDeals = pipelineRes.data.flatMap((stage: PipelineStage) => stage.deals || []);
            if (apiDeals.length > 0) {
              setDeals(apiDeals);
              if (typeof window !== 'undefined') {
                localStorage.setItem('nfi_crm_deals', JSON.stringify(apiDeals));
              }
            }
          }
        })
        .catch(() => {
          // silent background refresh
        });
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  // Direct Phone Call helper
  const launchPhoneCall = (deal: PipelineDeal) => {
    const cleanPhone = (deal.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;
    const phoneWithPlus = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    window.location.href = `tel:${phoneWithPlus}`;
  };

  // Swatch Kit Dispatch Status Update
  const handleUpdateSwatchStatus = (
    deal: PipelineDeal,
    newStatus: 'ORDERED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED',
  ) => {
    if (!deal.swatchKitOrder) return;

    const updatedSwatch = {
      ...deal.swatchKitOrder,
      dispatchStatus: newStatus,
    };

    const updatedDeals = deals.map((d) => {
      if (d.id === deal.id) {
        return {
          ...d,
          swatchKitOrder: updatedSwatch,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    setDeals(updatedDeals);
    if (activeDossierDeal && activeDossierDeal.id === deal.id) {
      setActiveDossierDeal({
        ...activeDossierDeal,
        swatchKitOrder: updatedSwatch,
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
    }

    const newAct: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'NOTE',
      summary: `Swatch Box dispatch status updated to "${newStatus}".`,
      performedBy: 'Logistics Operations',
      createdAt: new Date().toISOString(),
    };
    const updatedActivities = [newAct, ...activities];
    setActivities(updatedActivities);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActivities));
    }

    showToast(`Swatch kit status marked as ${newStatus}`);
  };

  // Human-readable elapsed time helper
  const getTimeAgo = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

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
    const targetAchievementRate =
      totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 1000) / 10 : 84.5;

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
      if (quickFilter === 'today') {
        const time = new Date(d.createdAt || d.updatedAt).getTime();
        if (Date.now() - time > 24 * 3600 * 1000) return false;
      } else if (quickFilter === 'unassigned') {
        if (d.assignedRepId && d.assignedRepId !== 'unassigned') return false;
      } else if (quickFilter === 'high_value') {
        if (d.estimatedDealValue < 150000000) return false;
      } else if (quickFilter === 'scheduled') {
        const hasBooking = !!d.consultationBooking || (d.notes && d.notes.includes('Scheduled:'));
        if (!hasBooking) return false;
      } else if (quickFilter === 'swatches') {
        const hasSwatch = !!d.swatchKitOrder || (d.notes && d.notes.includes('Swatch Kit:'));
        if (!hasSwatch) return false;
      }

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
  }, [deals, selectedRepFilter, selectedTierFilter, debouncedSearch, quickFilter]);

  // Dedicated Inquiries Dataset (NEW_INQUIRY stage, sorted newest first)
  const newInquiries = useMemo(() => {
    return deals
      .filter((d) => d.stage === 'NEW_INQUIRY')
      .sort((a, b) => {
        const tA = new Date(a.createdAt || a.updatedAt).getTime();
        const tB = new Date(b.createdAt || b.updatedAt).getTime();
        return tB - tA;
      });
  }, [deals]);

  const todayInquiriesCount = useMemo(() => {
    return newInquiries.filter(
      (d) => Date.now() - new Date(d.createdAt || d.updatedAt).getTime() < 24 * 3600 * 1000,
    ).length;
  }, [newInquiries]);

  const unassignedCount = useMemo(() => {
    return newInquiries.filter((d) => !d.assignedRepId || d.assignedRepId === 'unassigned').length;
  }, [newInquiries]);

  const scheduledCount = useMemo(() => {
    return deals.filter(
      (d) => !!d.consultationBooking || (d.notes && d.notes.includes('Scheduled:')),
    ).length;
  }, [deals]);

  const swatchesCount = useMemo(() => {
    return deals.filter((d) => !!d.swatchKitOrder || (d.notes && d.notes.includes('Swatch Kit:')))
      .length;
  }, [deals]);

  const latestInquiry = newInquiries.length > 0 ? newInquiries[0] : null;

  // Grouped Kanban Stages (Sorted newest deals first in each stage)
  const kanbanStages: PipelineStage[] = useMemo(() => {
    return STAGE_ORDER.map((stageId) => {
      const stageDeals = filteredDeals.filter((d) => d.stage === stageId);
      stageDeals.sort((a, b) => {
        const tA = new Date(a.createdAt || a.updatedAt).getTime();
        const tB = new Date(b.createdAt || b.updatedAt).getTime();
        return tB - tA;
      });
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
        },
      ],
      orders:
        deal.stage === 'CLOSED_WON'
          ? [
              {
                id: `ord_${deal.id}`,
                orderNumber: `NFI-2026-${(deal.customerCode || deal.id || 'ORDER').replace('NFI-C-', '')}`,
                status: 'IN_PRODUCTION',
                totalAmount: deal.estimatedDealValue,
                createdAt: deal.updatedAt,
              },
            ]
          : [],
    };

    setDossierData(mockDossier);
  };

  // 1-Click WhatsApp Concierge Launch
  const launchWhatsAppConcierge = (deal: PipelineDeal) => {
    const cleanPhone = (deal.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry =
      cleanPhone.length === 10
        ? `91${cleanPhone}`
        : cleanPhone.startsWith('91')
          ? cleanPhone
          : `91${cleanPhone}`;
    const repName = deal.assignedRepName || 'Design Consultant';

    let message = `Hello ${deal.clientName},\n\nThank you for consulting National Furniture & Interiors regarding your ${deal.configuration} at ${deal.community}.\n\nOur senior design lead, ${repName}, has prepared your bespoke woodwork concept proposal and 3D specifications. Would you like to review the renders this week?\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Experience Studios (Indiranagar · Whitefield · HSR Layout)`;

    if (deal.consultationBooking) {
      const b = deal.consultationBooking;
      const venueStr =
        b.studioLocation === 'VIRTUAL'
          ? 'Virtual 3D Video Call (Zoom / Google Meet)'
          : `${b.studioLocation || 'Indiranagar'} Experience Studio`;

      message = `Hello ${deal.clientName},\n\nYour design consultation at National Furniture & Interiors is confirmed for:\n🏛️ Location: ${venueStr}\n📅 Date: ${b.scheduledDate}\n⏰ Time Window: ${b.timeSlot}\n\nOur Senior Interior Architect, ${repName}, has reserved this slot exclusively for your ${deal.configuration} at ${deal.community} to walk through material finishes and 3D concept plans.\n\nLooking forward to welcoming you!\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Flagship: 100ft Rd, Indiranagar · Whitefield · HSR Layout`;
    } else if (deal.swatchKitOrder) {
      const s = deal.swatchKitOrder;
      const kitName = s.kitType ? s.kitType.replace(/_/g, ' ') : 'Curated Swatch Box';
      const trackingStr = s.courierTrackingNumber
        ? `\n📦 Courier Tracking AWB: ${s.courierTrackingNumber}`
        : '';
      const destStr = s.deliveryAddress
        ? `\n📍 Destination: ${s.deliveryAddress.line1 || ''}, ${s.deliveryAddress.city || ''} - ${s.deliveryAddress.pincode || ''}`
        : '';
      message = `Hello ${deal.clientName},\n\nYour National Furniture & Interiors Luxury Swatch Box has been prepared!\n\n📦 Collection: ${kitName}${destStr}\n🚚 Status: ${s.dispatchStatus || 'ORDERED'}${trackingStr}\n\nFeel free to touch and compare our authentic solid Burma teak, walnut veneers, and Italian upholstery fabrics under your home's natural lighting.\n\nOur Design Concierge, ${repName}, is available to answer any finishing queries.\n\nWarm regards,\nNational Furniture & Interiors Material Lab`;
    }

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

  // 1-Click Inline Rep Assignment
  const handleInlineAssignRep = async (dealId: string, repId: string) => {
    const assignedRep = salesTeam.find((r) => r.id === repId);
    if (!assignedRep) return;

    const updatedDeals = deals.map((d) => {
      if (d.id === dealId) {
        return {
          ...d,
          assignedRepId: assignedRep.id,
          assignedRepName: assignedRep.name,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    setDeals(updatedDeals);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
    }

    try {
      await CrmService.assignSalesRep(dealId, repId);
    } catch {
      // Offline resiliency
    }

    showToast(`Lead assigned to ${assignedRep.name}`);
  };

  // Deep linking: check URL search params for leadId, dealId, or id
  useEffect(() => {
    if (typeof window !== 'undefined' && deals.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('leadId') || params.get('dealId') || params.get('id');
      if (targetId) {
        const cleanTarget = targetId.trim().toLowerCase();
        const match = deals.find(
          (d) =>
            d.id === targetId ||
            d.customerId === targetId ||
            d.customerCode.toLowerCase() === cleanTarget ||
            (d.phone &&
              d.phone.replace(/[^0-9]/g, '').includes(cleanTarget.replace(/[^0-9]/g, ''))),
        );
        if (match) {
          setHighlightedDealId(match.id);
          openDossier(match);
        }
      }
    }
  }, [deals]);

  // 1-Click Conversion: Interior Design Project
  const convertToDesignProject = async (deal: PipelineDeal) => {
    await advanceDealStage(deal, 'CLOSED_WON');

    const conversionActivity: LeadActivity = {
      id: `act_${Date.now()}`,
      leadId: deal.id,
      type: 'NOTE',
      summary: `🎉 CONVERTED TO INTERIOR DESIGN PROJECT: Project #DP-2026-${(deal.customerCode || deal.id || '').replace('NFI-C-', '')} generated with budget ${formatInr(deal.estimatedDealValue)}.`,
      performedBy: deal.assignedRepName || 'Design Consultant',
      createdAt: new Date().toISOString(),
    };

    const updatedActs = [conversionActivity, ...activities];
    setActivities(updatedActs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nfi_crm_activities', JSON.stringify(updatedActs));
    }

    showToast(
      `Converted to Active Design Project #DP-2026-${(deal.customerCode || deal.id || '').replace('NFI-C-', '')}`,
    );
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
          className="animate-fade-in fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-xl"
          style={{ backgroundColor: 'var(--nfi-primary)' }}
        >
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
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
            <NfiButton variant="secondary" size="sm" onClick={loadCrmData} disabled={loading}>
              <svg
                className="mr-1.5 h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Data
            </NfiButton>
            <NfiButton variant="primary" size="sm" onClick={() => setShowNewClientModal(true)}>
              <svg
                className="mr-1.5 h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              + New Client Inquiry
            </NfiButton>
          </div>
        }
      />

      {/* ── Live Inquiries Action Banner ─────────────────────────────────── */}
      {newInquiries.length > 0 && (
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 p-4 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-3.5">
            <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-600"></span>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                  ⚡ High-Velocity Inquiries Stream
                </span>
                <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  {newInquiries.length} New Inquiries
                </span>
                {todayInquiriesCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    {todayInquiriesCount} Today
                  </span>
                )}
                {unassignedCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                    {unassignedCount} Unassigned
                  </span>
                )}
              </div>
              {latestInquiry && (
                <p className="mt-1 text-xs text-slate-700">
                  Latest: <strong className="text-slate-900">{latestInquiry.clientName}</strong> (
                  {latestInquiry.phone}) · 📍 {latestInquiry.community} ·{' '}
                  <span className="font-semibold text-amber-800">
                    {getTimeAgo(latestInquiry.createdAt || latestInquiry.updatedAt)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full flex-shrink-0 items-center gap-2.5 md:w-auto">
            <button
              onClick={() => setActiveTab('inbox')}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 md:flex-none"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Review Inquiries ({newInquiries.length})</span>
            </button>
            {latestInquiry && (
              <button
                type="button"
                onClick={() => launchWhatsAppConcierge(latestInquiry)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span>WhatsApp Latest</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Executive Sales Growth KPI Bar (5 Cards) ────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 0: Inquiries Stream Highlight */}
        <div
          onClick={() => setActiveTab('inbox')}
          className="cursor-pointer rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-900">
            <span>Inquiries Inbox</span>
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-amber-950">
            {newInquiries.length}{' '}
            <span className="text-xs font-semibold text-amber-700">Leads</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-bold text-emerald-700">{todayInquiriesCount} Today</span> ·{' '}
            {unassignedCount} Unassigned
          </p>
        </div>

        {/* KPI 1: Active Pipeline Value */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Active Pipeline Value</span>
            <span className="rounded-lg bg-amber-50 p-1.5 text-amber-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            {formatInr(kpis.totalPipelineValue)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Weighted:{' '}
            <span className="font-semibold text-slate-700">
              {formatInr(kpis.weightedPipelineValue)}
            </span>{' '}
            across {kpis.activeDealsCount} active deals
          </p>
        </div>

        {/* KPI 2: Sales Win Rate */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Win Rate</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-emerald-700">
            {kpis.winRate}%
          </div>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">↑ +4.2% MoM</span> ·{' '}
            {kpis.wonDealsCount} closed won projects
          </p>
        </div>

        {/* KPI 3: Deal Velocity */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Avg Deal Velocity</span>
            <span className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            {kpis.averageDealVelocityDays} Days
          </div>
          <p className="mt-1 text-xs text-slate-500">Inquiry to design contract signing</p>
        </div>

        {/* KPI 4: Average Client Value */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Avg Deal Size</span>
            <span className="rounded-lg bg-purple-50 p-1.5 text-purple-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            {formatInr(kpis.averageDealSize)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Quota Progress:{' '}
            <span className="font-semibold text-amber-700">{kpis.targetAchievementRate}%</span>
          </p>
        </div>
      </div>

      {/* ── Quick Filter Pills Bar ───────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-slate-500">Quick Filters:</span>
        <button
          onClick={() => setQuickFilter('all')}
          className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'all'
              ? 'bg-slate-900 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Deals ({deals.length})
        </button>
        <button
          onClick={() => setQuickFilter('today')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'today'
              ? 'bg-emerald-700 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <span>🔥 Today&apos;s Inquiries</span>
          <span className="py-0.2 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">
            {todayInquiriesCount}
          </span>
        </button>
        <button
          onClick={() => setQuickFilter('unassigned')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'unassigned'
              ? 'bg-rose-700 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700'
          }`}
        >
          <span>⚠️ Unassigned Leads</span>
          <span className="py-0.2 rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-800">
            {unassignedCount}
          </span>
        </button>
        <button
          onClick={() => setQuickFilter('high_value')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'high_value'
              ? 'bg-amber-700 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700'
          }`}
        >
          <span>💎 High-Value (₹15L+)</span>
        </button>
        <button
          onClick={() => setQuickFilter('scheduled')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'scheduled'
              ? 'bg-blue-700 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <span>📅 Consultations Booked</span>
          <span className="py-0.2 rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-800">
            {scheduledCount}
          </span>
        </button>
        <button
          onClick={() => setQuickFilter('swatches')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
            quickFilter === 'swatches'
              ? 'bg-amber-800 font-semibold text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <span>📦 Swatch Kits Ordered</span>
          <span className="py-0.2 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">
            {swatchesCount}
          </span>
        </button>
      </div>

      {/* ── Toolbar: Tabs & Search Controls ─────────────────────────────────── */}
      <div
        className="mb-6 flex flex-col justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'inbox'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-amber-50/80 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            ⚡ Inquiries Inbox
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'inbox' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {newInquiries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            Kanban Pipeline
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'pipeline' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              {filteredDeals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Client 360 Directory
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Sales Team & Quotas
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {salesTeam.length} Reps
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'activities'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Activity Stream
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, community, phone..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-xs transition-all focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--nfi-border)' }}
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Consultant Filter */}
          <select
            value={selectedRepFilter}
            onChange={(e) => setSelectedRepFilter(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <option value="all">All Consultants</option>
            {salesTeam.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name} ({rep.activeLeadsCount})
              </option>
            ))}
          </select>

          {/* Client Tier Filter */}
          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
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

      {/* ── TAB 0: FAST-RESPONSE INQUIRIES INBOX (TABLE VIEW) ──────────────── */}
      {activeTab === 'inbox' && (
        <div
          className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div
            className="flex flex-col justify-between gap-2 border-b bg-amber-50/50 p-4 sm:flex-row sm:items-center"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span>⚡ High-Velocity Inquiries Inbox</span>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  {newInquiries.length} Inquiries
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Fast-triage website and showroom inquiries. Direct 1-click WhatsApp and Phone
                outreach with assigned architects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Sorted by: <strong>Newest First</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Patron / Client</th>
                  <th className="px-5 py-3.5">Direct Contact</th>
                  <th className="px-5 py-3.5">Requirement & Location</th>
                  <th className="px-5 py-3.5">Received / SLA</th>
                  <th className="px-5 py-3.5">Assigned Consultant</th>
                  <th className="px-5 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white" style={{ borderColor: 'var(--nfi-border)' }}>
                {newInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                      No new inquiries in the inbox right now.
                    </td>
                  </tr>
                ) : (
                  newInquiries.map((inquiry) => {
                    const isToday =
                      Date.now() - new Date(inquiry.createdAt || inquiry.updatedAt).getTime() <
                      24 * 3600 * 1000;
                    const isHighlighted = highlightedDealId === inquiry.id;

                    return (
                      <tr
                        key={inquiry.id}
                        className={`transition-colors hover:bg-amber-50/30 ${
                          isHighlighted ? 'bg-amber-100/50 ring-1 ring-amber-400' : ''
                        }`}
                      >
                        {/* Patron & Code */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm">
                              {inquiry.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">
                                  {inquiry.clientName}
                                </span>
                                {isToday && (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">
                                {inquiry.customerCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Direct Contact (WhatsApp & Call) */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-slate-900">
                              📞 {inquiry.phone}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => launchWhatsAppConcierge(inquiry)}
                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                              >
                                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.033-.496-1.637-.688-2.684-2.355-2.766-2.464-.082-.109-.659-.877-.659-1.672 0-.796.417-1.188.566-1.348.149-.16.326-.2.435-.2.11 0 .218.001.313.006.101.006.236-.038.37.283.138.331.472 1.15.513 1.233.041.083.069.18.014.288-.055.109-.082.176-.164.271-.082.096-.173.214-.247.287-.083.082-.169.171-.073.336.096.165.426.702.914 1.136.629.56 1.159.733 1.325.815.166.083.263.069.361-.042.097-.111.417-.485.528-.651.111-.166.222-.138.375-.083.153.055.972.458 1.139.541.167.083.278.125.319.194.042.07.042.404-.102.809z" />
                                </svg>
                                WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => launchPhoneCall(inquiry)}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                              >
                                Call
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Requirement & Community */}
                        <td className="max-w-xs px-5 py-4">
                          <div className="text-xs font-semibold text-slate-900">
                            {inquiry.configuration}
                          </div>
                          <div className="line-clamp-1 text-[11px] text-slate-600">
                            📍 {inquiry.community}
                          </div>
                          {inquiry.consultationBooking ? (
                            <div className="shadow-2xs mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900">
                              <span>📅</span>
                              <span>
                                {inquiry.consultationBooking.studioLocation === 'VIRTUAL'
                                  ? 'Virtual Video Call'
                                  : `${inquiry.consultationBooking.studioLocation || 'Indiranagar'} Studio`}
                              </span>
                              <span className="text-amber-500">·</span>
                              <span>{inquiry.consultationBooking.scheduledDate}</span>
                              <span className="text-amber-500">@</span>
                              <span>{inquiry.consultationBooking.timeSlot}</span>
                            </div>
                          ) : inquiry.notes && inquiry.notes.includes('Scheduled:') ? (
                            <div className="shadow-2xs mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900">
                              <span>📅</span>
                              <span>
                                {inquiry.notes.split('Scheduled:')[1]?.replace(']', '') ||
                                  'Consultation Booked'}
                              </span>
                            </div>
                          ) : null}
                          {inquiry.swatchKitOrder ? (
                            <div className="shadow-2xs mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100/80 px-2 py-1 text-[11px] font-bold text-amber-950">
                              <span>📦</span>
                              <span>
                                {inquiry.swatchKitOrder.kitType
                                  ? inquiry.swatchKitOrder.kitType.replace(/_/g, ' ')
                                  : 'Sample Swatch Box'}
                              </span>
                              {inquiry.swatchKitOrder.deliveryAddress?.city && (
                                <>
                                  <span className="text-amber-600">·</span>
                                  <span>{inquiry.swatchKitOrder.deliveryAddress.city}</span>
                                </>
                              )}
                              {inquiry.swatchKitOrder.dispatchStatus && (
                                <span className="py-0.2 rounded bg-amber-200 px-1 text-[9px] font-extrabold uppercase text-amber-900">
                                  {inquiry.swatchKitOrder.dispatchStatus}
                                </span>
                              )}
                            </div>
                          ) : inquiry.notes && inquiry.notes.includes('Swatch Kit:') ? (
                            <div className="shadow-2xs mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100/80 px-2 py-1 text-[11px] font-bold text-amber-950">
                              <span>📦</span>
                              <span>
                                {inquiry.notes.split('Swatch Kit:')[1]?.replace(']', '') ||
                                  'Swatch Kit Order'}
                              </span>
                            </div>
                          ) : null}
                          {inquiry.notes && !inquiry.notes.includes('Scheduled:') && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] italic text-amber-800">
                              &ldquo;{inquiry.notes}&rdquo;
                            </p>
                          )}
                        </td>

                        {/* Time Received / SLA */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {getTimeAgo(inquiry.createdAt || inquiry.updatedAt)}
                            </span>
                          </div>
                          <span className="block text-[11px] text-slate-500">
                            {formatDate(
                              inquiry.createdAt ? String(inquiry.createdAt) : inquiry.updatedAt,
                            )}
                          </span>
                        </td>

                        {/* Assigned Consultant (Inline Dropdown) */}
                        <td className="px-5 py-4">
                          <select
                            value={inquiry.assignedRepId || 'unassigned'}
                            onChange={(e) => handleInlineAssignRep(inquiry.id, e.target.value)}
                            className="rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none"
                            style={{ borderColor: 'var(--nfi-border)' }}
                          >
                            <option value="unassigned">⚠️ Unassigned</option>
                            {salesTeam.map((rep) => (
                              <option key={rep.id} value={rep.id}>
                                {rep.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDossier(inquiry)}
                              className="rounded-lg border px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              style={{ borderColor: 'var(--nfi-border)' }}
                            >
                              Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => advanceDealStage(inquiry, 'QUALIFIED')}
                              className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                            >
                              Qualify →
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

      {/* ── TAB 1: VISUAL KANBAN PIPELINE BOARD ───────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-max gap-4">
            {kanbanStages.map((stage) => {
              const meta = STAGE_METADATA[stage.id];
              return (
                <div
                  key={stage.id}
                  className="flex max-h-[calc(100vh-320px)] w-80 flex-shrink-0 flex-col rounded-xl border bg-slate-50/80 shadow-sm"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {/* Column Header */}
                  <div
                    className="rounded-t-xl border-b bg-white p-3.5"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                        <span className={`h-2 w-2 rounded-full ${meta.bg} ${meta.border} border`} />
                        {meta.label}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        {stage.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Prob: {meta.probability}%</span>
                      <span className="font-semibold text-slate-800">
                        {formatInr(stage.totalValue)}
                      </span>
                    </div>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto p-3">
                    {stage.deals.length === 0 ? (
                      <div
                        className="my-4 rounded-lg border-2 border-dashed p-6 text-center text-xs text-slate-400"
                        style={{ borderColor: 'var(--nfi-border)' }}
                      >
                        No deals in this stage
                      </div>
                    ) : (
                      stage.deals.map((deal) => {
                        const tier = TIER_BADGES[deal.clientTier] || TIER_BADGES.PROSPECT;
                        const prio = PRIORITY_STYLES[deal.priority] || PRIORITY_STYLES.WARM;
                        const isNewToday =
                          deal.stage === 'NEW_INQUIRY' &&
                          Date.now() - new Date(deal.createdAt || deal.updatedAt).getTime() <
                            24 * 3600 * 1000;
                        const isHighlighted = highlightedDealId === deal.id;

                        return (
                          <div
                            key={deal.id}
                            className={`group cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                              isHighlighted ? 'animate-pulse shadow-md ring-2 ring-amber-500' : ''
                            }`}
                            style={{ borderColor: 'var(--nfi-border)' }}
                            onClick={() => openDossier(deal)}
                          >
                            {/* Card Top: Community & Priority */}
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: tier.bg,
                                    color: tier.text,
                                    borderColor: tier.border,
                                  }}
                                >
                                  {tier.label}
                                </span>
                                {isNewToday && (
                                  <span className="animate-pulse rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    ✨ NEW TODAY
                                  </span>
                                )}
                              </div>
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                                style={{ backgroundColor: prio.bg, color: prio.text }}
                              >
                                {deal.priority}
                              </span>
                            </div>

                            {/* Client Name & Community */}
                            <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-amber-800">
                              {deal.clientName}
                            </h4>
                            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-600">
                              📍 {deal.community}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {deal.configuration}
                            </p>
                            {deal.consultationBooking && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                <span>📅</span>
                                <span>
                                  {deal.consultationBooking.studioLocation === 'VIRTUAL'
                                    ? 'Virtual Call'
                                    : `${deal.consultationBooking.studioLocation || 'Studio'}`}
                                </span>
                                {deal.consultationBooking.scheduledDate && (
                                  <>
                                    <span>·</span>
                                    <span>{deal.consultationBooking.scheduledDate}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {deal.swatchKitOrder && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                <span>📦</span>
                                <span>
                                  {deal.swatchKitOrder.kitType === 'HARDWOOD_VENEERS'
                                    ? 'Hardwood Box'
                                    : deal.swatchKitOrder.kitType === 'FABRICS_LEATHER'
                                      ? 'Fabrics Box'
                                      : deal.swatchKitOrder.kitType === 'MODULAR_KITCHEN'
                                        ? 'Kitchen Box'
                                        : deal.swatchKitOrder.kitType
                                          ? deal.swatchKitOrder.kitType.replace(/_/g, ' ')
                                          : 'Swatch Box'}
                                </span>
                                {deal.swatchKitOrder.dispatchStatus && (
                                  <>
                                    <span>·</span>
                                    <span className="text-[9px] font-extrabold uppercase">
                                      {deal.swatchKitOrder.dispatchStatus}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Deal Value */}
                            <div
                              className="mt-3 flex items-center justify-between border-t pt-2.5"
                              style={{ borderColor: 'var(--nfi-border)' }}
                            >
                              <span className="text-xs text-slate-500">Estimated Budget</span>
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatInr(deal.estimatedDealValue)}
                              </span>
                            </div>

                            {/* Consultant & Days in Stage */}
                            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                                  {deal.assignedRepName ? deal.assignedRepName.charAt(0) : 'D'}
                                </div>
                                <span className="max-w-[100px] truncate text-[11px] font-medium text-slate-700">
                                  {deal.assignedRepName || 'Unassigned'}
                                </span>
                              </div>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                                {getTimeAgo(deal.createdAt || deal.updatedAt)}
                              </span>
                            </div>

                            {/* Card Footer: Quick Action Buttons */}
                            <div
                              className="mt-3 flex items-center justify-between gap-1.5 border-t pt-2"
                              style={{ borderColor: 'var(--nfi-border)' }}
                            >
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    launchWhatsAppConcierge(deal);
                                  }}
                                  className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                  title="Open WhatsApp Concierge"
                                >
                                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.033-.496-1.637-.688-2.684-2.355-2.766-2.464-.082-.109-.659-.877-.659-1.672 0-.796.417-1.188.566-1.348.149-.16.326-.2.435-.2.11 0 .218.001.313.006.101.006.236-.038.37.283.138.331.472 1.15.513 1.233.041.083.069.18.014.288-.055.109-.082.176-.164.271-.082.096-.173.214-.247.287-.083.082-.169.171-.073.336.096.165.426.702.914 1.136.629.56 1.159.733 1.325.815.166.083.263.069.361-.042.097-.111.417-.485.528-.651.111-.166.222-.138.375-.083.153.055.972.458 1.139.541.167.083.278.125.319.194.042.07.042.404-.102.809z" />
                                  </svg>
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    launchPhoneCall(deal);
                                  }}
                                  className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                  title="Call Patron"
                                >
                                  Call
                                </button>
                              </div>

                              {deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    advanceDealStage(deal);
                                  }}
                                  className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 transition-colors hover:bg-amber-100 hover:text-amber-900"
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
        <div
          className="overflow-hidden rounded-xl border bg-white shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer & Community
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tier & Priority
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estimated Budget
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pipeline Stage
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Design Consultant
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white" style={{ borderColor: 'var(--nfi-border)' }}>
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
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                        onClick={() => openDossier(deal)}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">{deal.clientName}</p>
                          <p className="text-xs font-medium text-slate-600">📍 {deal.community}</p>
                          <p className="text-[11px] text-slate-400">
                            {deal.email} · {deal.phone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: tier.bg,
                                color: tier.text,
                                borderColor: tier.border,
                              }}
                            >
                              {tier.label}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Priority: <strong className="text-slate-700">{deal.priority}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatInr(deal.estimatedDealValue)}
                          </span>
                          <p className="text-[11px] text-slate-500">{deal.configuration}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stageMeta.bg} ${stageMeta.text} ${stageMeta.border}`}
                          >
                            {stageMeta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                              {deal.assignedRepName ? deal.assignedRepName.charAt(0) : 'U'}
                            </div>
                            <span className="text-xs font-medium text-slate-800">
                              {deal.assignedRepName || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => launchWhatsAppConcierge(deal)}
                              className="flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDealToReassign(deal);
                                setShowReassignModal(true);
                              }}
                              className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {salesTeam.map((rep, idx) => {
              const quotaPercent = Math.round((rep.achievedRevenue / rep.monthlyTarget) * 100);
              const capacityPercent = Math.round((rep.activeLeadsCount / rep.maxCapacity) * 100);
              return (
                <div
                  key={rep.id}
                  className="relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-5 shadow-sm"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  {/* Rank badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      Rank #{idx + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        rep.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  {/* Rep Info */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-amber-400 shadow">
                      {rep.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rep.name}</h4>
                      <p className="text-xs font-semibold text-amber-800">
                        {(rep.specialization || 'CONSULTANT').replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500">{rep.phone}</p>
                    </div>
                  </div>

                  {/* Monthly Quota Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Monthly Quota</span>
                      <span className="font-bold text-slate-900">{quotaPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, quotaPercent)}%`,
                          backgroundColor:
                            quotaPercent >= 90
                              ? '#10B981'
                              : quotaPercent >= 70
                                ? '#D97706'
                                : '#3B82F6',
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Achieved: {formatInr(rep.achievedRevenue)}</span>
                      <span>Target: {formatInr(rep.monthlyTarget)}</span>
                    </div>
                  </div>

                  {/* Active Lead Workload & Capacity */}
                  <div
                    className="space-y-2 border-t pt-3 text-xs"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Active Consultations:</span>
                      <span className="font-bold text-slate-800">
                        {rep.activeLeadsCount} / {rep.maxCapacity} ({capacityPercent}%)
                      </span>
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
        <div
          className="max-w-4xl rounded-xl border bg-white p-5 shadow-sm"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
            <svg
              className="h-4 w-4 text-amber-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Omnichannel Client Timeline & Interaction Audit
          </h3>

          <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border-4 border-white bg-amber-700 shadow" />
                <div
                  className="flex-1 rounded-xl border bg-slate-50 p-3.5"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {act.type}
                      </span>
                      {act.performedBy}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(act.createdAt)}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">{act.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CUSTOMER 360° SLIDE-OVER DOSSIER ───────────────────────────────── */}
      {activeDossierDeal && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="animate-fade-in fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDossierDeal(null)}
          />

          {/* Drawer Body */}
          <div
            className="animate-slide-in-right relative z-10 flex h-full w-full max-w-xl flex-col border-l bg-white shadow-2xl"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b bg-slate-900 p-6 text-white">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                    {activeDossierDeal.customerCode}
                  </span>
                  <span className="text-xs font-semibold text-amber-200">
                    {(activeDossierDeal.clientTier || 'PROSPECT').replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {activeDossierDeal.clientName}
                </h2>
                <p className="mt-1 text-xs text-slate-300">📍 {activeDossierDeal.community}</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveDossierDeal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Quick Action Concierge Bar */}
            <div
              className="flex flex-wrap items-center gap-2 border-b bg-slate-50 p-4"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              <button
                type="button"
                onClick={() => launchWhatsAppConcierge(activeDossierDeal)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.033-.496-1.637-.688-2.684-2.355-2.766-2.464-.082-.109-.659-.877-.659-1.672 0-.796.417-1.188.566-1.348.149-.16.326-.2.435-.2.11 0 .218.001.313.006.101.006.236-.038.37.283.138.331.472 1.15.513 1.233.041.083.069.18.014.288-.055.109-.082.176-.164.271-.082.096-.173.214-.247.287-.083.082-.169.171-.073.336.096.165.426.702.914 1.136.629.56 1.159.733 1.325.815.166.083.263.069.361-.042.097-.111.417-.485.528-.651.111-.166.222-.138.375-.083.153.055.972.458 1.139.541.167.083.278.125.319.194.042.07.042.404-.102.809z" />
                </svg>
                WhatsApp Concierge
              </button>

              <a
                href={`tel:${activeDossierDeal.phone}`}
                className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
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
                className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                👤 Reassign ({activeDossierDeal.assignedRepName || 'Unassigned'})
              </button>
            </div>

            {/* Direct Conversion Action Banner */}
            <div
              className="flex items-center justify-between gap-3 border-b bg-amber-50 p-4"
              style={{ borderColor: 'rgba(217,119,6,0.2)' }}
            >
              <div>
                <p className="text-xs font-bold text-amber-900">1-Click Conversion Actions</p>
                <p className="text-[11px] text-amber-700">
                  Convert this CRM lead into an active project or manufacturing order.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoqModalDeal(activeDossierDeal)}
                  className="shadow-xs rounded-lg border border-amber-500 bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  📄 Build Luxury BOQ
                </button>
                <button
                  type="button"
                  onClick={() => convertToDesignProject(activeDossierDeal)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-400 shadow hover:bg-slate-800"
                >
                  + Convert to Design Project
                </button>
                <button
                  type="button"
                  onClick={() => convertToFurnitureOrder(activeDossierDeal)}
                  className="rounded-lg border bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm hover:bg-amber-100"
                  style={{ borderColor: 'rgba(217,119,6,0.3)' }}
                >
                  + Bespoke Order
                </button>
              </div>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Reserved Consultation Card */}
              {activeDossierDeal.consultationBooking && (
                <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-950">
                      <span>📅</span>
                      <span>Reserved Design Consultation</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      CONFIRMED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] text-slate-500">Location / Mode</span>
                      <span className="font-bold text-slate-900">
                        {activeDossierDeal.consultationBooking.studioLocation === 'VIRTUAL'
                          ? 'Virtual 3D Video Call (Zoom)'
                          : `${activeDossierDeal.consultationBooking.studioLocation || 'Indiranagar'} Experience Studio`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        Scheduled Date &amp; Slot
                      </span>
                      <span className="font-bold text-emerald-800">
                        {activeDossierDeal.consultationBooking.scheduledDate} (
                        {activeDossierDeal.consultationBooking.timeSlot})
                      </span>
                    </div>
                  </div>
                  {activeDossierDeal.consultationBooking.meetingNotes && (
                    <p className="mt-1 border-t border-amber-200/60 pt-1.5 text-[11px] italic text-amber-900">
                      Patron Note: &ldquo;{activeDossierDeal.consultationBooking.meetingNotes}
                      &rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Swatch Kit Order Card */}
              {activeDossierDeal.swatchKitOrder && (
                <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-950">
                      <span>📦</span>
                      <span>Luxury Material Swatch Box</span>
                    </div>
                    {activeDossierDeal.swatchKitOrder.dispatchStatus && (
                      <span className="rounded-full border border-amber-300 bg-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                        {activeDossierDeal.swatchKitOrder.dispatchStatus}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] text-slate-500">Curated Box</span>
                      <span className="font-bold text-slate-900">
                        {activeDossierDeal.swatchKitOrder.kitType
                          ? activeDossierDeal.swatchKitOrder.kitType.replace(/_/g, ' ')
                          : 'Sample Swatch Box'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Advance Token</span>
                      <span className="font-bold text-emerald-800">
                        ₹
                        {Math.round(
                          (activeDossierDeal.swatchKitOrder.depositAmount || 49900) / 100,
                        )}{' '}
                        (100% Refundable)
                      </span>
                    </div>
                    {activeDossierDeal.swatchKitOrder.deliveryAddress && (
                      <div className="col-span-2">
                        <span className="block text-[11px] text-slate-500">Doorstep Address</span>
                        <span className="font-medium text-slate-800">
                          {activeDossierDeal.swatchKitOrder.deliveryAddress.line1 || ''}
                          {activeDossierDeal.swatchKitOrder.deliveryAddress.line2
                            ? `, ${activeDossierDeal.swatchKitOrder.deliveryAddress.line2}`
                            : ''}
                          {activeDossierDeal.swatchKitOrder.deliveryAddress.city
                            ? `, ${activeDossierDeal.swatchKitOrder.deliveryAddress.city}`
                            : ''}
                          {activeDossierDeal.swatchKitOrder.deliveryAddress.state
                            ? `, ${activeDossierDeal.swatchKitOrder.deliveryAddress.state}`
                            : ''}
                          {activeDossierDeal.swatchKitOrder.deliveryAddress.pincode
                            ? ` - ${activeDossierDeal.swatchKitOrder.deliveryAddress.pincode}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dispatch Status Fast Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/80 pt-2">
                    <span className="text-[11px] font-bold text-slate-600">
                      Update Courier Status:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['ORDERED', 'PACKED', 'DISPATCHED', 'DELIVERED'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateSwatchStatus(activeDossierDeal, st)}
                          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
                            activeDossierDeal.swatchKitOrder?.dispatchStatus === st
                              ? 'shadow-xs bg-amber-900 text-white'
                              : 'border border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Client Details Card */}
              <div
                className="space-y-3 rounded-xl border bg-slate-50 p-4"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Commercial & Project Specs
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-400">Estimated Deal Value</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatInr(activeDossierDeal.estimatedDealValue)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Pipeline Stage</span>
                    <span className="font-bold text-slate-800">
                      {STAGE_METADATA[activeDossierDeal.stage]?.label}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Configuration</span>
                    <span className="font-semibold text-slate-700">
                      {activeDossierDeal.configuration}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Assigned Consultant</span>
                    <span className="font-semibold text-amber-900">
                      {activeDossierDeal.assignedRepName || 'Unassigned'}
                    </span>
                  </div>
                </div>
                {activeDossierDeal.notes && (
                  <div
                    className="border-t pt-2 text-xs italic text-slate-600"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    &ldquo;{activeDossierDeal.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Add Note / Activity Form */}
              <div
                className="rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Record Consultation Activity Note
                </h4>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record phone discussion, WhatsApp outcome, or studio meeting notes..."
                  rows={3}
                  className="w-full rounded-lg border p-3 text-xs transition-all focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
                <div className="mt-2 flex justify-end">
                  <NfiButton
                    variant="primary"
                    size="sm"
                    onClick={handleAddDossierNote}
                    disabled={!newNoteText.trim()}
                  >
                    Save Activity Note
                  </NfiButton>
                </div>
              </div>

              {/* Linked Projects & Orders */}
              {dossierData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Linked Design Projects & Deliverables
                  </h4>
                  {dossierData.designProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between rounded-xl border bg-slate-50 p-3.5 text-xs"
                      style={{ borderColor: 'var(--nfi-border)' }}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{proj.title}</p>
                        <p className="text-[11px] text-slate-500">
                          ID: {proj.id} · Budget: {formatInr(proj.estimatedBudget)}
                        </p>
                      </div>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {(proj.stage || 'ACTIVE').replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity Stream */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer Interaction History
                </h4>
                <div className="space-y-3">
                  {activities
                    .filter((a) => a.leadId === activeDossierDeal.id)
                    .map((act) => (
                      <div
                        key={act.id}
                        className="rounded-xl border bg-slate-50 p-3 text-xs"
                        style={{ borderColor: 'var(--nfi-border)' }}
                      >
                        <div className="mb-1 flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-800">
                            {act.type} by {act.performedBy}
                          </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <h3 className="mb-1 text-base font-bold text-slate-900">
              Reassign Lead: {dealToReassign.clientName}
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              Balance consultant capacity or match with a dedicated luxury interior specialist.
            </p>

            {/* Automated Recommendation Card */}
            <div
              className="mb-4 rounded-xl border bg-amber-50 p-4"
              style={{ borderColor: 'rgba(217,119,6,0.25)' }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  ✨ Automated Capacity Recommendation
                </span>
                <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  Best Match
                </span>
              </div>
              <p className="mb-3 text-xs text-amber-800">
                Round-robin capacity algorithm assigns to the consultant with the fewest active
                consultations.
              </p>
              <button
                type="button"
                onClick={() => handleAssignRep(dealToReassign, 'AUTO')}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-amber-400 shadow hover:bg-slate-800"
              >
                Apply Automated Assignment
              </button>
            </div>

            {/* Manual List of Consultants */}
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Manual Selection
            </h4>
            <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
              {salesTeam.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => handleAssignRep(dealToReassign, rep.id)}
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:bg-slate-50"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rep.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(rep.specialization || 'CONSULTANT').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700">
                      {rep.activeLeadsCount} active
                    </span>
                    <p className="text-[10px] font-medium text-emerald-600">
                      {rep.conversionRate}% Win Rate
                    </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl"
            style={{ borderColor: 'var(--nfi-border)' }}
          >
            <div className="mb-4 flex items-center justify-between">
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
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className="w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Phone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Bengaluru Property / Gated Community *
                </label>
                <input
                  type="text"
                  required
                  value={newClientCommunity}
                  onChange={(e) => setNewClientCommunity(e.target.value)}
                  placeholder="e.g. Prestige Lakeside Habitat, Whitefield"
                  className="w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--nfi-border)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Configuration
                  </label>
                  <select
                    value={newClientConfig}
                    onChange={(e) => setNewClientConfig(e.target.value)}
                    className="w-full rounded-lg border bg-white p-2.5 text-xs focus:outline-none"
                    style={{ borderColor: 'var(--nfi-border)' }}
                  >
                    <option value="4BHK Signature Villa (4,200 sq.ft)">4BHK Luxury Villa</option>
                    <option value="Penthouse Sky Suite (5,800 sq.ft)">Penthouse Sky Suite</option>
                    <option value="3BHK Luxury Residence (2,800 sq.ft)">
                      3BHK Luxury Residence
                    </option>
                    <option value="2BHK Bespoke Living (1,500 sq.ft)">2BHK Bespoke Living</option>
                    <option value="Bespoke Solid Wood Furniture">Standalone Furniture Suite</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Estimated Budget (₹)
                  </label>
                  <select
                    value={newClientBudget}
                    onChange={(e) => setNewClientBudget(e.target.value)}
                    className="w-full rounded-lg border bg-white p-2.5 text-xs focus:outline-none"
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
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Assigned Consultant
                </label>
                <select
                  value={newClientRep}
                  onChange={(e) => setNewClientRep(e.target.value)}
                  className="w-full rounded-lg border bg-white p-2.5 text-xs focus:outline-none"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <option value="AUTO">✨ Automated Recommendation (Least Loaded)</option>
                  {salesTeam.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex items-center justify-end gap-3 border-t pt-3"
                style={{ borderColor: 'var(--nfi-border)' }}
              >
                <NfiButton
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                >
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

      {/* BOQ & Multi-Stage Quotation PDF Builder Modal */}
      {boqModalDeal && (
        <BoqBuilderModal
          isOpen={!!boqModalDeal}
          onClose={() => setBoqModalDeal(null)}
          projectContext={{
            id: boqModalDeal.id,
            projectCode: `DP-${boqModalDeal.id.slice(-6).toUpperCase()}`,
            clientName: boqModalDeal.clientName,
            clientPhone: boqModalDeal.phone,
            clientEmail: boqModalDeal.email,
            propertyAddress: `${boqModalDeal.community}, Bengaluru`,
            areaSqft: 2400,
            configuration: boqModalDeal.configuration,
            existingQuotationsCount: 0,
            expectedVersion: 1,
          }}
          onSaveQuotation={async (payload) => {
            const updatedDeals = deals.map((d) => {
              if (d.id === boqModalDeal.id) {
                return {
                  ...d,
                  stage: 'DESIGN_PROPOSAL_SENT' as const,
                  estimatedDealValue: payload.financialBreakdown.grandTotal,
                  updatedAt: new Date().toISOString(),
                };
              }
              return d;
            });
            setDeals(updatedDeals);
            if (activeDossierDeal && activeDossierDeal.id === boqModalDeal.id) {
              setActiveDossierDeal({
                ...activeDossierDeal,
                stage: 'DESIGN_PROPOSAL_SENT',
                estimatedDealValue: payload.financialBreakdown.grandTotal,
              });
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('nfi_crm_deals', JSON.stringify(updatedDeals));
            }

            const newAct: LeadActivity = {
              id: `act_${Date.now()}`,
              leadId: boqModalDeal.id,
              activityType: 'STATUS_CHANGE',
              type: 'DESIGN_PROPOSAL_SENT',
              summary: `Generated Architectural BOQ Quotation (v1.0) of ${formatInr(payload.financialBreakdown.grandTotal)} with Century BWP 710 & Blum hardware.`,
              performedBy: 'Lead Architect',
              createdAt: new Date().toISOString(),
            };
            setActivities([newAct, ...activities]);
            setBoqModalDeal(null);
          }}
        />
      )}
    </div>
  );
}
