import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ShoppingCart, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { searchProducts } from '@/lib/product-search';
import { calculatePrice, formatPrice } from '@/lib/price-utils';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  clave: string | null;
  image_url: string | null;
  costo: number | null;
  category_id: string | null;
  existencias: number | null;
}

interface GlobalSearchDropdownProps {
  isScrolled: boolean;
}

const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({ isScrolled }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showPrices } = useStoreSettings();

  // Fetch all products for search
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['global-search-products'],
    queryFn: async (): Promise<Product[]> => {
      const allProducts: Product[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('products')
          .select('id, name, clave, image_url, costo, category_id, existencias')
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allProducts;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(products, query).slice(0, 8);
  }, [products, query]);

  const showDropdown = isFocused && query.trim().length >= 2;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNavigateToProducts = () => {
    navigate(`/productos?buscar=${encodeURIComponent(query)}`);
    setIsFocused(false);
    setQuery('');
  };

  const handleProductClick = (product: Product) => {
    // Navigate to products with search for that specific item
    navigate(`/productos?buscar=${encodeURIComponent(product.name)}`);
    setIsFocused(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="hidden md:flex flex-1 max-w-sm mx-4 relative">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className={cn(
            "transition-colors",
            isScrolled ? "text-muted-foreground" : "text-white/60"
          )} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar en tienda"
          className={cn(
            "w-full pl-9 pr-3 py-2 rounded-full text-sm transition-all duration-300 focus:outline-none focus:ring-2",
            isScrolled
              ? "bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              : "bg-white/15 border border-white/20 text-white placeholder:text-white/60 focus:ring-white/40 focus:bg-white/20"
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleNavigateToProducts();
            }
            if (e.key === 'Escape') {
              setIsFocused(false);
              inputRef.current?.blur();
            }
          }}
        />
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-[60] max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados para "{query}"
            </div>
          ) : (
            <>
              {results.map((product) => {
                const price = calculatePrice(product.costo, product.category_id);
                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left border-b border-border/50 last:border-b-0"
                  >
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=100&q=60'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 text-foreground">{product.name}</p>
                      {product.clave && (
                        <p className="text-xs text-muted-foreground">Clave: {product.clave}</p>
                      )}
                    </div>
                    {showPrices && price > 0 && (
                      <span className="text-sm font-bold text-primary flex-shrink-0">{formatPrice(price)}</span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleNavigateToProducts}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-accent transition-colors"
              >
                <ExternalLink size={14} />
                Ver todos los resultados
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchDropdown;
