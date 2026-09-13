'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '../../../components/product-card';
import { CatalogService, Product, Category } from '@nfi/api-client';

export default function CategoryClientPage({ slug }: { slug: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch category by slug
      const catResponse = await CatalogService.getCategory(slug);
      const cat = catResponse.data?.category;
      setCategory(cat || null);

      // 2. Fetch products for this category
      if (cat) {
        const prodResponse = await CatalogService.listProducts({ categoryId: cat.id || cat._id });
        setProducts(prodResponse.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch category data', err);
      setError('Category not found or failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-gray-900 mb-4">{error}</h1>
          <Link href="/products" className="text-sm text-indigo-600 hover:text-indigo-900">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 py-12 px-8 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Collection 2026</p>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-4 capitalize">
          {category ? category.name : 'Loading...'}
        </h1>
        {category?.description && (
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mt-4">
            {category.description}
          </p>
        )}
      </div>

      <div className="container mx-auto px-4 py-10 md:px-8">
        {/* Grid */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-7">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{products.length}</span> products
            </p>
            <select className="text-sm border border-gray-200 rounded-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-black focus:border-black bg-white text-gray-700 cursor-pointer">
              <option>Featured</option>
              <option>Newest Arrivals</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No products found in this category.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
              {products.map((product) => (
                <ProductCard 
                  key={product.id || product._id} 
                  id={product.id || (product._id as string)}
                  name={product.name}
                  price={product.basePrice?.amount}
                  mrp={product.mrp?.amount}
                  currency={product.basePrice?.currency || 'INR'}
                  slug={product.slug}
                  images={product.images?.map(img => img.url) || []}
                  category={category?.name || 'Furniture'}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
