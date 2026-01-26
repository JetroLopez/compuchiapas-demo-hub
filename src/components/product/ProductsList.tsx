import React, { useMemo } from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NoProductsFound from './NoProductsFound';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ProductsListProps {
  searchTerm: string;
  activeCategory: string;
  resetFilters: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ searchTerm, activeCategory, resetFilters }) => {
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

  // Set de IDs de almacenes exhibidos
  const exhibitedWarehouseIds = useMemo(() => {
    return new Set(
      exhibitedWarehouses
        .filter(ew => ew.is_exhibited)
        .map(ew => ew.warehouse_id)
    );
  }, [exhibitedWarehouses]);

  // Filtrar productos según almacenes exhibidos
  const productsInExhibitedWarehouses = useMemo(() => {
    // Si no hay almacenes exhibidos configurados, no mostrar productos
    if (exhibitedWarehouseIds.size === 0) {
      return [];
    }

    // Obtener IDs de productos que tienen stock en almacenes exhibidos
    const productIdsInExhibitedWarehouses = new Set(
      warehouseStock
        .filter(ws => exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0)
        .map(ws => ws.product_id)
    );

    return products.filter(product => productIdsInExhibitedWarehouses.has(product.id));
  }, [products, warehouseStock, exhibitedWarehouseIds]);
  
  // Aplicar filtros adicionales (categoría y búsqueda)
  const filteredProducts = productsInExhibitedWarehouses.filter(product => {
    // Filtrar por categoría
    const categoryMatch = activeCategory === 'all' || product.category_id === activeCategory;
    
    // Filtrar por término de búsqueda
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      product.name.toLowerCase().includes(searchLower) || 
      (product.clave && product.clave.toLowerCase().includes(searchLower));
    
    return categoryMatch && searchMatch;
  });

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          clave={product.clave}
          name={product.name}
          image={product.image_url || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'}
          existencias={product.existencias ?? 0}
          costo={product.costo}
          categoryId={product.category_id}
        />
      ))}
    </div>
  );
};

export default ProductsList;