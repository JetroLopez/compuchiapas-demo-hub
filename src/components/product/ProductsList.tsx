
import React from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';

interface ProductSpec {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  specs: string[];
}

interface ProductsListProps {
  products: ProductSpec[];
}

// This function will be used to fetch products from Supabase once integrated
const fetchProductsFromSupabase = async (): Promise<ProductSpec[]> => {
  // This would be replaced with actual Supabase client call
  // Example: const { data, error } = await supabase.from('products').select('*')
  // For now, we'll simulate by returning the current products
  
  // Temporary implementation until Supabase is connected
  console.log('Fetching products data (simulated)');
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Import products from local data (this would be replaced by Supabase data)
      import('../../data/products').then(({ products }) => {
        resolve(products);
      });
    }, 500);
  });
};

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  // This query can be enabled/used once Supabase is connected
  const { data: supabaseProducts, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsFromSupabase,
    enabled: false, // Disabled until Supabase is connected
  });

  // We'll continue using the props.products for now
  // But the component is ready to switch to supabaseProducts when available
  const displayProducts = products;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {isLoading ? (
        // Placeholder loading state for when we fetch from Supabase
        <p className="col-span-full text-center py-10">Cargando productos...</p>
      ) : (
        displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
            specs={product.specs}
          />
        ))
      )}
    </div>
  );
};

export default ProductsList;
