import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductHero from '../components/product/ProductHero';
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
  const initialSearch = searchParams.get('buscar') || '';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [showOrderSearch, setShowOrderSearch] = useState(searchParams.get('pedido') === 'true');

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
    if (searchTerm.trim()) {
      searchParams.set('buscar', searchTerm.trim());
    } else {
      searchParams.delete('buscar');
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeCategory, searchTerm, searchParams, setSearchParams]);

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  return (
    <Layout productSearchTerm={searchTerm} onProductSearchChange={setSearchTerm}>
      {/* Desktop Hero - hidden on mobile */}
      <div className="hidden md:block">
        <ProductHero />
      </div>

      {/* Mobile Compact Header */}
      <div className="md:hidden pt-24 pb-3 px-4" style={{ background: 'linear-gradient(to bottom, #1e293b, #1e3a5f)' }}>
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
      
      {/* Desktop Quick Actions - Arma tu PC + Buscar pedido */}
      <section className="py-4 hidden md:block">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="flex gap-4">
            {/* Arma tu PC */}
            <Link
              to="/productos/arma-tu-pc"
              className="flex-1 flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-tech-blue to-blue-700 text-white hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Arma tu PC</h3>
                <p className="text-white/80 text-sm">Ensamblamos tu PC ideal según tus necesidades y presupuesto.</p>
              </div>
            </Link>

            {/* Buscar mi pedido */}
            <button
              onClick={() => setShowOrderSearch(true)}
              className="flex-1 flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group text-left"
            >
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Package size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Buscar mi pedido</h3>
                <p className="text-muted-foreground text-sm">Click aquí para conocer el estatus de tus pedidos.</p>
              </div>
            </button>
          </div>
        </div>
      </section>
      
      {/* Product Catalog */}
      <section className="py-4 md:py-4">
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

      {/* Order Search Dialog for mobile and desktop */}
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