import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  ListBlogsUseCase, GetBlogBySlugUseCase, CreateBlogUseCase, UpdateBlogUseCase,
  ListBannersUseCase, ListAdminBannersUseCase, GetBannerByIdUseCase, CreateBannerUseCase,
  UpdateBannerUseCase, DeleteBannerUseCase, ToggleBannerStatusUseCase,
  TrackBannerClickUseCase, TrackBannerImpressionUseCase,
  ListTestimonialsUseCase, CreateTestimonialUseCase,
  SubscribeNewsletterUseCase, ListNewsletterSubscribersUseCase
} from '../application/cms.use-cases';
import { BlogStatus, BannerPlacement, TestimonialSource } from '../domain/cms.types';
import { sendSuccess } from '../../../core/exceptions';
import { UnauthorizedError } from '../../../core/exceptions';

// --- Zod Schemas ---

const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const CreateBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional(),
  categoryTags: z.array(z.string()).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  status: z.nativeEnum(BlogStatus).optional(),
});

const UpdateBlogSchema = CreateBlogSchema.partial();

const CreateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  ctaText: z.string().optional().default('Explore Collection'),
  linkUrl: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryLinkUrl: z.string().optional(),
  imageUrl: z.string().url('A valid desktop image URL is required'),
  mobileImageUrl: z.string().url('Mobile image must be a valid URL').optional().or(z.literal('')),
  placement: z.nativeEnum(BannerPlacement),
  targetCategory: z.string().optional(),
  discountCode: z.string().optional(),
  sortOrder: z.coerce.number().optional().default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const UpdateBannerSchema = CreateBannerSchema.partial();

const CreateTestimonialSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  rating: z.number().min(1).max(5),
  content: z.string().min(1),
  projectType: z.string().optional(),
  mediaUrls: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO']),
  })).optional(),
  source: z.nativeEnum(TestimonialSource).optional(),
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const SubscribeNewsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export class CmsController {
  constructor(
    private readonly listBlogsUseCase: ListBlogsUseCase,
    private readonly getBlogBySlugUseCase: GetBlogBySlugUseCase,
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly updateBlogUseCase: UpdateBlogUseCase,
    private readonly listBannersUseCase: ListBannersUseCase,
    private readonly listAdminBannersUseCase: ListAdminBannersUseCase,
    private readonly getBannerByIdUseCase: GetBannerByIdUseCase,
    private readonly createBannerUseCase: CreateBannerUseCase,
    private readonly updateBannerUseCase: UpdateBannerUseCase,
    private readonly deleteBannerUseCase: DeleteBannerUseCase,
    private readonly toggleBannerStatusUseCase: ToggleBannerStatusUseCase,
    private readonly trackBannerClickUseCase: TrackBannerClickUseCase,
    private readonly trackBannerImpressionUseCase: TrackBannerImpressionUseCase,
    private readonly listTestimonialsUseCase: ListTestimonialsUseCase,
    private readonly createTestimonialUseCase: CreateTestimonialUseCase,
    private readonly subscribeNewsletterUseCase: SubscribeNewsletterUseCase,
    private readonly listNewsletterSubscribersUseCase: ListNewsletterSubscribersUseCase
  ) {}

  // --- Blogs ---

  listBlogs = async (req: Request, res: Response) => {
    const { limit, offset } = PaginationSchema.parse(req.query);
    const filter: any = {};
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    const result = await this.listBlogsUseCase.execute(limit, offset, filter);
    sendSuccess(req, res, 200, { items: result.items, total: result.total, limit, offset });
  };

  getBlogBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const blog = await this.getBlogBySlugUseCase.execute(slug);
    sendSuccess(req, res, 200, blog);
  };

  createBlog = async (req: Request, res: Response) => {
    const data = CreateBlogSchema.parse(req.body);
    const authorId = req.auth?.sub;
    if (!authorId) {
      throw new UnauthorizedError('User not authenticated');
    }
    const blog = await this.createBlogUseCase.execute(data, authorId);
    sendSuccess(req, res, 201, blog);
  };

  updateBlog = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = UpdateBlogSchema.parse(req.body);
    const blog = await this.updateBlogUseCase.execute(id, data);
    sendSuccess(req, res, 200, blog);
  };

  // --- Public Banners ---

  listBanners = async (req: Request, res: Response) => {
    const placement = req.query.placement as BannerPlacement | undefined;
    const category = req.query.category as string | undefined;
    const banners = await this.listBannersUseCase.execute(placement, category);
    sendSuccess(req, res, 200, banners);
  };

  trackBannerClick = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const banner = await this.trackBannerClickUseCase.execute(id);
    sendSuccess(req, res, 200, { success: true, clickCount: banner?.clickCount });
  };

  trackBannerImpression = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const banner = await this.trackBannerImpressionUseCase.execute(id);
    sendSuccess(req, res, 200, { success: true, impressionCount: banner?.impressionCount });
  };

  // --- Admin Banners ---

  adminListBanners = async (req: Request, res: Response) => {
    const filter: Record<string, any> = {};
    if (req.query.placement) filter.placement = req.query.placement;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const banners = await this.listAdminBannersUseCase.execute(filter);
    sendSuccess(req, res, 200, banners);
  };

  adminGetBanner = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const banner = await this.getBannerByIdUseCase.execute(id);
    if (!banner) {
      res.status(404).json({ success: false, error: { message: 'Banner not found' } });
      return;
    }
    sendSuccess(req, res, 200, banner);
  };

  createBanner = async (req: Request, res: Response) => {
    const data = CreateBannerSchema.parse(req.body);
    const banner = await this.createBannerUseCase.execute(data);
    sendSuccess(req, res, 201, banner);
  };

  updateBanner = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = UpdateBannerSchema.parse(req.body);
    const banner = await this.updateBannerUseCase.execute(id, data);
    sendSuccess(req, res, 200, banner);
  };

  toggleBannerStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const banner = await this.toggleBannerStatusUseCase.execute(id, isActive);
    sendSuccess(req, res, 200, banner);
  };

  deleteBanner = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.deleteBannerUseCase.execute(id);
    sendSuccess(req, res, 200, { deleted: true, id });
  };

  // --- Testimonials ---

  listTestimonials = async (req: Request, res: Response) => {
    const { limit, offset } = PaginationSchema.parse(req.query);
    const filter: any = {};
    if (req.query.isApproved !== undefined) {
      filter.isApproved = req.query.isApproved === 'true';
    }
    if (req.query.isFeatured !== undefined) {
      filter.isFeatured = req.query.isFeatured === 'true';
    }
    const result = await this.listTestimonialsUseCase.execute(limit, offset, filter);
    sendSuccess(req, res, 200, { items: result.items, total: result.total, limit, offset });
  };

  createTestimonial = async (req: Request, res: Response) => {
    const data = CreateTestimonialSchema.parse(req.body);
    if (!req.auth?.permissions?.includes('cms:manage') && !req.auth?.permissions?.includes('cms.write')) {
      data.isApproved = false;
      data.isFeatured = false;
      data.source = TestimonialSource.WEBSITE;
      if (req.auth?.sub) {
        data.customerId = req.auth.sub;
      }
    }
    const testimonial = await this.createTestimonialUseCase.execute(data);
    sendSuccess(req, res, 201, testimonial);
  };

  // --- Newsletter ---

  subscribeNewsletter = async (req: Request, res: Response) => {
    const data = SubscribeNewsletterSchema.parse(req.body);
    const subscriber = await this.subscribeNewsletterUseCase.execute(data.email, data.source);
    sendSuccess(req, res, 201, subscriber);
  };

  listNewsletterSubscribers = async (req: Request, res: Response) => {
    const { limit, offset } = PaginationSchema.parse(req.query);
    const result = await this.listNewsletterSubscribersUseCase.execute(limit, offset);
    sendSuccess(req, res, 200, { items: result.items, total: result.total, limit, offset });
  };
}
