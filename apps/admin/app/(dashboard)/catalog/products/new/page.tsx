'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CatalogService, Category, ImageSubdoc, ProductVariant } from '@nfi/api-client';
import { getSpecsForCategory, SpecField } from '@/lib/category-specs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { MediaUploader } from '@/components/catalog/media-uploader';
import { VideoManager, VideoItem } from '@/components/catalog/video-manager';
import { VariantManager } from '@/components/catalog/variant-manager';

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  // Basic Details
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('National Furniture & Interiors');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  // Pricing & Tax
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [taxIncluded, setTaxIncluded] = useState(true);

  // Organization
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [productType, setProductType] = useState<'READY_TO_SHIP' | 'MADE_TO_ORDER'>('READY_TO_SHIP');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Physical Specifications & Materials
  const [primaryMaterial, setPrimaryMaterial] = useState('');
  const [frameMaterial, setFrameMaterial] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [finishesInput, setFinishesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [dimLength, setDimLength] = useState('');
  const [dimWidth, setDimWidth] = useState('');
  const [dimHeight, setDimHeight] = useState('');
  const [dimUnit, setDimUnit] = useState('cm');
  const [weightKg, setWeightKg] = useState('');

  // Dynamic Category Specs
  const [specifications, setSpecifications] = useState<Record<string, string | number | boolean>>({});
  const [activeSpecs, setActiveSpecs] = useState<SpecField[]>([]);

  // Media & Variants
  const [images, setImages] = useState<ImageSubdoc[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoryId) {
      const category = categories.find((c) => (c.id || c._id) === categoryId);
      if (category) {
        setActiveSpecs(getSpecsForCategory(category.slug || category.name));
      }
    } else {
      setActiveSpecs([]);
    }
  }, [categoryId, categories]);

  const fetchCategories = async () => {
    try {
      const response = await CatalogService.listCategories();
      setCategories(response.data?.items || (Array.isArray(response.data) ? response.data : []));
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleSpecChange = (field: string, value: string | number | boolean) => {
    setSpecifications((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const finishes = finishesInput
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const colors = colorsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const dimensions =
        dimLength && dimWidth && dimHeight
          ? {
              length: parseFloat(dimLength),
              width: parseFloat(dimWidth),
              height: parseFloat(dimHeight),
              unit: dimUnit,
            }
          : undefined;

      const payload: Record<string, unknown> = {
        name,
        sku,
        brand,
        shortDescription: shortDescription || undefined,
        description,
        categoryId,
        categoryIds: [categoryId],
        basePrice: { amount: Math.round(parseFloat(price) * 100), currency: 'INR' },
        mrp: mrp ? { amount: Math.round(parseFloat(mrp) * 100), currency: 'INR' } : undefined,
        taxRate: parseFloat(taxRate) || 18,
        taxIncluded,
        productType,
        status,
        images,
        videos,
        variants,
        tags,
        finishes: finishes.length > 0 ? finishes : undefined,
        colors: colors.length > 0 ? colors : undefined,
        isFeatured,
        isBestSeller,
        primaryMaterial: primaryMaterial || undefined,
        frameMaterial: frameMaterial || undefined,
        careInstructions: careInstructions || undefined,
        warranty: warrantyMonths ? { durationMonths: parseInt(warrantyMonths, 10), terms: 'Standard Manufacturer Warranty' } : undefined,
        dimensions,
        weight: weightKg ? parseFloat(weightKg) : undefined,
        specifications,
        seo: seoTitle || seoDescription ? { title: seoTitle, description: seoDescription } : undefined,
      };

      await CatalogService.adminCreateProduct(payload);
      router.push('/catalog/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <PageHeader
        title="Add New Product"
        description="Create a new furniture product with variants, rich specs, and media gallery."
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Products', href: '/catalog/products' }, { label: 'New' }]}
        action={
          <div className="flex gap-3">
            <Link href="/catalog/products">
              <NfiButton type="button" variant="secondary" size="sm">
                Cancel
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading}>
              Save Product
            </NfiButton>
          </div>
        }
      />

      {error && (
        <div
          className="p-4 rounded-md text-sm border"
          style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}
        >
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Basic Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Product Name" htmlFor="name" required>
                  <input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Teak Wood Dining Chair"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="SKU" htmlFor="sku" required helpText="Unique stock-keeping unit">
                  <input
                    id="sku"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. FUR-CHR-001"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Brand / Collection Line" htmlFor="brand">
                  <input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Short Catchphrase / Summary" htmlFor="shortDesc">
                  <input
                    id="shortDesc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="e.g. Handcrafted solid teak with linen upholstery"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Full Description" htmlFor="description" required>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed architectural and design description of the piece..."
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Pricing & Tax */}
          <SectionCard title="Pricing & GST">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Selling Price (₹)" htmlFor="price" required helpText="Base retail amount">
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="MRP (₹)" htmlFor="mrp" helpText="Original price for discount strikethrough">
                <input
                  id="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="0.00"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="GST Rate (%)" htmlFor="taxRate">
                <input
                  id="taxRate"
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="taxIncluded"
                checked={taxIncluded}
                onChange={(e) => setTaxIncluded(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="taxIncluded" className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                Price includes GST
              </label>
            </div>
          </SectionCard>

          {/* Media Gallery */}
          <SectionCard title="Product Visuals">
            <MediaUploader
              images={images}
              onChange={setImages}
              maxFiles={8}
              ownerType="PRODUCT"
              label="Gallery Images"
              helpText="Upload product shots, angle perspectives, and detail close-ups. First image will be used as catalog thumbnail."
            />
          </SectionCard>

          {/* Videos & Multimedia */}
          <SectionCard title="Product Videos & Multimedia">
            <VideoManager
              videos={videos}
              onChange={setVideos}
              maxVideos={5}
            />
          </SectionCard>

          {/* Variants */}
          <SectionCard title="Product Variants">
            <VariantManager
              variants={variants}
              baseSku={sku}
              basePrice={parseFloat(price) || 0}
              onChange={setVariants}
            />
          </SectionCard>

          {/* Dimensions & Craftsmanship */}
          <SectionCard title="Dimensions & Craftsmanship">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--nfi-text-secondary)' }}>
                  Physical Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Length" htmlFor="dimL">
                    <input
                      id="dimL"
                      type="number"
                      value={dimLength}
                      onChange={(e) => setDimLength(e.target.value)}
                      placeholder="e.g. 180"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Width / Depth" htmlFor="dimW">
                    <input
                      id="dimW"
                      type="number"
                      value={dimWidth}
                      onChange={(e) => setDimWidth(e.target.value)}
                      placeholder="e.g. 90"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Height" htmlFor="dimH">
                    <input
                      id="dimH"
                      type="number"
                      value={dimHeight}
                      onChange={(e) => setDimHeight(e.target.value)}
                      placeholder="e.g. 75"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Unit" htmlFor="dimUnit">
                    <select
                      id="dimUnit"
                      value={dimUnit}
                      onChange={(e) => setDimUnit(e.target.value)}
                      className={inputClassName}
                      style={inputStyle}
                    >
                      <option value="cm">cm</option>
                      <option value="inches">inches</option>
                      <option value="mm">mm</option>
                    </select>
                  </FormField>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <FormField label="Primary Material" htmlFor="pMat">
                  <input
                    id="pMat"
                    value={primaryMaterial}
                    onChange={(e) => setPrimaryMaterial(e.target.value)}
                    placeholder="e.g. Solid Teak Wood"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Frame / Leg Material" htmlFor="fMat">
                  <input
                    id="fMat"
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    placeholder="e.g. Matte Powder Coated Steel"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Weight (Kg)" htmlFor="weightKg">
                  <input
                    id="weightKg"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 24.5"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Care Instructions" htmlFor="care">
                  <input
                    id="care"
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    placeholder="e.g. Wipe with damp cloth, avoid direct sunlight"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Warranty (Months)" htmlFor="warranty">
                  <input
                    id="warranty"
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    placeholder="12"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  label="Available Finishes"
                  htmlFor="finishes"
                  helpText="Comma-separated: e.g. Teak Brown, Walnut, Natural Oak"
                >
                  <input
                    id="finishes"
                    value={finishesInput}
                    onChange={(e) => setFinishesInput(e.target.value)}
                    placeholder="Teak Brown, Walnut, Natural Oak"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField
                  label="Colors / Swatches"
                  htmlFor="colors"
                  helpText="Comma-separated: e.g. Olive Green, Charcoal, Cream White"
                >
                  <input
                    id="colors"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    placeholder="Olive Green, Charcoal, Cream White"
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Category Specifications */}
          {activeSpecs.length > 0 && (
            <SectionCard title="Category Specifications">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeSpecs.map((spec) => (
                  <FormField key={spec.name} label={spec.label} htmlFor={`spec-${spec.name}`}>
                    {spec.type === 'select' ? (
                      <select
                        id={`spec-${spec.name}`}
                        value={(specifications[spec.name] as string | number) || ''}
                        onChange={(e) => handleSpecChange(spec.name, e.target.value)}
                        className={inputClassName}
                        style={inputStyle}
                      >
                        <option value="">Select {spec.label}</option>
                        {spec.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : spec.type === 'boolean' ? (
                      <div className="flex items-center space-x-2 h-10">
                        <input
                          type="checkbox"
                          id={`spec-${spec.name}`}
                          checked={(specifications[spec.name] as boolean) || false}
                          onChange={(e) => handleSpecChange(spec.name, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                          Yes
                        </span>
                      </div>
                    ) : (
                      <input
                        id={`spec-${spec.name}`}
                        type={spec.type === 'number' ? 'number' : 'text'}
                        value={(specifications[spec.name] as string | number) || ''}
                        onChange={(e) =>
                          handleSpecChange(spec.name, spec.type === 'number' ? parseFloat(e.target.value) : e.target.value)
                        }
                        className={inputClassName}
                        style={inputStyle}
                      />
                    )}
                  </FormField>
                ))}
              </div>
            </SectionCard>
          )}

          {/* SEO Metadata */}
          <SectionCard title="SEO & Search Engine Optimization">
            <div className="space-y-4">
              <FormField label="Meta Title" htmlFor="seoTitle" helpText="Custom title for Google search results">
                <input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name ? `${name} | National Furniture & Interiors` : ''}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Meta Description" htmlFor="seoDesc" helpText="Summary snippet for search results (max 160 chars)">
                <textarea
                  id="seoDesc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Handcrafted luxury furniture engineered for comfort and lasting elegance..."
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <SectionCard title="Organization">
            <div className="space-y-4">
              <FormField label="Status" htmlFor="status">
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </FormField>

              <FormField label="Product Type" htmlFor="productType">
                <select
                  id="productType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as 'READY_TO_SHIP' | 'MADE_TO_ORDER')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="READY_TO_SHIP">Ready to Ship</option>
                  <option value="MADE_TO_ORDER">Made to Order (Custom)</option>
                </select>
              </FormField>

              <FormField label="Category" htmlFor="category" required>
                <select
                  id="category"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Tags" htmlFor="tags" helpText="Comma-separated keywords">
                <input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="dining, handcrafted, teak, modern"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Storefront Merchandising">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                    Feature on Homepage
                  </span>
                  <p className="text-xs text-gray-500">Highlighted in the curated carousel</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                    Bestseller Badge
                  </span>
                  <p className="text-xs text-gray-500">Display bestseller tag on product card</p>
                </div>
              </label>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}
