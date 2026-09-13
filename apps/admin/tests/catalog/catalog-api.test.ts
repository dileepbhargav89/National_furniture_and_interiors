import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService, apiClient, ApiResponse } from '@nfi/api-client';

describe('CatalogService API Client Integration Harness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product Management', () => {
    it('adminArchiveProduct should call DELETE /api/v1/admin/products/:id', async () => {
      const mockResponse: ApiResponse<{ message: string }> = { success: true, data: { message: 'Product archived' } };
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(mockResponse as never);

      const res = await CatalogService.adminArchiveProduct('prod-123');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/admin/products/prod-123');
      expect(res).toEqual(mockResponse);
    });

    it('adminAdjustInventory should call POST /api/v1/admin/inventory/adjust with delta payload', async () => {
      const mockResponse = { status: 'success', data: { updatedStock: 25 } };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse as never);

      const payload = {
        productId: 'prod-456',
        variantId: 'DEFAULT',
        quantityDelta: 10,
        note: '[RESTOCK] Shipment received',
      };

      const res = await CatalogService.adminAdjustInventory(payload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/inventory/adjust', payload);
      expect(res).toEqual(mockResponse);
    });
  });

  describe('Category Architecture', () => {
    it('adminCreateCategory should call POST /api/v1/admin/categories with payload', async () => {
      const mockResponse = { status: 'success', data: { category: { id: 'cat-new' } } };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse as never);

      const payload = {
        name: 'Dining Tables',
        slug: 'dining-tables',
        parentId: 'cat-dining',
        sortOrder: 1,
        level: 1,
        isActive: true,
      };

      const res = await CatalogService.adminCreateCategory(payload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/categories', payload);
      expect(res).toEqual(mockResponse);
    });

    it('adminDeleteCategory should call DELETE /api/v1/admin/categories/:id', async () => {
      const mockResponse = { status: 'success', data: { message: 'Category deleted' } };
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(mockResponse as never);

      const res = await CatalogService.adminDeleteCategory('cat-del-789');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/admin/categories/cat-del-789');
      expect(res).toEqual(mockResponse);
    });
  });

  describe('Curated Collections', () => {
    it('adminCreateCollection should call POST /api/v1/admin/collections with selected products', async () => {
      const mockResponse = { status: 'success', data: { collection: { id: 'col-summer' } } };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse as never);

      const payload = {
        title: 'Summer Teak Collection',
        slug: 'summer-teak',
        productIds: ['prod-1', 'prod-2'],
        isActive: true,
      };

      const res = await CatalogService.adminCreateCollection(payload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/collections', payload);
      expect(res).toEqual(mockResponse);
    });
  });
});
