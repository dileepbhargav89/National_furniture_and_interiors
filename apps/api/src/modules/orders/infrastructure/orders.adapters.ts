import { ICartProvider, IInventoryProvider } from '../application/ports';
import { ICartRepository } from '../../cart/application/ports';
import { IInventoryRepository } from '../../catalog/application/ports';

export class CartProviderAdapter implements ICartProvider {
  constructor(private readonly cartRepo: ICartRepository) {}

  async getUserCart(userId: string): Promise<any> {
    const cart = await this.cartRepo.findByUser(userId);
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepo.findByUser(userId);
    if (cart) {
      await this.cartRepo.markConverted(cart.id);
    }
  }
}

export class CatalogInventoryAdapter implements IInventoryProvider {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async reserveStock(referenceId: string, items: { productId: string; variantId?: string | undefined; quantity: number }[]): Promise<boolean> {
    const reservedInventoryIds: { id: string; quantity: number }[] = [];

    try {
      // Need to sort items to avoid deadlocks during concurrent reservation
      // Sorting by productId + variantId ensures consistent locking order
      const sortedItems = [...items].sort((a, b) => {
        const keyA = a.productId + (a.variantId || '');
        const keyB = b.productId + (b.variantId || '');
        return keyA.localeCompare(keyB);
      });

      for (const item of sortedItems) {
        const inventories = await this.inventoryRepo.findByProduct(item.productId);
        // Find matching variant (or first if no variant specified)
        const inv = inventories.find(i => !item.variantId || i.variantId === item.variantId);
        
        if (!inv) {
          throw new Error(`Inventory not found for product ${item.productId}`);
        }

        const success = await this.inventoryRepo.atomicReserve({
          inventoryId: inv.id,
          quantity: item.quantity,
          referenceType: 'order',
          referenceId
        });

        if (!success) {
           throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        reservedInventoryIds.push({ id: inv.id, quantity: item.quantity });
      }
      return true;
    } catch (e) {
      // Manual Rollback (Saga pattern)
      for (const res of reservedInventoryIds) {
        await this.inventoryRepo.atomicRelease(res.id, res.quantity, referenceId);
      }
      return false; // reserveStock returns false on failure according to tests
    }
  }
}
