import React from 'react';
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
}

interface ProductWarehouseStock {
  product_id: string;
  warehouse_id: string;
  existencias: number;
}

interface ProductsListProps {
  searchTerm: string;
  activeCategory: string;
  activeWarehouse?: string;
  resetFilters: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ 
  searchTerm, 
  activeCategory, 
  activeWarehouse = 'all',
  resetFilters 
}) => {
  // Obtener productos de la base de datos
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, clave, name, category_id, image_url, existencias')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Obtener stock por almacén
  const { data: warehouseStock = [] } = useQuery({
    queryKey: ['product-warehouse-stock'],
    queryFn: async (): Promise<ProductWarehouseStock[]> => {
      const { data, error } = await supabase
        .from('product_warehouse_stock')
        .select('product_id, warehouse_id, existencias');
        
      if (error) {
        console.error('Error fetching warehouse stock:', error);
        return [];
      }
      
      return data || [];
    }
  });

  // Crear mapa de stock por producto y almacén
  const stockByProductWarehouse = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    warehouseStock.forEach((stock) => {
      if (!map.has(stock.product_id)) {
        map.set(stock.product_id, new Map());
      }
      map.get(stock.product_id)!.set(stock.warehouse_id, stock.existencias);
    });
    return map;
  }, [warehouseStock]);

  // Calcular existencias totales por producto (suma de todos los almacenes)
  const totalStockByProduct = React.useMemo(() => {
    const map = new Map<string, number>();
    stockByProductWarehouse.forEach((warehouseMap, productId) => {
      let total = 0;
      warehouseMap.forEach((existencias) => {
        total += existencias;
      });
      map.set(productId, total);
    });
    return map;
  }, [stockByProductWarehouse]);
  
  // Aplicar filtros
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Filtrar por categoría
      const categoryMatch = activeCategory === 'all' || product.category_id === activeCategory;
      
      // Filtrar por término de búsqueda
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = 
        product.name.toLowerCase().includes(searchLower) || 
        (product.clave && product.clave.toLowerCase().includes(searchLower));
      
      // Filtrar por almacén
      let warehouseMatch = true;
      if (activeWarehouse !== 'all') {
        const productWarehouseStock = stockByProductWarehouse.get(product.id);
        if (productWarehouseStock) {
          const stockInWarehouse = productWarehouseStock.get(activeWarehouse) || 0;
          warehouseMatch = stockInWarehouse > 0;
        } else {
          warehouseMatch = false;
        }
      }
      
      return categoryMatch && searchMatch && warehouseMatch;
    });
  }, [products, activeCategory, searchTerm, activeWarehouse, stockByProductWarehouse]);

  // Función para obtener las existencias a mostrar
  const getDisplayExistencias = (productId: string): number => {
    if (activeWarehouse !== 'all') {
      // Mostrar solo las existencias del almacén seleccionado
      const productWarehouseStock = stockByProductWarehouse.get(productId);
      if (productWarehouseStock) {
        return productWarehouseStock.get(activeWarehouse) || 0;
      }
      return 0;
    }
    // Mostrar existencias totales
    return totalStockByProduct.get(productId) || 0;
  };

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
          existencias={getDisplayExistencias(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductsList;
