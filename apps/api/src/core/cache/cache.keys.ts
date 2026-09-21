import type { AnalyticsDateRange } from '../../modules/analytics/domain/analytics.types';

export const CACHE_KEYS = {
  analytics: {
    leadsFunnel: (range?: AnalyticsDateRange) => {
      const start = range?.startDate || range?.timeRange || 'all';
      const end = range?.endDate || 'all';
      return `analytics:v1:leads-funnel:${start}:${end}`;
    },
    designFunnel: (range?: AnalyticsDateRange) => {
      const start = range?.startDate || range?.timeRange || 'all';
      const end = range?.endDate || 'all';
      return `analytics:v1:design-funnel:${start}:${end}`;
    },
    salesMetrics: (range?: AnalyticsDateRange) => {
      const start = range?.startDate || range?.timeRange || 'all';
      const end = range?.endDate || 'all';
      return `analytics:v1:sales:${start}:${end}`;
    },
    executiveKpis: (range?: AnalyticsDateRange) => {
      const start = range?.startDate || range?.timeRange || 'all';
      const end = range?.endDate || 'all';
      return `analytics:v1:executive-kpis:${start}:${end}`;
    },
    revenueTrends: (range?: AnalyticsDateRange) => {
      const start = range?.startDate || range?.timeRange || 'all';
      const end = range?.endDate || 'all';
      return `analytics:v1:revenue-trends:${start}:${end}`;
    },
    cohorts: () => `analytics:v1:customer-cohorts`,
    categoryPerf: () => `analytics:v1:category-perf`,
  },
  catalog: {
    productList: (page: number, filters: string) => `catalog:v1:list:${page}:${filters}`,
    productDetail: (idOrSlug: string) => `catalog:v1:product:${idOrSlug}`,
    categoryDetail: (idOrSlug: string) => `catalog:v1:category:${idOrSlug}`,
    categoryList: (isActive?: boolean) => `catalog:v1:categories:${isActive ?? 'all'}`,
    categoryTree: () => `catalog:v1:categories`,
    collectionDetail: (idOrSlug: string) => `catalog:v1:collection:${idOrSlug}`,
    collectionList: (status?: string, featured?: boolean) =>
      `catalog:v1:collections:${status ?? 'all'}:${featured ?? 'all'}`,
  },
  cart: {
    session: (sessionId: string) => `cart:v1:session:${sessionId}`,
  },
  auth: {
    tokenDenyList: (jti: string) => `auth:v1:deny:${jti}`,
  },
} as const;

export const CACHE_TTL = {
  ANALYTICS_KPI: 5 * 60, // 5 minutes
  CATALOG_LIST: 10 * 60, // 10 minutes
  CATALOG_DETAIL: 30 * 60, // 30 minutes
  CART_SESSION: 24 * 3600, // 24 hours
  REVIEWS_AGGREGATE: 15 * 60, // 15 minutes
  JWT_DENY_LIST: 15 * 60, // matches JWT_ACCESS_TTL
  CONSULTANT_SLOTS: 5 * 60, // 5 minutes
} as const;
