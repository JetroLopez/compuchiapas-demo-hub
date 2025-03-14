
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
  
  // Define predefined categories matching the LINEA ACT from Supabase
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos' },
    { id: 'accesorios', name: 'Accesorios' },
    { id: 'almacenamiento', name: 'Almacenamiento' },
    { id: 'cargadores', name: 'Cargadores' },
    { id: 'computadoras', name: 'Computadoras' },
    { id: 'consumibles', name: 'Consumibles' },
    { id: 'digitales', name: 'Digitales' },
    { id: 'energia', name: 'Energía' },
    { id: 'impresoras', name: 'Impresoras' },
    { id: 'laptops', name: 'Laptops' },
    { id: 'mobiliario', name: 'Mobiliario' },
    { id: 'monitores', name: 'Monitores' },
    { id: 'punto de venta', name: 'Punto de venta' },
    { id: 'redes', name: 'Redes' }
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
          .select('*')
          .order('LINEA ACT');
          
        if (error) {
          console.error('Error fetching categories:', error);
          throw error;
        }
        
        console.log('Categories data from Supabase:', data);
        
        // Get unique categories
        const uniqueCategories = Array.from(new Set(data.map(item => item["LINEA ACT"])));
        
        console.log('Unique categories:', uniqueCategories);
        
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
        
        console.log('All categories:', allCategories);
        
        // Only update categories if we found some
        if (categoryObjects.length > 0) {
          setCategories(allCategories);
        }
        
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
