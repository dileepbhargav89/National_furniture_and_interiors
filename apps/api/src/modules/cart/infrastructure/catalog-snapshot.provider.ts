// Product snapshot provider — cross-module bridge from Cart to Catalog.
// docs/06 §1.6 / §4.3: Cart reads Catalog data through an exported interface only, never by
// importing Catalog's infrastructure or domain layer directly.
import type { IProductSnapshotProvider } from '../application/ports';
import type { IProductRepository, IInventoryRepository } from '../../catalog/application/ports';

export class CatalogProductSnapshotProvider implements IProductSnapshotProvider {
  constructor(
    private readonly products: IProductRepository,
    private readonly inventory: IInventoryRepository,
  ) {}

  async getSnapshot(
    productId: string,
    variantId: string,
  ): Promise<{
    sku: string;
    name: string;
    image: string;
    unitPrice: number;
    isAvailable: boolean;
  } | null> {
    const product = await this.products.findById(productId);
    if (!product || product.status !== 'PUBLISHED') return null;

    const variant = product.variants.find((v) => v.variantId === variantId);
    if (!variant || !variant.isActive) {
      if (product.variants.length === 0 || variantId === productId) {
        const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
        return {
          sku: product.sku,
          name: product.name,
          image: primaryImage?.url ?? '',
          unitPrice: product.basePrice.amount,
          isAvailable: true,
        };
      }
      return null;
    }

    const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
    const effectivePrice = variant.priceOverride ?? product.basePrice;

    // Check stock availability across all warehouses for this variant.
    const inventoryRecords = await this.inventory.findByProduct(productId);
    const variantInventory = inventoryRecords.filter((inv) => inv.variantId === variantId);
    const totalAvailable = variantInventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

    return {
      sku: variant.sku,
      name: product.name,
      image: primaryImage?.url ?? '',
      unitPrice: effectivePrice.amount,
      isAvailable: totalAvailable > 0,
    };
  }
}
