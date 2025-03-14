
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductHero from '../components/product/ProductHero';
import CustomQuoteBanner from '../components/product/CustomQuoteBanner';
import ProductFilters from '../components/product/ProductFilters';
import ProductsList from '../components/product/ProductsList';
import NoProductsFound from '../components/product/NoProductsFound';
import CustomPCBuild from '../components/product/CustomPCBuild';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Productos: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos' },
    { id: 'laptops', name: 'Laptops' },
    { id: 'desktops', name: 'Computadoras' },
    { id: 'components', name: 'Componentes' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'printers', name: 'Impresoras' },
    { id: 'network', name: 'Redes' },
    { id: 'consumables', name: 'Consumibles' }
  ]);
  
  // Empty products array as a fallback
  const products = [];
  
  // Fetch categories from Supabase
  const { data: supabaseCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('Productos')
          .select('LINEA_ACT')
          .order('LINEA_ACT');
          
        if (error) throw error;
        
        // Get unique categories
        const uniqueCategories = Array.from(new Set(data.map(item => item.LINEA_ACT)));
        
        // Map to category objects
        const categoryObjects = uniqueCategories.map(category => ({
          id: category.toLowerCase(),
          name: category
        }));
        
        // Add 'all' category at the beginning
        const allCategories = [
          { id: 'all', name: 'Todos' },
          ...categoryObjects
        ];
        
        setCategories(allCategories);
        return allCategories;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return categories;
      }
    },
    enabled: true
  });
  
  useEffect(() => {
    // Para el SEO
    document.title = "Productos | Compuchiapas";
  }, []);

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  // No need to directly filter products here, as filtering happens in the ProductsList component

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
          <ProductsList 
            products={products} 
            searchTerm={searchTerm}
            activeCategory={activeCategory}
          />
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
