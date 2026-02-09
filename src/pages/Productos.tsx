import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductHero from '../components/product/ProductHero';
import CustomQuoteBanner from '../components/product/CustomQuoteBanner';
import ProductFilters from '../components/product/ProductFilters';
import ProductsList from '../components/product/ProductsList';
import CustomPCBuild from '../components/product/CustomPCBuild';
import OrderStatusSearch from '../components/product/OrderStatusSearch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Monitor, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showOrderSearch, setShowOrderSearch] = useState(false);

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
      {/* Desktop Hero - hidden on mobile */}
      <div className="hidden md:block">
        <ProductHero />
      </div>

      {/* Mobile Compact Header */}
      <div className="md:hidden pt-20 pb-3 px-4" style={{ background: 'linear-gradient(to bottom, #1e293b, #1e3a5f)' }}>
        <h1 className="text-[15px] font-bold text-white whitespace-nowrap text-center leading-tight">
          Catálogo de productos en tienda
        </h1>
        <div className="flex items-center justify-center gap-3 mt-3">
          <Link
            to="/productos/arma-tu-pc"
            className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-full border border-white/20 transition-colors"
          >
            <Monitor size={14} />
            Arma tu PC
          </Link>
          <button
            onClick={() => setShowOrderSearch(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-full border border-white/20 transition-colors"
          >
            <Package size={14} />
            Pedidos
          </button>
        </div>
      </div>
      
      {/* Special Banner - hidden on mobile */}
      <section className="py-8 hidden md:block">
        <div className="container-padding max-w-7xl mx-auto space-y-6">
          <CustomQuoteBanner />
          <OrderStatusSearch />
        </div>
      </section>
      
      {/* Product Catalog */}
      <section className="py-4 md:py-12">
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

      {/* Order Search Dialog for mobile */}
      <Dialog open={showOrderSearch} onOpenChange={setShowOrderSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Consulta tu pedido</DialogTitle>
          </DialogHeader>
          <OrderStatusSearch embedded />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Productos;