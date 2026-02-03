import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import { formatPrice } from '@/lib/price-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import CartCheckout from './CartCheckout';
import CartOrderConfirmation from './CartOrderConfirmation';

interface OrderResult {
  orderNumber: number;
  deliveryMethod: 'pickup' | 'delivery' | null;
  paymentMethod: 'cash' | 'transfer';
}

const CartSidebar: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal, requiresQuote, totalItems } = useCart();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const handleCheckout = () => {
    setCheckoutStep('checkout');
  };

  const handleOrderComplete = (result: OrderResult) => {
    setOrderResult(result);
    setCheckoutStep('confirmation');
  };

  const handleBack = () => {
    setCheckoutStep('cart');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset to cart view after closing
    setTimeout(() => {
      setCheckoutStep('cart');
      setOrderResult(null);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart size={20} />
              {checkoutStep === 'cart' && `Carrito (${totalItems})`}
              {checkoutStep === 'checkout' && 'Finalizar Pedido'}
              {checkoutStep === 'confirmation' && 'Pedido Confirmado'}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X size={18} />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {checkoutStep === 'cart' && (
            <div className="flex flex-col h-full">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <ShoppingCart size={48} className="mb-4 opacity-50" />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <img
                            src={item.image_url || '/placeholder.svg'}
                            alt=""
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                            {item.clave && (
                              <p className="text-xs text-muted-foreground">Clave: {item.clave}</p>
                            )}
                            {item.price && item.price > 0 ? (
                              <p className="text-sm font-semibold text-primary mt-1">
                                {formatPrice(item.price)}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">Sin precio</p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                              >
                                <Minus size={14} />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive ml-auto"
                                onClick={() => removeItem(item.id, item.type)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4 space-y-4">
                    {requiresQuote ? (
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm mb-2">
                          Algunos productos requieren cotización
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Subtotal:</span>
                        <span>{formatPrice(subtotal || 0)}</span>
                      </div>
                    )}
                    
                    <Button className="w-full" size="lg" onClick={handleCheckout}>
                      {requiresQuote ? 'Cotizar por WhatsApp' : 'Comprar ahora'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {checkoutStep === 'checkout' && (
            <CartCheckout 
              onBack={handleBack} 
              onOrderComplete={handleOrderComplete}
              requiresQuote={requiresQuote}
            />
          )}

          {checkoutStep === 'confirmation' && orderResult && (
            <CartOrderConfirmation
              orderNumber={orderResult.orderNumber}
              deliveryMethod={orderResult.deliveryMethod}
              paymentMethod={orderResult.paymentMethod}
              onClose={handleClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
