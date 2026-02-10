import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  type: 'product' | 'promotion';
  name: string;
  image_url: string | null;
  quantity: number;
  price: number | null;
  maxStock: number;
  clave: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, openSidebar?: boolean) => void;
  removeItem: (id: string, type: 'product' | 'promotion') => void;
  updateQuantity: (id: string, type: 'product' | 'promotion', quantity: number) => void;
  getItemQuantity: (id: string, type: 'product' | 'promotion') => number;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number | null;
  requiresQuote: boolean;
  lastAddedAt: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'compuchiapas_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, openSidebar = true) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.id === newItem.id && item.type === newItem.type
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        if (currentQty < newItem.maxStock) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: currentQty + 1
          };
        }
        return updated;
      }
      
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setLastAddedAt(Date.now());
    if (openSidebar) {
      setIsOpen(true);
    }
  }, []);

  const removeItem = useCallback((id: string, type: 'product' | 'promotion') => {
    setItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
  }, []);

  const updateQuantity = useCallback((id: string, type: 'product' | 'promotion', quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, type);
      return;
    }
    
    setItems(prev => {
      const updated = [...prev];
      const index = updated.findIndex(item => item.id === id && item.type === type);
      if (index >= 0) {
        const maxStock = updated[index].maxStock;
        updated[index] = {
          ...updated[index],
          quantity: Math.min(quantity, maxStock)
        };
      }
      return updated;
    });
  }, [removeItem]);

  const getItemQuantity = useCallback((id: string, type: 'product' | 'promotion') => {
    const item = items.find(i => i.id === id && i.type === type);
    return item?.quantity || 0;
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Check if any item has no price
  const requiresQuote = items.some(item => item.price === null || item.price === 0);

  // Calculate subtotal only if all items have prices
  const subtotal = requiresQuote 
    ? null 
    : items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        totalItems,
        subtotal,
        requiresQuote,
        lastAddedAt
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
