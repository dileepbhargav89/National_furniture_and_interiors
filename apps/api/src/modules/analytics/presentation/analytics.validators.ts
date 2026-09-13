import { z } from 'zod';

export const analyticsDateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timeRange: z.enum(['7d', '30d', 'quarter', 'year', 'all']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  );

export type AnalyticsDateRangeQuery = z.infer<typeof analyticsDateRangeSchema>;
