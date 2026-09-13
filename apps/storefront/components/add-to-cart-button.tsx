'use client';

import { useState } from 'react';
import { Button } from '@nfi/ui';
import { useCart } from '../context/cart-context';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
}

export function AddToCartButton({ productId, variantId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await addItem({
        productId,
        variantId,
        quantity: 1
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button 
      className="w-full py-6 text-lg rounded-none bg-black hover:bg-gray-800 text-white shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
      onClick={handleAddToCart}
      disabled={isAdding}
    >
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
