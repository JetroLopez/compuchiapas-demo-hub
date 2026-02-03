import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

const CartButton: React.FC = () => {
  const { setIsOpen, totalItems } = useCart();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsOpen(true)}
      className="fixed top-24 right-16 z-40 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border"
      aria-label="Abrir carrito"
    >
      <ShoppingCart size={18} />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
};

export default CartButton;
