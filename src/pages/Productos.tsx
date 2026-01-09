import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductHero from '../components/product/ProductHero';
import CustomQuoteBanner from '../components/product/CustomQuoteBanner';
import ProductFilters from '../components/product/ProductFilters';
import ProductsList from '../components/product/ProductsList';
import CustomPCBuild from '../components/product/CustomPCBuild';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  display_order: number;
}

const Productos: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoria') || 'all';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener categorías de la base de datos
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, display_order')
        .order('display_order', { ascending: true });
        
      if (error) {
        console.error('Error fetching categories:', error);
        return [{ id: 'all', name: 'Todos', display_order: 0 }];
      }
      
      return data || [{ id: 'all', name: 'Todos', display_order: 0 }];
    }
  });

  useEffect(() => {
    document.title = "Productos | Compuchiapas";
  }, []);

  // Update URL when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', activeCategory);
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeCategory, searchParams, setSearchParams]);

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  return (
    <Layout>
      <ProductHero />
      
      {/* Special Banner */}
      <section className="py-8">
        <div className="container-padding max-w-7xl mx-auto">
          <CustomQuoteBanner />
        </div>
      </section>
      
      {/* Product Catalog */}
      <section className="py-12">
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
            searchTerm={searchTerm}
            activeCategory={activeCategory}
            resetFilters={resetFilters}
          />
        </div>
      </section>
      
      {/* Custom Builds CTA */}
      <section className="py-12 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <CustomPCBuild />
        </div>
      </section>
    </Layout>
  );
};

export default Productos;