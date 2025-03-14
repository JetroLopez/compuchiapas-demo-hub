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
        
        const uniqueCategories = Array.from(new Set(data.map(item => item["LINEA ACT"])));
        const categoryObjects = uniqueCategories.map(category => ({
          id: category.toLowerCase(),
          name: category
        }));
        
        const allCategories = [
          { id: 'all', name: 'Todos' },
          ...categoryObjects
        ];
        
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

  // Fetch products from Supabase
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('Productos')
          .select('*');

        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    enabled: true,
  });

  useEffect(() => {
    document.title = "Productos | Compuchiapas";
  }, []);

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando productos...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Ocurrió un error al cargar los productos.</div>;
  }

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
            products={productsData || []} 
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
