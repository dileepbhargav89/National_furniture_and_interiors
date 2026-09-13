import { IBlogRepository, IBannerRepository, ITestimonialRepository, INewsletterRepository, BannerPlacement } from '../domain/cms.types';
import { NotFoundError, ConflictError } from '../../../core/exceptions';

// --- Blogs ---

export class ListBlogsUseCase {
  constructor(private readonly blogRepository: IBlogRepository) {}

  async execute(limit: number, offset: number, filter?: any) {
    return this.blogRepository.findAll(limit, offset, filter);
  }
}

export class GetBlogBySlugUseCase {
  constructor(private readonly blogRepository: IBlogRepository) {}

  async execute(slug: string) {
    const blog = await this.blogRepository.findBySlug(slug);
    if (!blog) {
      throw new NotFoundError(`Blog with slug ${slug} not found`);
    }
    return blog;
  }
}

export class CreateBlogUseCase {
  constructor(private readonly blogRepository: IBlogRepository) {}

  async execute(data: any, authorId: string) {
    const existing = await this.blogRepository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError(`Blog with slug ${data.slug} already exists`);
    }
    return this.blogRepository.create({ ...data, authorId });
  }
}

export class UpdateBlogUseCase {
  constructor(private readonly blogRepository: IBlogRepository) {}

  async execute(id: string, data: any) {
    const blog = await this.blogRepository.findById(id);
    if (!blog) throw new NotFoundError('Blog not found');
    if (data.slug && data.slug !== blog.slug) {
      const existing = await this.blogRepository.findBySlug(data.slug);
      if (existing) {
        throw new ConflictError(`Blog with slug ${data.slug} already exists`);
      }
    }
    return this.blogRepository.update(id, data);
  }
}

// --- Banners ---

export class ListBannersUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(placement?: BannerPlacement, category?: string) {
    return this.bannerRepository.findAll(placement, category);
  }
}

export class ListAdminBannersUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(filter?: any) {
    const banners = await this.bannerRepository.findAllAdmin(filter);
    // Enrich with calculated metrics (CTR)
    return banners.map((b) => {
      const impressions = b.impressionCount || 0;
      const clicks = b.clickCount || 0;
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
      return {
        ...b,
        ctr,
      };
    });
  }
}

export class GetBannerByIdUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string) {
    return this.bannerRepository.findById(id);
  }
}

export class CreateBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(data: any) {
    return this.bannerRepository.create(data);
  }
}

export class UpdateBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string, data: any) {
    return this.bannerRepository.update(id, data);
  }
}

export class DeleteBannerUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string) {
    return this.bannerRepository.delete(id);
  }
}

export class ToggleBannerStatusUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string, isActive: boolean) {
    return this.bannerRepository.update(id, { isActive });
  }
}

export class TrackBannerClickUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string) {
    return this.bannerRepository.recordClick(id);
  }
}

export class TrackBannerImpressionUseCase {
  constructor(private readonly bannerRepository: IBannerRepository) {}

  async execute(id: string) {
    return this.bannerRepository.recordImpression(id);
  }
}

// --- Testimonials ---

export class ListTestimonialsUseCase {
  constructor(private readonly testimonialRepository: ITestimonialRepository) {}

  async execute(limit: number, offset: number, filter?: any) {
    return this.testimonialRepository.findAll(limit, offset, filter);
  }
}

export class CreateTestimonialUseCase {
  constructor(private readonly testimonialRepository: ITestimonialRepository) {}

  async execute(data: any) {
    return this.testimonialRepository.create(data);
  }
}

// --- Newsletter ---

export class SubscribeNewsletterUseCase {
  constructor(private readonly newsletterRepository: INewsletterRepository) {}

  async execute(email: string, source?: string) {
    return this.newsletterRepository.subscribe(email, source);
  }
}

export class ListNewsletterSubscribersUseCase {
  constructor(private readonly newsletterRepository: INewsletterRepository) {}

  async execute(limit: number, offset: number) {
    return this.newsletterRepository.findAll(limit, offset);
  }
}
