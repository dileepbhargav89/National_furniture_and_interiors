import type { Db, Migration } from './types';

export const migration: Migration = {
  id: '0014',
  description: 'Add extended fields to catalog products',
  category: 'backfill',

  async apply(db: Db): Promise<void> {
    console.log('Running migration 0014: Add extended fields to catalog products');
    const productsCollection = db.collection('products');
    
    // Set default productType and ensure arrays exist
    const result = await productsCollection.updateMany(
      { productType: { $exists: false } },
      {
        $set: {
          productType: 'READY_TO_SHIP',
          finishes: [],
          colors: [],
          documents: [],
          taxIncluded: false,
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} products with default extended fields.`);
  },


  async verify(db: Db): Promise<void> {
    console.log('Verifying migration 0014: Add extended fields to catalog products');
    const productsCollection = db.collection('products');
    const missing = await productsCollection.countDocuments({ productType: { $exists: false } });
    if (missing > 0) {
      throw new Error(`[0014] Verification failed: ${missing} products missing productType`);
    }
  },
};
