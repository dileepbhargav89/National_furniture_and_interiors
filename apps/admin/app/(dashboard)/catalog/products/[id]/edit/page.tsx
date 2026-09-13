'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { CatalogService, Category, ImageSubdoc, ProductVariant, Product } from '@nfi/api-client';
import { getSpecsForCategory, SpecField } from '@/lib/category-specs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { MediaUploader } from '@/components/catalog/media-uploader';
import { VideoManager, VideoItem } from '@/components/catalog/video-manager';
import { VariantManager } from '@/components/catalog/variant-manager';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  // Form State
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
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [productType, setProductType] = useState<'READY_TO_SHIP' | 'MADE_TO_ORDER'>('READY_TO_SHIP');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Physical Specifications & Materials
  const [primaryMaterial, setPrimaryMaterial] = useState('');
  const [frameMaterial, setFrameMaterial] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [dimLength, setDimLength] = useState('');
  const [dimWidth, setDimWidth] = useState('');
  const [dimHeight, setDimHeight] = useState('');
  const [dimUnit, setDimUnit] = useState('cm');
  const [weightKg, setWeightKg] = useState('');

  // Dynamic specs
  const [specifications, setSpecifications] = useState<Record<string, string | number | boolean>>({});
  const [activeSpecs, setActiveSpecs] = useState<SpecField[]>([]);

  // Media & Variants
  const [images, setImages] = useState<ImageSubdoc[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [finishesInput, setFinishesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Archive modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchCategoriesAndProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchCategoriesAndProduct = async () => {
    try {
      setIsFetching(true);
      setError('');
      const [catRes, prodRes] = await Promise.all([
        CatalogService.listCategories(),
        CatalogService.getProduct(productId),
      ]);

      const fetchedCategories = catRes.data?.items || (Array.isArray(catRes.data) ? catRes.data : []);
      setCategories(fetchedCategories);

      const rawData = prodRes.data as unknown as { product?: Product } & Product;
      const product = rawData?.product || rawData;
      if (product) {
        setName(product.name || '');
        setSku(product.sku || '');
        setBrand(product.brand || 'National Furniture & Interiors');
        setShortDescription(product.shortDescription || '');
        setDescription(product.description || '');
        setPrice(product.basePrice ? (product.basePrice.amount / 100).toString() : '');
        if (product.mrp?.amount) setMrp((product.mrp.amount / 100).toString());
        if (product.taxRate !== undefined) setTaxRate(product.taxRate.toString());
        if (product.taxIncluded !== undefined) setTaxIncluded(product.taxIncluded);

        // Category ID extraction
        const catId = typeof product.categoryId === 'string' ? product.categoryId : (product.categoryId as unknown as { _id?: string })?._id || '';
        setCategoryId(catId);

        setStatus(product.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED');
        setProductType((product.productType as 'READY_TO_SHIP' | 'MADE_TO_ORDER') || 'READY_TO_SHIP');
        setIsFeatured(Boolean(product.isFeatured));
        setIsBestSeller(Boolean(product.isBestSeller));
        setTagsInput(product.tags?.join(', ') || '');

        // Materials & Specs
        setPrimaryMaterial((product as unknown as Record<string, string | undefined>).primaryMaterial || product.material || '');
        setFrameMaterial((product as unknown as Record<string, string | undefined>).frameMaterial || '');
        setCareInstructions(product.careInstructions || '');
        setFinishesInput(product.finishes?.join(', ') || '');
        setColorsInput(product.colors?.join(', ') || '');
        if (product.warranty?.durationMonths) setWarrantyMonths(product.warranty.durationMonths.toString());
        if (product.dimensions) {
          setDimLength(product.dimensions.length?.toString() || '');
          setDimWidth(product.dimensions.width?.toString() || '');
          setDimHeight(product.dimensions.height?.toString() || '');
          setDimUnit(product.dimensions.unit || 'cm');
        }
        if (product.weight) setWeightKg(product.weight.toString());

        setSpecifications((product.specifications as Record<string, string | number | boolean>) || {});
        setImages((product.images as ImageSubdoc[]) || []);
        setVideos((product.videos as VideoItem[]) || []);
        setVariants((product.variants as ProductVariant[]) || []);

        if (product.seo) {
          setSeoTitle(product.seo.title || '');
          setSeoDescription(product.seo.description || '');
        }

        // Initialize category specs
        if (catId) {
          const category = fetchedCategories.find((c) => (c.id || c._id) === catId);
          if (category) {
            setActiveSpecs(getSpecsForCategory(category.slug || category.name));
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product data');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (categoryId && !isFetching) {
      const category = categories.find((c) => (c.id || c._id) === categoryId);
      if (category) {
        setActiveSpecs(getSpecsForCategory(category.slug || category.name));
      }
    } else if (!isFetching) {
      setActiveSpecs([]);
    }
  }, [categoryId, categories, isFetching]);

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

      await CatalogService.adminUpdateProduct(productId, payload);
      router.push('/catalog/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await CatalogService.adminArchiveProduct(productId);
      setIsArchiveModalOpen(false);
      router.push('/catalog/products');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive product');
      setIsArchiving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--nfi-primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Loading product specifications…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <PageHeader
        title={`Edit: ${name || 'Product'}`}
        description={`Modify product specifications, media assets, variants, and pricing (SKU: ${sku}).`}
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Products', href: '/catalog/products' },
          { label: name || 'Edit' },
        ]}
        action={
          <div className="flex gap-3">
            <Link href={`/catalog/products/${productId}`}>
              <NfiButton type="button" variant="secondary" size="sm">
                View Detail
              </NfiButton>
            </Link>
            <NfiButton type="submit" variant="primary" size="sm" loading={isLoading}>
              Save Changes
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
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="SKU" htmlFor="sku" required>
                  <input
                    id="sku"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Brand / Line" htmlFor="brand">
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
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Pricing & GST */}
          <SectionCard title="Pricing & GST">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Selling Price (₹)" htmlFor="price" required>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="MRP (₹)" htmlFor="mrp" helpText="Original strikethrough price">
                <input
                  id="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
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
              maxFiles={10}
              ownerType="PRODUCT"
              ownerId={productId}
              label="Gallery Images"
              helpText="Upload and manage product photos. First image marked Primary appears as catalog cover."
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
                    className={inputClassName}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Frame / Leg Material" htmlFor="fMat">
                  <input
                    id="fMat"
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
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

          {/* Dynamic Specs */}
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

          {/* SEO */}
          <SectionCard title="SEO & Meta Information">
            <div className="space-y-4">
              <FormField label="Meta Title" htmlFor="seoTitle">
                <input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Meta Description" htmlFor="seoDesc">
                <textarea
                  id="seoDesc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
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
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
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
                  <option value="MADE_TO_ORDER">Made to Order</option>
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

              <FormField label="Tags" htmlFor="tags" helpText="Comma-separated">
                <input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
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
                  <p className="text-xs text-gray-500">Highlighted in catalog showcase</p>
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
                  <p className="text-xs text-gray-500">Display bestseller tag on product</p>
                </div>
              </label>
            </div>
          </SectionCard>

          {/* Danger Zone */}
          <SectionCard title="Danger Zone">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Archiving removes this product from customer searches and storefront listings.
              </p>
              <NfiButton
                type="button"
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => setIsArchiveModalOpen(true)}
              >
                Archive Product
              </NfiButton>
            </div>
          </SectionCard>
        </div>
      </div>

      {isArchiveModalOpen && (
        <ConfirmModal
          open={isArchiveModalOpen}
          title="Archive Product"
          description={`Are you sure you want to archive "${name}"? This action can be undone by changing status back to Published.`}
          confirmLabel="Archive"
          variant="danger"
          loading={isArchiving}
          onConfirm={handleArchive}
          onCancel={() => setIsArchiveModalOpen(false)}
        />
      )}
    </form>
  );
}
