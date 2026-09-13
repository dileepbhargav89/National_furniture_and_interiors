export interface IMaterialSpec {
  category: string;
  detail: string;
}

export interface IClientTestimonial {
  clientName: string;
  society: string;
  quote: string;
  rating: number;
}

export type PortfolioSector = 'residential' | 'commercial';

export type PortfolioCategory =
  | '3bhk-4bhk'
  | '2bhk'
  | 'villa'
  | 'kitchen'
  | 'penthouse'
  | 'office'
  | 'restaurant'
  | 'hotel'
  | 'retail';

export interface IPortfolioProject {
  _id?: string | undefined;
  id?: string | undefined;
  slug: string;
  title: string;
  subtitle: string;
  community: string;
  locality: string;
  city: string;
  sector: PortfolioSector;
  category: PortfolioCategory;
  categoryLabel: string;
  areaSqFt: number;
  budgetInLakhs: number;
  budgetString: string;
  turnaroundDays: number;
  style: string;
  coverImage: string;
  galleryImages: string[];
  scope: string[];
  materials: IMaterialSpec[];
  designerNotes: string;
  clientTestimonial?: IClientTestimonial | undefined;
  isPublished: boolean;
  displayOrder: number;
  isFeatured: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IPortfolioFilter {
  sector?: PortfolioSector | undefined;
  category?: PortfolioCategory | undefined;
  isFeatured?: boolean | undefined;
}

export interface IPortfolioRepository {
  findPublished(filters?: IPortfolioFilter): Promise<IPortfolioProject[]>;
  findBySlug(slug: string): Promise<IPortfolioProject | null>;
  findById(id: string): Promise<IPortfolioProject | null>;
  findAllAdmin(limit?: number, skip?: number, sector?: PortfolioSector): Promise<{ items: IPortfolioProject[]; total: number }>;
  create(data: Omit<IPortfolioProject, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<IPortfolioProject>;
  update(id: string, updates: Partial<IPortfolioProject>): Promise<IPortfolioProject | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  seedIfEmpty(projects: Omit<IPortfolioProject, '_id' | 'id'>[]): Promise<number>;
}
