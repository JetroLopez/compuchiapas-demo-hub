import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface CartButtonProps {
  mobile?: boolean;
}

const CartButton: React.FC<CartButtonProps> = ({ mobile = false }) => {
  const { setIsOpen, totalItems, lastAddedAt } = useCart();
  const [blinking, setBlinking] = useState(false);

  const hasItems = totalItems > 0;

  // Trigger blink animation when item is added
  useEffect(() => {
    if (lastAddedAt > 0 && hasItems) {
      setBlinking(true);
      const timeout = setTimeout(() => setBlinking(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [lastAddedAt, hasItems]);

  if (mobile) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`relative rounded-full shadow-lg transition-transform duration-300 p-4 ${
          hasItems
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'bg-background/80 backdrop-blur-sm border border-border text-foreground'
        } ${blinking ? 'animate-cart-blink' : ''}`}
        aria-label="Abrir carrito"
      >
        <ShoppingCart size={28} />
        {hasItems && (
          <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
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
