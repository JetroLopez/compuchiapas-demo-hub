import React from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NoProductsFound from './NoProductsFound';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  price: string;
  price_numeric: number | null;
  category_id: string | null;
  image_url: string | null;
  specs: string[];
  description: string | null;
  stock: number | null;
  is_featured: boolean;
}

interface ProductsListProps {
  searchTerm: string;
  activeCategory: string;
  resetFilters: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ searchTerm, activeCategory, resetFilters }) => {
  // Obtener productos de la base de datos
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Aplicar filtros
  const filteredProducts = products.filter(product => {
    // Filtrar por categoría
    const categoryMatch = activeCategory === 'all' || product.category_id === activeCategory;
    
    // Filtrar por término de búsqueda
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      product.name.toLowerCase().includes(searchLower) || 
      product.specs.some(spec => spec.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower));
    
    return categoryMatch && searchMatch;
  });

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
          name={product.name}
          price={product.price}
          image={product.image_url || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'}
          specs={product.specs}
          stock={product.stock ?? undefined}
        />
      ))}
    </div>
  );
};

export default ProductsList;