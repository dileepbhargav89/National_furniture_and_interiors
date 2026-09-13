import { IBlogRepository, IBannerRepository, ITestimonialRepository, INewsletterRepository, BannerPlacement } from '../../domain/cms.types';
import { BlogModel } from '../models/blog.model';
import { BannerModel } from '../models/banner.model';
import { TestimonialModel } from '../models/testimonial.model';
import { NewsletterSubscriberModel } from '../models/newsletter.model';

export class MongoBlogRepository implements IBlogRepository {
  async create(data: any): Promise<any> {
    const blog = new BlogModel(data);
    await blog.save();
    return blog.toJSON();
  }

  async update(id: string, data: any): Promise<any> {
    const blog = await BlogModel.findByIdAndUpdate(id, data, { new: true });
    return blog?.toJSON() || null;
  }

  async findById(id: string): Promise<any> {
    const blog = await BlogModel.findById(id);
    return blog?.toJSON() || null;
  }

  async findBySlug(slug: string): Promise<any> {
    const blog = await BlogModel.findOne({ slug, isDeleted: false });
    return blog?.toJSON() || null;
  }

  async findAll(limit: number, offset: number, filter: any = {}): Promise<{ items: any[]; total: number }> {
    const query = { ...filter, isDeleted: false };
    const [items, total] = await Promise.all([
      BlogModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      BlogModel.countDocuments(query),
    ]);
    return { items, total };
  }
}

export class MongoBannerRepository implements IBannerRepository {
  async create(data: any): Promise<any> {
    const banner = new BannerModel(data);
    await banner.save();
    return banner.toJSON();
  }

  async update(id: string, data: any): Promise<any> {
    const banner = await BannerModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return banner?.toJSON() || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await BannerModel.findByIdAndDelete(id);
    return Boolean(res);
  }

  async findById(id: string): Promise<any> {
    const banner = await BannerModel.findById(id);
    return banner?.toJSON() || null;
  }

  async findAll(placement?: BannerPlacement, category?: string): Promise<any[]> {
    const now = new Date();
    const query: Record<string, any> = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    if (placement) {
      query.placement = placement;
    }
    if (category) {
      query.targetCategory = category;
    }

    const banners = await BannerModel.find(query).sort({ sortOrder: 1, createdAt: -1 });
    return banners.map((b) => b.toJSON());
  }

  async findAllAdmin(filter: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (filter.placement) {
      query.placement = filter.placement;
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    const banners = await BannerModel.find(query).sort({ sortOrder: 1, createdAt: -1 });
    return banners.map((b) => b.toJSON());
  }

  async recordClick(id: string): Promise<any> {
    const banner = await BannerModel.findByIdAndUpdate(
      id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    return banner?.toJSON() || null;
  }

  async recordImpression(id: string): Promise<any> {
    const banner = await BannerModel.findByIdAndUpdate(
      id,
      { $inc: { impressionCount: 1 } },
      { new: true }
    );
    return banner?.toJSON() || null;
  }
}

export class MongoTestimonialRepository implements ITestimonialRepository {
  async create(data: any): Promise<any> {
    const testimonial = new TestimonialModel(data);
    await testimonial.save();
    return testimonial.toJSON();
  }

  async update(id: string, data: any): Promise<any> {
    const testimonial = await TestimonialModel.findByIdAndUpdate(id, data, { new: true });
    return testimonial?.toJSON() || null;
  }

  async findAll(limit: number, offset: number, filter: any = {}): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      TestimonialModel.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      TestimonialModel.countDocuments(filter),
    ]);
    return { items, total };
  }
}

export class MongoNewsletterRepository implements INewsletterRepository {
  async subscribe(email: string, source?: string): Promise<any> {
    let subscriber = await NewsletterSubscriberModel.findOne({ email });
    
    if (subscriber) {
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        subscriber.set('unsubscribedAt', undefined);
        await subscriber.save();
      }
      return subscriber.toJSON();
    }
    
    subscriber = new NewsletterSubscriberModel({ email, source });
    await subscriber.save();
    return subscriber.toJSON();
  }

  async unsubscribe(email: string): Promise<void> {
    await NewsletterSubscriberModel.findOneAndUpdate(
      { email },
      { isActive: false, unsubscribedAt: new Date() }
    );
  }

  async findAll(limit: number, offset: number): Promise<{ items: any[]; total: number }> {
    const [items, total] = await Promise.all([
      NewsletterSubscriberModel.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      NewsletterSubscriberModel.countDocuments(),
    ]);
    return { items, total };
  }
}
