import React from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import NoProductsFound from './NoProductsFound';

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
  resetFilters: () => void;
}

// Esta función obtiene productos de Supabase
const fetchProductsFromSupabase = async (): Promise<ProductSpec[]> => {
  console.log('Fetching products from Supabase');
  
  try {
    const { data, error } = await supabase
      .from('Productos')
      .select('*');
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }
    
    console.log('Products data from Supabase:', data);
    
    if (!data || data.length === 0) {
      console.log('No products found in Supabase');
      return [];
    }
    
    // Mapear datos de Supabase a nuestra interfaz ProductSpec
    const mappedProducts = data.map((item, index) => {
      // No usamos precio ahora
      const price = '';
      
      // Simplificamos las especificaciones, solo usamos la categoría
      const specs = [`Marca: ${item["LINEA ACT"] || 'No especificada'}`];
      
      // Obtener imagen de placeholder - en una app real, tendrías URLs de imágenes en tu base de datos
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
        category: item["LINEA ACT"].toLowerCase(),
        image: randomImage,
        specs: specs,
        sku: item.Clave,
        stock: item.Existencias
      };
    });
    
    console.log('Mapped products:', mappedProducts);
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

const ProductsList: React.FC<ProductsListProps> = ({ products, searchTerm, activeCategory, resetFilters }) => {
  // Obtener productos de Supabase
  const { data: supabaseProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsFromSupabase,
    // Activamos la consulta ya que Supabase está conectado
    enabled: true,
  });
  
  console.log('Query state:', { isLoading, error, productCount: supabaseProducts?.length || 0 });
  
  // Usar productos de Supabase si están disponibles, de lo contrario usar los props.products como respaldo
  const displayProducts = supabaseProducts || products;
  
  // Aplicar filtros a los productos a mostrar (esto funciona tanto para datos de Supabase como para datos locales)
  const filteredProducts = displayProducts.filter(product => {
    // Filtrar por categoría
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    
    // Filtrar por término de búsqueda
    const searchMatch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.specs.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  console.log('Filtered products:', filteredProducts.length);

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
        <p className="text-sm mt-2">Error: {error.message}</p>
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
