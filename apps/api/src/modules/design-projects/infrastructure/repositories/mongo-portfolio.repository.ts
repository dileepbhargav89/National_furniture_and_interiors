import { 
  IPortfolioProject, 
  IPortfolioRepository, 
  IPortfolioFilter, 
  PortfolioSector 
} from '../../domain/portfolio.types';
import { PortfolioProjectModel } from '../models/portfolio.model';

export class MongoPortfolioRepository implements IPortfolioRepository {
  async findPublished(filters?: IPortfolioFilter): Promise<IPortfolioProject[]> {
    const query: Record<string, any> = { isPublished: true };
    if (filters?.sector) {
      query.sector = filters.sector;
    }
    if (filters?.category) {
      query.category = filters.category;
    }
    if (filters?.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }

    const docs = await PortfolioProjectModel.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return docs.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
    })) as IPortfolioProject[];
  }

  async findBySlug(slug: string): Promise<IPortfolioProject | null> {
    const doc: any = await PortfolioProjectModel.findOne({ slug }).lean();
    if (!doc) return null;
    return {
      ...doc,
      id: doc._id.toString(),
    } as IPortfolioProject;
  }

  async findById(id: string): Promise<IPortfolioProject | null> {
    const doc: any = await PortfolioProjectModel.findById(id).lean();
    if (!doc) return null;
    return {
      ...doc,
      id: doc._id.toString(),
    } as IPortfolioProject;
  }

  async findAllAdmin(
    limit = 50,
    skip = 0,
    sector?: PortfolioSector
  ): Promise<{ items: IPortfolioProject[]; total: number }> {
    const query: Record<string, any> = {};
    if (sector) {
      query.sector = sector;
    }

    const [docs, total] = await Promise.all([
      PortfolioProjectModel.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PortfolioProjectModel.countDocuments(query),
    ]);

    const items = docs.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
    })) as IPortfolioProject[];

    return { items, total };
  }

  async create(
    data: Omit<IPortfolioProject, '_id' | 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IPortfolioProject> {
    const created = await PortfolioProjectModel.create(data);
    const doc: any = created.toObject();
    return {
      ...doc,
      id: doc._id.toString(),
    } as IPortfolioProject;
  }

  async update(id: string, updates: Partial<IPortfolioProject>): Promise<IPortfolioProject | null> {
    const updated: any = await PortfolioProjectModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return null;
    return {
      ...updated,
      id: updated._id.toString(),
    } as IPortfolioProject;
  }

  async delete(id: string): Promise<boolean> {
    const result = await PortfolioProjectModel.findByIdAndDelete(id);
    return !!result;
  }

  async count(): Promise<number> {
    return PortfolioProjectModel.countDocuments();
  }

  async seedIfEmpty(projects: Omit<IPortfolioProject, '_id' | 'id'>[]): Promise<number> {
    const count = await PortfolioProjectModel.countDocuments();
    if (count > 0) return 0;

    const docs = projects.map((p, idx) => ({
      ...p,
      displayOrder: p.displayOrder ?? idx,
      isPublished: p.isPublished ?? true,
    }));

    const result = await PortfolioProjectModel.insertMany(docs);
    return result.length;
  }
}
