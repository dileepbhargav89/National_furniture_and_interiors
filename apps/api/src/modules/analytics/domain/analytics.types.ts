export interface LeadsFunnelData {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export interface DesignFunnelData {
  totalProjects: number;
  inConsultation: number;
  quotationSent: number;
  inProgress: number;
  completed: number;
}

export interface SalesMetricsData {
  totalRevenue: number; // in paise
  totalOrders: number;
  averageOrderValue: number; // in paise
}

export interface DashboardSummaryData {
  leadsFunnel: LeadsFunnelData;
  designFunnel: DesignFunnelData;
  salesMetrics: SalesMetricsData;
  updatedAt: string;
}

export interface ExecutiveDashboardKPIs {
  revenueMTD: number; // in paise
  revenueYTD: number; // in paise
  growthRateMoM: number; // percentage e.g. 18.4
  activePipelineValue: number; // in paise
  weightedPipelineValue: number; // in paise
  averageOrderValue: number; // in paise
  customerLifetimeValue: number; // in paise
  totalCompletedOrders: number;
  vipPatronRetentionRate: number; // percentage e.g. 84.2
  whiteGloveSlaRate: number; // percentage e.g. 98.6
  pendingApprovalsCount: number;
  unassignedLeadsCount: number;
  productionQueueCount: number;
}

export interface RevenueTimeseriesPoint {
  date: string; // 'YYYY-MM-DD'
  label: string; // 'Sep 01'
  onlineOrdersRevenue: number; // in paise
  designProjectsRevenue: number; // in paise
  totalRevenue: number; // in paise
  orderCount: number;
}

export interface CustomerTierCount {
  tier: string;
  label: string;
  count: number;
  revenueContribution: number; // in paise
  percentage: number;
}

export interface TopPatronSummary {
  id: string;
  name: string;
  community?: string | undefined;
  tier: string;
  totalSpent: number; // in paise
  orderCount: number;
  activeProjectCount: number;
  lastActive: string;
}

export interface CustomerCohortMetrics {
  totalCustomers: number;
  repeatPurchaseRate: number; // e.g. 38.5
  tiers: CustomerTierCount[];
  topPatrons: TopPatronSummary[];
}

export interface CategoryPerformanceItem {
  categoryId: string;
  categoryName: string;
  totalRevenue: number; // in paise
  unitsSold: number;
  sharePercentage: number;
  grossMarginPercent: number;
}

export interface AnalyticsDateRange {
  startDate?: string | undefined;
  endDate?: string | undefined;
  timeRange?: '7d' | '30d' | 'quarter' | 'year' | 'all' | undefined;
}

export interface AnalyticsPort {
  getLeadsFunnel(range: AnalyticsDateRange): Promise<LeadsFunnelData>;
  getDesignFunnel(range: AnalyticsDateRange): Promise<DesignFunnelData>;
  getSalesMetrics(range: AnalyticsDateRange): Promise<SalesMetricsData>;
  getDashboardSummary(range: AnalyticsDateRange): Promise<DashboardSummaryData>;
  getExecutiveKPIs(range: AnalyticsDateRange): Promise<ExecutiveDashboardKPIs>;
  getRevenueTrends(range: AnalyticsDateRange): Promise<RevenueTimeseriesPoint[]>;
  getCustomerCohorts(): Promise<CustomerCohortMetrics>;
  getCategoryPerformance(): Promise<CategoryPerformanceItem[]>;
}
