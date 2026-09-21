import { Metadata } from 'next';
import CollectionClientPage from './client';
import { CURATED_COLLECTIONS_DATA } from '../../../data/curated-collections';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const fallback = CURATED_COLLECTIONS_DATA[resolvedParams.slug];

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/v1/collections/${resolvedParams.slug}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const collection = data.data;
      if (collection) {
        return {
          title:
            collection.seo?.title ||
            `${collection.title} Collection | National Interiors Bengaluru`,
          description:
            collection.seo?.description ||
            collection.description ||
            collection.shortDescription ||
            fallback?.designerQuote,
          keywords: collection.seo?.keywords || [
            collection.title,
            'luxury furniture Bengaluru',
            'teakwood suite',
            'turnkey interior',
          ],
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch collection metadata', e);
  }

  if (fallback) {
    return {
      title: `${fallback.title} Collection | National Interiors Bengaluru`,
      description: fallback.designerQuote,
    };
  }

  return { title: 'Curated Collection | National Furniture & Interiors Bengaluru' };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <CollectionClientPage slug={resolvedParams.slug} />;
}
