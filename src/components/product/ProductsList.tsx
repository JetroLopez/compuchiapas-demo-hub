
import React from 'react';
import ProductCard from '../ProductCard';

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

const ProductsList: React.FC<ProductsListProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          specs={product.specs}
        />
      ))}
    </div>
  );
};

export default ProductsList;
