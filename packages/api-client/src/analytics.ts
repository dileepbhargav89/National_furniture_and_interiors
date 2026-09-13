import { apiClient } from './client';

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface FunnelData {
  totalLeads: number;
  stages: FunnelStage[];
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDate?: {
    date: string;
    revenue: number;
    orders: number;
  }[] | undefined;
}

export interface DashboardSummary {
  newLeads: number;
  activeDesignProjects: number;
  revenueMTD: number;
  recentOrdersCount: number;
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

export interface AnalyticsQueryOptions {
  timeRange?: '7d' | '30d' | 'quarter' | 'year' | 'all' | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export const AnalyticsService = {
  getLeadsFunnel: (params?: AnalyticsQueryOptions) =>
    apiClient.get<FunnelData>('/api/v1/admin/analytics/leads-funnel', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getDesignFunnel: (params?: AnalyticsQueryOptions) =>
    apiClient.get<FunnelData>('/api/v1/admin/analytics/design-funnel', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getSalesMetrics: (params?: AnalyticsQueryOptions) =>
    apiClient.get<SalesMetrics>('/api/v1/admin/analytics/sales', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getDashboardSummary: (params?: AnalyticsQueryOptions) =>
    apiClient.get<DashboardSummary>('/api/v1/admin/analytics/dashboard-summary', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getExecutiveKPIs: (params?: AnalyticsQueryOptions) =>
    apiClient.get<ExecutiveDashboardKPIs>('/api/v1/admin/analytics/executive-kpis', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getRevenueTrends: (params?: AnalyticsQueryOptions) =>
    apiClient.get<RevenueTimeseriesPoint[]>('/api/v1/admin/analytics/revenue-trends', {
      ...(params ? { params: params as Record<string, string | number | boolean | undefined | null> } : {}),
    }),

  getCustomerCohorts: () =>
    apiClient.get<CustomerCohortMetrics>('/api/v1/admin/analytics/customer-cohorts'),

  getCategoryPerformance: () =>
    apiClient.get<CategoryPerformanceItem[]>('/api/v1/admin/analytics/category-performance'),
};
