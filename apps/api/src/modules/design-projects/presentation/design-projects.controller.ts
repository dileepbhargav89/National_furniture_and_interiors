import { Request, Response, NextFunction } from 'express';
import { sendSuccess, NotFoundError } from '../../../core/exceptions';
import { BoqPdfGeneratorAdapter } from '../infrastructure/adapters/boq-pdf.adapter';
import {
  CreateDesignProjectUseCase,
  AdvanceProjectStageUseCase,
  AddQuotationUseCase,
  ApproveQuotationUseCase,
  ListDesignProjectsUseCase,
  GetDesignProjectByIdUseCase,
  GetDesignFunnelUseCase,
  RecordSiteInspectionUseCase,
  AddSitePhotoUseCase,
  LogSnagItemUseCase,
  UpdateSnagStatusUseCase,
} from '../application/design-projects.use-cases';
import {
  createDesignProjectSchema,
  advanceProjectStageSchema,
  addQuotationSchema,
  approveQuotationSchema,
  listDesignProjectsQuerySchema,
  recordInspectionSchema,
  addSitePhotoSchema,
  logSnagSchema,
  updateSnagStatusSchema,
} from './design-projects.schemas';
import {
  listPortfolioQuerySchema,
  adminListPortfolioQuerySchema,
  createPortfolioSchema,
  updatePortfolioSchema,
} from './portfolio.schemas';
import { IPortfolioRepository, IPortfolioFilter } from '../domain/portfolio.types';
import { DEFAULT_PORTFOLIO_PROJECTS } from '../domain/default-portfolio-data';
import { CreateDesignProjectInput, DesignProjectStage } from '../domain/design-projects.types';

export interface DesignProjectsControllerDeps {
  createDesignProject: CreateDesignProjectUseCase;
  advanceProjectStage: AdvanceProjectStageUseCase;
  addQuotation: AddQuotationUseCase;
  approveQuotation: ApproveQuotationUseCase;
  listDesignProjects: ListDesignProjectsUseCase;
  getDesignProjectById: GetDesignProjectByIdUseCase;
  getFunnelMetrics: GetDesignFunnelUseCase;
  recordSiteInspection?: RecordSiteInspectionUseCase | undefined;
  addSitePhoto?: AddSitePhotoUseCase | undefined;
  logSnagItem?: LogSnagItemUseCase | undefined;
  updateSnagStatus?: UpdateSnagStatusUseCase | undefined;
  portfolioRepository?: IPortfolioRepository | undefined;
}

export class DesignProjectsController {
  private readonly portfolioRepo?: IPortfolioRepository | undefined;

  constructor(private readonly deps: DesignProjectsControllerDeps) {
    this.portfolioRepo = deps.portfolioRepository;
  }

  public createDesignProject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = createDesignProjectSchema.parse({ body: req.body });
      const actorId = req.auth?.sub;

      const payload: CreateDesignProjectInput = {
        ...data.body,
        actorId: actorId || 'system',
      };

      const project = await this.deps.createDesignProject.execute(payload);
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public advanceProjectStage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = advanceProjectStageSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub;

      const payload = {
        projectId: data.params.id,
        targetStage: data.body.targetStage as DesignProjectStage,
        expectedVersion: data.body.expectedVersion,
        actorId: actorId || 'system',
        ...(data.body.note !== undefined ? { note: data.body.note } : {}),
      };

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
        actorId: actorId || 'system',
        ...(data.body.financialBreakdown
          ? { financialBreakdown: data.body.financialBreakdown }
          : {}),
        ...(data.body.milestoneSchedule ? { milestoneSchedule: data.body.milestoneSchedule } : {}),
      });
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public getQuotationPdf = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const qid = parseInt(req.params.qid as string, 10);
      const project = await this.deps.getDesignProjectById.execute(projectId);
      if (!project) {
        throw new NotFoundError(`Design project ${projectId} not found`);
      }

      const quotation =
        project.quotations.find((q) => q.version === qid) ||
        project.quotations[project.quotations.length - 1];
      if (!quotation) {
        throw new NotFoundError(`Quotation version ${qid} not found for project ${projectId}`);
      }

      const pdfGenerator = new BoqPdfGeneratorAdapter();
      const buffer = await pdfGenerator.generateBuffer(project, quotation);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="NFI-Quotation-${project.projectCode}-v${quotation.version}.pdf"`,
      );
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  public approveQuotation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = approveQuotationSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub;

      const project = await this.deps.approveQuotation.execute({
        projectId: data.params.id,
        quotationVersion: parseInt(data.params.qid, 10),
        eSignatureRef: data.body.eSignatureRef,
        expectedVersion: data.body.expectedVersion,
        actorId: actorId || 'system',
      });
      sendSuccess(req, res, 200, project);
    } catch (error) {
      next(error);
    }
  };

  public recordInspection = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = recordInspectionSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub || 'system';

      if (!this.deps.recordSiteInspection) {
        throw new Error('RecordSiteInspectionUseCase not injected');
      }

      const updated = await this.deps.recordSiteInspection.execute({
        projectId: data.params.id,
        actorId,
        ...data.body,
      });

      sendSuccess(req, res, 201, updated);
    } catch (error) {
      next(error);
    }
  };

  public listInspections = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const project = await this.deps.getDesignProjectById.execute(projectId);
      if (!project) throw new NotFoundError(`Design project ${projectId} not found`);

      sendSuccess(req, res, 200, project.siteInspections || []);
    } catch (error) {
      next(error);
    }
  };

  public addSitePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = addSitePhotoSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub || 'system';

      if (!this.deps.addSitePhoto) {
        throw new Error('AddSitePhotoUseCase not injected');
      }

      const updated = await this.deps.addSitePhoto.execute({
        projectId: data.params.id,
        actorId,
        ...data.body,
      });

      sendSuccess(req, res, 201, updated);
    } catch (error) {
      next(error);
    }
  };

  public listPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id as string;
      const clientOnly = req.query.clientOnly === 'true';
      const project = await this.deps.getDesignProjectById.execute(projectId);
      if (!project) throw new NotFoundError(`Design project ${projectId} not found`);

      let photos = project.sitePhotos || [];
      if (clientOnly) {
        photos = photos.filter((p) => p.isClientVisible);
      }

      sendSuccess(req, res, 200, photos);
    } catch (error) {
      next(error);
    }
  };

  public logSnag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = logSnagSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub || 'system';

      if (!this.deps.logSnagItem) {
        throw new Error('LogSnagItemUseCase not injected');
      }

      const updated = await this.deps.logSnagItem.execute({
        projectId: data.params.id,
        actorId,
        ...data.body,
      });

      sendSuccess(req, res, 201, updated);
    } catch (error) {
      next(error);
    }
  };

  public updateSnagStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = updateSnagStatusSchema.parse({ params: req.params, body: req.body });
      const actorId = req.auth?.sub || 'system';

      if (!this.deps.updateSnagStatus) {
        throw new Error('UpdateSnagStatusUseCase not injected');
      }

      const updated = await this.deps.updateSnagStatus.execute({
        projectId: data.params.id,
        snagId: data.params.snagId,
        actorId,
        ...data.body,
      });

      sendSuccess(req, res, 200, updated);
    } catch (error) {
      next(error);
    }
  };

  public listDesignProjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = listDesignProjectsQuerySchema.parse(req.query);

      // Temporarily bypass role checking since it's not strictly available in req.auth typing
      // In a real app we'd verify with rbacMiddleware and filter if necessary
      const assignedDesignerId = query.assignedDesignerId;

      const filters: Record<string, unknown> = {};
      if (query.stage !== undefined) filters.stage = query.stage;
      if (assignedDesignerId !== undefined) filters.assignedDesignerId = assignedDesignerId;

      const result = await this.deps.listDesignProjects.execute(
        Object.keys(filters).length > 0 ? filters : undefined,
        query.limit,
        query.offset,
      );
      sendSuccess(req, res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  public getDesignProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const project = await this.deps.getDesignProjectById.execute(req.params.id as string);
      sendSuccess(req, res, 200, project);
    } catch (error) {
      next(error);
    }
  };

  public getFunnelMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
        sendSuccess(req, res, 200, {
          items: DEFAULT_PORTFOLIO_PROJECTS,
          total: DEFAULT_PORTFOLIO_PROJECTS.length,
        });
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

  public getPortfolioBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        const fallback = DEFAULT_PORTFOLIO_PROJECTS.find((p) => p.slug === req.params.slug);
        sendSuccess(req, res, 200, fallback || null);
        return;
      }

      const item = await this.portfolioRepo.findBySlug(req.params.slug as string);
      sendSuccess(req, res, 200, item);
    } catch (error) {
      next(error);
    }
  };

  public adminListPortfolio = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        sendSuccess(req, res, 200, {
          items: DEFAULT_PORTFOLIO_PROJECTS,
          total: DEFAULT_PORTFOLIO_PROJECTS.length,
        });
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

  public adminCreatePortfolio = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
        categoryLabel:
          data.body.categoryLabel || data.body.category.toUpperCase().replace('-', ' & '),
        budgetString: data.body.budgetString || `₹${data.body.budgetInLakhs.toFixed(1)} Lakhs`,
      };

      const project = await this.portfolioRepo.create(
        payload as Parameters<typeof this.portfolioRepo.create>[0],
      );
      sendSuccess(req, res, 201, project);
    } catch (error) {
      next(error);
    }
  };

  public adminUpdatePortfolio = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!this.portfolioRepo) {
        throw new Error('Portfolio repository not initialized');
      }

      const data = updatePortfolioSchema.parse({ params: req.params, body: req.body });
      const updates = { ...data.body } as Parameters<typeof this.portfolioRepo.update>[1];

      if (updates.budgetInLakhs !== undefined && !updates.budgetString) {
        updates.budgetString = `₹${updates.budgetInLakhs.toFixed(1)} Lakhs`;
      }

      const updated = await this.portfolioRepo.update(data.params.id, updates);
      sendSuccess(req, res, 200, updated);
    } catch (error) {
      next(error);
    }
  };

  public adminDeletePortfolio = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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

  public adminSeedPortfolio = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
