import { Request, Response, NextFunction } from 'express';
import { AnalyticsUseCases } from '../application/analytics.use-cases';
import { analyticsDateRangeSchema } from './analytics.validators';

export class AnalyticsAdminController {
  constructor(private readonly useCases: AnalyticsUseCases) {}

  private setCacheHeaders(res: Response): void {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
  }

  getLeadsFunnel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getLeadsFunnel(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getDesignFunnel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getDesignFunnel(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getSalesMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getSalesMetrics(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getDashboardSummary(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getExecutiveKPIs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getExecutiveKPIs(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getRevenueTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = analyticsDateRangeSchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, error: 'Invalid date range' });
        return;
      }
      const data = await this.useCases.getRevenueTrends(queryResult.data);
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getCustomerCohorts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.useCases.getCustomerCohorts();
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };

  getCategoryPerformance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.useCases.getCategoryPerformance();
      this.setCacheHeaders(res);
      res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      next(error);
    }
  };
}
