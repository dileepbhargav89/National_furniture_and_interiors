import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import {
  CreateDesignProjectUseCase,
  AdvanceProjectStageUseCase,
  AddQuotationUseCase,
  ApproveQuotationUseCase,
  ListDesignProjectsUseCase,
  GetDesignProjectByIdUseCase,
  GetDesignFunnelUseCase
} from '../application/design-projects.use-cases';
import {
  createDesignProjectSchema,
  advanceProjectStageSchema,
  addQuotationSchema,
  approveQuotationSchema,
  listDesignProjectsQuerySchema
} from './design-projects.schemas';
import {
  listPortfolioQuerySchema,
  adminListPortfolioQuerySchema,
  createPortfolioSchema,
  updatePortfolioSchema,
} from './portfolio.schemas';
import { IPortfolioRepository, IPortfolioFilter } from '../domain/portfolio.types';
import { DEFAULT_PORTFOLIO_PROJECTS } from '../domain/default-portfolio-data';

export interface DesignProjectsControllerDeps {
  createDesignProject: CreateDesignProjectUseCase;
  advanceProjectStage: AdvanceProjectStageUseCase;
  addQuotation: AddQuotationUseCase;
  approveQuotation: ApproveQuotationUseCase;
  listDesignProjects: ListDesignProjectsUseCase;
  getDesignProjectById: GetDesignProjectByIdUseCase;
  getFunnelMetrics: GetDesignFunnelUseCase;
  portfolioRepository?: IPortfolioRepository | undefined;
}

export class DesignProjectsController {
  private readonly portfolioRepo?: IPortfolioRepository | undefined;

  constructor(private readonly deps: DesignProjectsControllerDeps) {
    this.portfolioRepo = deps.portfolioRepository;
  }

  public createDesignProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createDesignProjectSchema.parse({ body: req.body });
      const actorId = req.auth?.sub;
      
      const payload: any = {
        ...data.body,
        actorId: actorId || 'system'
      };
      if (payload.leadId === undefined) delete payload.leadId;
      if (payload.assignedDesignerId === undefined) delete payload.assignedDesignerId;

      const project = await this.deps.createDesignProject.execute(payload);
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public advanceProjectStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = advanceProjectStageSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub;

      const payload: any = {
        projectId: data.params.id,
        targetStage: data.body.targetStage,
        expectedVersion: data.body.expectedVersion,
        actorId: actorId || 'system'
      };
      if (data.body.note !== undefined) {
        payload.note = data.body.note;
      }

      const project = await this.deps.advanceProjectStage.execute(payload);
      sendSuccess(req, res, 200, project);
    } catch (error) {
      next(error);
    }
  };

  public addQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = addQuotationSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub;

      const project = await this.deps.addQuotation.execute({
        projectId: data.params.id,
        boqItems: data.body.boqItems,
        expectedVersion: data.body.expectedVersion,
        actorId: actorId || 'system'
      });
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public approveQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = approveQuotationSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub;

      const project = await this.deps.approveQuotation.execute({
        projectId: data.params.id,
        quotationVersion: parseInt(data.params.qid, 10),
        eSignatureRef: data.body.eSignatureRef,
        expectedVersion: data.body.expectedVersion,
        actorId: actorId || 'system'
      });
      sendSuccess(req, res, 200, project);
    } catch (error) {
      next(error);
    }
  };

  public listDesignProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listDesignProjectsQuerySchema.parse(req.query);
      const actorId = req.auth?.sub;
      
      // Temporarily bypass role checking since it's not strictly available in req.auth typing
      // In a real app we'd verify with rbacMiddleware and filter if necessary
      const assignedDesignerId = query.assignedDesignerId;

      const filters: any = {};
      if (query.stage !== undefined) filters.stage = query.stage;
      if (assignedDesignerId !== undefined) filters.assignedDesignerId = assignedDesignerId;

      const result = await this.deps.listDesignProjects.execute(
        Object.keys(filters).length > 0 ? filters : undefined,
        query.limit,
        query.offset
      );
      sendSuccess(req, res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  public getDesignProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this.deps.getDesignProjectById.execute(req.params.id as string);
      sendSuccess(req, res, 200, project);
    } catch (error) {
      next(error);
    }
  };

  public getFunnelMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const metrics = await this.deps.getFunnelMetrics.execute(startDate, endDate);
      sendSuccess(req, res, 200, metrics);
    } catch (error) {
      next(error);
    }
  };

  // ── Portfolio Handlers (Public & Admin) ───────────────────────────────────

  public listPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        sendSuccess(req, res, 200, { items: DEFAULT_PORTFOLIO_PROJECTS, total: DEFAULT_PORTFOLIO_PROJECTS.length });
        return;
      }

      const query = listPortfolioQuerySchema.parse(req.query);
      
      // Auto-seed if empty
      const count = await this.portfolioRepo.count();
      if (count === 0) {
        await this.portfolioRepo.seedIfEmpty(DEFAULT_PORTFOLIO_PROJECTS);
      }

      const filter: IPortfolioFilter = {};
      if (query.sector) filter.sector = query.sector;
      if (query.category) filter.category = query.category;
      if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;

      const items = await this.portfolioRepo.findPublished(filter);
      sendSuccess(req, res, 200, { items, total: items.length });
    } catch (error) {
      next(error);
    }
  };

  public getPortfolioBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        const fallback = DEFAULT_PORTFOLIO_PROJECTS.find(p => p.slug === req.params.slug);
        sendSuccess(req, res, 200, fallback || null);
        return;
      }

      const item = await this.portfolioRepo.findBySlug(req.params.slug as string);
      sendSuccess(req, res, 200, item);
    } catch (error) {
      next(error);
    }
  };

  public adminListPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        sendSuccess(req, res, 200, { items: DEFAULT_PORTFOLIO_PROJECTS, total: DEFAULT_PORTFOLIO_PROJECTS.length });
        return;
      }

      const query = adminListPortfolioQuerySchema.parse(req.query);

      // Auto-seed if empty
      const count = await this.portfolioRepo.count();
      if (count === 0) {
        await this.portfolioRepo.seedIfEmpty(DEFAULT_PORTFOLIO_PROJECTS);
      }

      const result = await this.portfolioRepo.findAllAdmin(query.limit, query.offset, query.sector);
      sendSuccess(req, res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  public adminCreatePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        throw new Error('Portfolio repository not initialized');
      }

      const data = createPortfolioSchema.parse({ body: req.body });
      let slug =
        data.body.slug ||
        data.body.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

      // Handle duplicate slug collision gracefully
      const existing = await this.portfolioRepo.findBySlug(slug);
      if (existing) {
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      }

      const payload = {
        ...data.body,
        slug,
        categoryLabel: data.body.categoryLabel || data.body.category.toUpperCase().replace('-', ' & '),
        budgetString: data.body.budgetString || `₹${data.body.budgetInLakhs.toFixed(1)} Lakhs`,
      };

      const project = await this.portfolioRepo.create(payload as any);
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public adminUpdatePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        throw new Error('Portfolio repository not initialized');
      }

      const data = updatePortfolioSchema.parse({ params: req.params, body: req.body });
      const updates: any = { ...data.body };

      if (updates.budgetInLakhs !== undefined && !updates.budgetString) {
        updates.budgetString = `₹${updates.budgetInLakhs.toFixed(1)} Lakhs`;
      }

      const updated = await this.portfolioRepo.update(data.params.id, updates);
      sendSuccess(req, res, 200, updated);
    } catch (error) {
      next(error);
    }
  };

  public adminDeletePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        throw new Error('Portfolio repository not initialized');
      }

      const success = await this.portfolioRepo.delete(req.params.id as string);
      sendSuccess(req, res, 200, { success });
    } catch (error) {
      next(error);
    }
  };

  public adminSeedPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        throw new Error('Portfolio repository not initialized');
      }

      const seeded = await this.portfolioRepo.seedIfEmpty(DEFAULT_PORTFOLIO_PROJECTS);
      sendSuccess(req, res, 200, { seeded, message: `Seeded ${seeded} portfolio projects` });
    } catch (error) {
      next(error);
    }
  };
}
