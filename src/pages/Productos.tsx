
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductHero from '../components/product/ProductHero';
import CustomQuoteBanner from '../components/product/CustomQuoteBanner';
import ProductFilters from '../components/product/ProductFilters';
import ProductsList from '../components/product/ProductsList';
import NoProductsFound from '../components/product/NoProductsFound';
import CustomPCBuild from '../components/product/CustomPCBuild';
import { categories, products } from '../data/products';

const Productos: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Para el SEO
    document.title = "Productos | Compuchiapas";
  }, []);

  // Filtro de productos por categoría y búsqueda
  const filteredProducts = products.filter(product => {
    // Filtrar por categoría
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    
    // Filtrar por término de búsqueda
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       product.specs.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  return (
    <Layout>
      <ProductHero />
      
      {/* Special Banner */}
      <section className="py-12">
        <div className="container-padding max-w-7xl mx-auto">
          <CustomQuoteBanner />
        </div>
      </section>
      
      {/* Product Catalog */}
      <section className="py-16">
        <div className="container-padding max-w-7xl mx-auto">
          {/* Search and Filter */}
          <ProductFilters 
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          
          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <ProductsList products={filteredProducts} />
          ) : (
            <NoProductsFound resetFilters={resetFilters} />
          )}
        </div>
      </section>
      
      {/* Custom Builds CTA */}
      <section className="py-16 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <CustomPCBuild />
        </div>
      </section>
    </Layout>
  );
};

export default Productos;
