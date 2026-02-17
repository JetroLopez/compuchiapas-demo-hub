import React, { useMemo } from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NoProductsFound from './NoProductsFound';
import { searchProducts } from '@/lib/product-search';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface Product {
  id: string;
  clave: string | null;
  name: string;
  category_id: string | null;
  image_url: string | null;
  existencias: number | null;
  costo: number | null;
}

interface ProductWarehouseStock {
  product_id: string;
  warehouse_id: string;
  existencias: number;
}

interface ExhibitedWarehouse {
  warehouse_id: string;
  is_exhibited: boolean;
}

interface WarehouseInfo {
  id: string;
  profit_multiplier: number;
}

interface ProductsListProps {
  searchTerm: string;
  activeCategory: string;
  resetFilters: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ searchTerm, activeCategory, resetFilters }) => {
  const { showPrices } = useStoreSettings();

  // Obtener productos de la base de datos con paginación para superar límite de 1000
  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products'],
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
          .select('id, clave, name, category_id, image_url, existencias, costo')
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allProducts.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allProducts;
    }
  });

  // Obtener stock por almacén con paginación
  const { data: warehouseStock = [] } = useQuery({
    queryKey: ['product-warehouse-stock'],
    queryFn: async (): Promise<ProductWarehouseStock[]> => {
      const allStock: ProductWarehouseStock[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('product_warehouse_stock')
          .select('product_id, warehouse_id, existencias')
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allStock.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allStock;
    },
  });

  // Obtener almacenes exhibidos
  const { data: exhibitedWarehouses = [] } = useQuery({
    queryKey: ['exhibited-warehouses'],
    queryFn: async (): Promise<ExhibitedWarehouse[]> => {
      const { data, error } = await supabase
        .from('exhibited_warehouses')
        .select('warehouse_id, is_exhibited');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener multiplicadores de almacenes
  const { data: warehouseInfos = [] } = useQuery({
    queryKey: ['warehouse-multipliers'],
    queryFn: async (): Promise<WarehouseInfo[]> => {
      const { data, error } = await (supabase
        .from('warehouses')
        .select('id, profit_multiplier') as any);
      
      if (error) throw error;
      return (data || []).map((w: any) => ({
        id: w.id,
        profit_multiplier: w.profit_multiplier ?? 1.20,
      }));
    },
  });

  // Set de IDs de almacenes exhibidos
  const exhibitedWarehouseIds = useMemo(() => {
    return new Set(
      exhibitedWarehouses
        .filter(ew => ew.is_exhibited)
        .map(ew => ew.warehouse_id)
    );
  }, [exhibitedWarehouses]);

  // Build map: warehouseId -> profit_multiplier
  const warehouseMultiplierMap = useMemo(() => {
    const map = new Map<string, number>();
    warehouseInfos.forEach(w => map.set(w.id, w.profit_multiplier));
    return map;
  }, [warehouseInfos]);

  // Build map: productId -> best multiplier (from first exhibited warehouse with stock)
  const productMultiplierMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const ws of warehouseStock) {
      if (exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0 && !map.has(ws.product_id)) {
        map.set(ws.product_id, warehouseMultiplierMap.get(ws.warehouse_id) ?? 1.20);
      }
    }
    return map;
  }, [warehouseStock, exhibitedWarehouseIds, warehouseMultiplierMap]);

  // Filtrar productos según almacenes exhibidos
  const productsInExhibitedWarehouses = useMemo(() => {
    if (exhibitedWarehouseIds.size === 0) {
      return [];
    }

    const productIdsInExhibitedWarehouses = new Set(
      warehouseStock
        .filter(ws => exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0)
        .map(ws => ws.product_id)
    );

    return products.filter(product => productIdsInExhibitedWarehouses.has(product.id));
  }, [products, warehouseStock, exhibitedWarehouseIds]);
  
  // Aplicar filtros adicionales (categoría y búsqueda con ranking por tokens)
  const filteredProducts = useMemo(() => {
    // Filter by category - supports comma-separated multi-category from parent selection
    let categoryFiltered;
    if (activeCategory === 'all') {
      categoryFiltered = productsInExhibitedWarehouses;
    } else if (activeCategory.includes(',')) {
      const categoryIds = activeCategory.split(',');
      categoryFiltered = productsInExhibitedWarehouses.filter(p => p.category_id && categoryIds.includes(p.category_id));
    } else {
      categoryFiltered = productsInExhibitedWarehouses.filter(p => p.category_id === activeCategory);
    }

    // Then apply token-based search with relevance ranking
    const searched = searchProducts(categoryFiltered, searchTerm) as Product[];
    
    // If no search term, sort: products with image first
    if (!searchTerm.trim()) {
      return searched.sort((a, b) => {
        const aHasImg = a.image_url ? 1 : 0;
        const bHasImg = b.image_url ? 1 : 0;
        return bHasImg - aHasImg;
      });
    }
    
    return searched;
  }, [productsInExhibitedWarehouses, activeCategory, searchTerm]);

  const isLoading = isLoadingProducts;
  const error = productsError;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">Error al cargar los productos. Intente nuevamente.</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return <NoProductsFound resetFilters={resetFilters} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-8">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          clave={product.clave}
          name={product.name}
          image={product.image_url || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'}
          existencias={warehouseStock
            .filter(ws => exhibitedWarehouseIds.has(ws.warehouse_id) && ws.product_id === product.id)
            .reduce((sum, ws) => sum + ws.existencias, 0)}
          costo={product.costo}
          categoryId={product.category_id}
          showPrice={showPrices}
          profitMultiplier={productMultiplierMap.get(product.id) ?? 1.20}
          type="product"
        />
      ))}
    </div>
  );
};

export default ProductsList;