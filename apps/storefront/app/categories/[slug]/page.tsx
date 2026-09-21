import { Metadata } from 'next';
import CategoryClientPage from './client';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/api/v1/categories/${resolvedParams.slug}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const cat = data.data?.category;
      if (cat) {
        return {
          title: cat.seo?.title || `${cat.name} | National Interiors`,
          description: cat.seo?.description || cat.description,
          keywords: cat.seo?.keywords,
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch category metadata', e);
  }
  return { title: 'Category | National Interiors' };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <CategoryClientPage slug={resolvedParams.slug} />;
}
