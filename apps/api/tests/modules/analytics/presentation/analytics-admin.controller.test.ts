import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsAdminController } from '../../../../src/modules/analytics/presentation/analytics-admin.controller';
import { AnalyticsUseCases } from '../../../../src/modules/analytics/application/analytics.use-cases';
import { Request, Response } from 'express';

  describe('AnalyticsAdminController', () => {
  let controller: AnalyticsAdminController;
  let mockUseCases: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;
  let mockNext: any;

  beforeEach(() => {
    mockUseCases = {
      getDashboardSummary: vi.fn().mockResolvedValue({ total: 1 }),
      getLeadsFunnel: vi.fn().mockResolvedValue({ leads: 2 }),
      getDesignFunnel: vi.fn().mockResolvedValue({ designs: 3 }),
      getSalesMetrics: vi.fn().mockResolvedValue({ sales: 4 }),
    };

    controller = new AnalyticsAdminController(mockUseCases as any);

    mockJson = vi.fn();
    mockNext = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      query: {},
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
      setHeader: vi.fn(),
    };
  });

  const endpoints = [
    { name: 'getDashboardSummary', method: 'getDashboardSummary', result: { total: 1 } },
    { name: 'getLeadsFunnel', method: 'getLeadsFunnel', result: { leads: 2 } },
    { name: 'getDesignFunnel', method: 'getDesignFunnel', result: { designs: 3 } },
    { name: 'getSalesMetrics', method: 'getSalesMetrics', result: { sales: 4 } },
  ];

  endpoints.forEach(({ name, method, result }) => {
    describe(name, () => {
      it(`should return 200 with ${name} data on valid query`, async () => {
        const startDate = '2023-01-01T00:00:00Z';
        const endDate = '2023-12-31T23:59:59Z';
        mockReq.query = { startDate, endDate };
        
        await (controller as any)[method](mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({ success: true, data: result, error: null });
        expect(mockUseCases[method]).toHaveBeenCalledWith({ startDate, endDate });
      });

      it('should return 400 on invalid query (e.g. malformed date format)', async () => {
        mockReq.query = { startDate: 'not-a-date' };
        
        await (controller as any)[method](mockReq as Request, mockRes as Response, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: 'Invalid date range'
        }));
        expect(mockUseCases[method]).not.toHaveBeenCalled();
      });

      it('should pass error to next() on unexpected errors', async () => {
        const error = new Error('Internal error');
        mockUseCases[method].mockRejectedValueOnce(error);
        
        await (controller as any)[method](mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });
});
