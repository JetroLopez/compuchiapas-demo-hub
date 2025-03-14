
import React from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ProductSpec {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  specs: string[];
  sku?: string;
  stock?: number;
}

interface ProductsListProps {
  products: ProductSpec[];
  searchTerm: string;
  activeCategory: string;
}

// This function fetches products from Supabase
const fetchProductsFromSupabase = async (): Promise<ProductSpec[]> => {
  console.log('Fetching products from Supabase');
  
  try {
    const { data, error } = await supabase
      .from('Productos')
      .select('Clave, Descripcion, LINEA_ACT, Linea, Existencias');
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }
    
    // Map Supabase data to our ProductSpec interface
    const mappedProducts = data.map((item, index) => {
      // Generate a placeholder price (this would typically come from your database)
      const price = `$${Math.floor(Math.random() * 15000 + 500)} MXN`;
      
      // Generate placeholder specs
      const specs = [
        `Marca: ${item.Linea || 'Genérica'}`,
        'Calidad: Excelente',
        'Garantía: 1 año'
      ];
      
      // Get placeholder image - in a real app, you would have image URLs in your database
      const imagePool = [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
        'https://images.unsplash.com/photo-1527219525722-f9767a7f2884'
      ];
      
      const randomImage = imagePool[index % imagePool.length] + '?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
      
      return {
        id: index + 1,
        name: item.Descripcion,
        price: price,
        category: item.LINEA_ACT.toLowerCase(),
        image: randomImage,
        specs: specs,
        sku: item.Clave,
        stock: item.Existencias
      };
    });
    
    return mappedProducts;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    toast({
      title: "Error",
      description: "No se pudieron cargar los productos. Intente nuevamente más tarde.",
      variant: "destructive"
    });
    return [];
  }
};

const ProductsList: React.FC<ProductsListProps> = ({ products, searchTerm, activeCategory }) => {
  // Fetch products from Supabase
  const { data: supabaseProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsFromSupabase,
    // Now we enable the query since Supabase is connected
    enabled: true,
  });
  
  // Use Supabase products if available, otherwise use the props.products as fallback
  const displayProducts = supabaseProducts || products;
  
  // Apply filters to the display products (this now works for both Supabase and local data)
  const filteredProducts = displayProducts.filter(product => {
    // Filter by category
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    
    // Filter by search term
    const searchMatch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.specs.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  if (isLoading) {
    return (
      <div className="col-span-full text-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-tech-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full text-center py-16 text-red-600">
        <p>Ocurrió un error al cargar los productos. Por favor, intente nuevamente.</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="col-span-full text-center py-16">
        <p className="text-xl text-gray-600">No se encontraron productos que coincidan con tu búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          specs={product.specs}
          sku={product.sku}
          stock={product.stock}
        />
      ))}
    </div>
  );
};

export default ProductsList;
