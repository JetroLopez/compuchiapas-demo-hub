import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface CartButtonProps {
  mobile?: boolean;
}

const CartButton: React.FC<CartButtonProps> = ({ mobile = false }) => {
  const { setIsOpen, totalItems } = useCart();

  const hasItems = totalItems > 0;

  if (mobile) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={`relative h-9 w-9 rounded-full backdrop-blur-sm shadow-lg border-border ${
          hasItems
            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
            : 'bg-background/80'
        }`}
        aria-label="Abrir carrito"
      >
        <ShoppingCart size={14} />
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsOpen(true)}
      className={`fixed top-24 right-16 z-40 rounded-full backdrop-blur-sm shadow-lg border-border ${
        hasItems
          ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
          : 'bg-background/80'
      }`}
      aria-label="Abrir carrito"
    >
      <ShoppingCart size={18} />
      {hasItems && (
        <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
};

export default CartButton;
