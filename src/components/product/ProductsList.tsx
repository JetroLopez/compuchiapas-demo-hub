import React, { useMemo } from 'react';
import ProductCard from '../ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NoProductsFound from './NoProductsFound';
import { searchProducts } from '@/lib/product-search';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface Promotion {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  existencias: number | null;
  img_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface Product {
  id: string;
  clave: string | null;
  name: string;
  category_id: string | null;
  image_url: string | null;
  existencias: number | null;
  costo: number | null;
}

interface ProductWarehouseStock {
  product_id: string;
  warehouse_id: string;
  existencias: number;
}

interface ExhibitedWarehouse {
  warehouse_id: string;
  is_exhibited: boolean;
}

interface WarehouseInfo {
  id: string;
  name: string;
  profit_multiplier: number;
}

interface ProductsListProps {
  searchTerm: string;
  activeCategory: string;
  resetFilters: () => void;
  categories?: Array<{ id: string; name: string; display_order: number }>;
}

const ProductsList: React.FC<ProductsListProps> = ({ searchTerm, activeCategory, resetFilters, categories = [] }) => {
  const { showPrices } = useStoreSettings();

  // Obtener productos de la base de datos con paginación para superar límite de 1000
  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const allProducts: Product[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('products')
          .select('id, clave, name, category_id, image_url, existencias, costo')
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allProducts.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allProducts;
    }
  });

  // Obtener stock por almacén con paginación
  const { data: warehouseStock = [] } = useQuery({
    queryKey: ['product-warehouse-stock'],
    queryFn: async (): Promise<ProductWarehouseStock[]> => {
      const allStock: ProductWarehouseStock[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('product_warehouse_stock')
          .select('product_id, warehouse_id, existencias')
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allStock.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allStock;
    },
  });

  // Obtener almacenes exhibidos
  const { data: exhibitedWarehouses = [] } = useQuery({
    queryKey: ['exhibited-warehouses'],
    queryFn: async (): Promise<ExhibitedWarehouse[]> => {
      const { data, error } = await supabase
        .from('exhibited_warehouses')
        .select('warehouse_id, is_exhibited');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener multiplicadores y nombres de almacenes
  const { data: warehouseInfos = [] } = useQuery({
    queryKey: ['warehouse-infos'],
    queryFn: async (): Promise<WarehouseInfo[]> => {
      const { data, error } = await (supabase
        .from('warehouses')
        .select('id, name, profit_multiplier') as any);
      
      if (error) throw error;
      return (data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        profit_multiplier: w.profit_multiplier ?? 1.20,
      }));
    },
  });

  // Set de IDs de almacenes exhibidos
  const exhibitedWarehouseIds = useMemo(() => {
    return new Set(
      exhibitedWarehouses
        .filter(ew => ew.is_exhibited)
        .map(ew => ew.warehouse_id)
    );
  }, [exhibitedWarehouses]);

  // Build map: warehouseId -> info
  const warehouseInfoMap = useMemo(() => {
    const map = new Map<string, WarehouseInfo>();
    warehouseInfos.forEach(w => map.set(w.id, w));
    return map;
  }, [warehouseInfos]);

  // Find the "CSC" warehouse id (first warehouse alphabetically or one containing CSC)
  const cscWarehouseId = useMemo(() => {
    const csc = warehouseInfos.find(w => w.name.toUpperCase().includes('CSC'));
    return csc?.id || warehouseInfos[0]?.id || null;
  }, [warehouseInfos]);

  // Obtener software ESD
  const { data: softwareESD = [] } = useQuery({
    queryKey: ['software-esd'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('software_esd')
        .select('*')
        .eq('is_active', true) as any);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener promociones activas
  const { data: promotions = [] } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // DEDUPLICATION: Merge products with same clave.
  // For products with same clave, keep description/price from warehouse with most exhibited stock.
  // If equal, prefer CSC warehouse.
  const deduplicatedProducts = useMemo(() => {
    // Group products by clave
    const byClave = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.clave) {
        // Products without clave are unique
        byClave.set(p.id, [p]);
        continue;
      }
      const existing = byClave.get(p.clave);
      if (existing) {
        existing.push(p);
      } else {
        byClave.set(p.clave, [p]);
      }
    }

    const result: Product[] = [];
    for (const [key, group] of byClave) {
      if (group.length === 1) {
        result.push(group[0]);
        continue;
      }

      // Multiple products with same clave - pick the best one
      // Calculate total exhibited stock per product entry
      let bestProduct = group[0];
      let bestStock = 0;
      let bestIsCsc = false;

      for (const p of group) {
        const stockInExhibited = warehouseStock
          .filter(ws => ws.product_id === p.id && exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0)
          .reduce((sum, ws) => sum + ws.existencias, 0);

        const isCsc = warehouseStock.some(
          ws => ws.product_id === p.id && ws.warehouse_id === cscWarehouseId && ws.existencias > 0
        );

        if (stockInExhibited > bestStock || (stockInExhibited === bestStock && isCsc && !bestIsCsc)) {
          bestProduct = p;
          bestStock = stockInExhibited;
          bestIsCsc = isCsc;
        }
      }

      // Merge: use best product's name/costo but aggregate stock from ALL entries with same clave
      // We'll aggregate stock at render time, but the product entry itself uses the best one
      result.push({
        ...bestProduct,
        // We'll use a special marker to aggregate stock from all products with same clave
      });
    }

    return result;
  }, [products, warehouseStock, exhibitedWarehouseIds, cscWarehouseId]);

  // Build a map: clave -> all product IDs (for aggregating stock of merged products)
  const claveToProductIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of products) {
      if (!p.clave) continue;
      const existing = map.get(p.clave) || [];
      existing.push(p.id);
      map.set(p.clave, existing);
    }
    return map;
  }, [products]);

  // Build map: productId -> best multiplier (from first exhibited warehouse with stock)
  const productMultiplierMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const ws of warehouseStock) {
      if (exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0 && !map.has(ws.product_id)) {
        const info = warehouseInfoMap.get(ws.warehouse_id);
        map.set(ws.product_id, info?.profit_multiplier ?? 1.20);
      }
    }
    return map;
  }, [warehouseStock, exhibitedWarehouseIds, warehouseInfoMap]);

  // Filtrar productos según almacenes exhibidos (using deduplicated list)
  const productsInExhibitedWarehouses = useMemo(() => {
    if (exhibitedWarehouseIds.size === 0) {
      return [];
    }

    // For deduplicated products, check if ANY of the products with same clave has exhibited stock
    return deduplicatedProducts.filter(product => {
      const allIds = product.clave ? (claveToProductIds.get(product.clave) || [product.id]) : [product.id];
      return allIds.some(pid =>
        warehouseStock.some(ws => ws.product_id === pid && exhibitedWarehouseIds.has(ws.warehouse_id) && ws.existencias > 0)
      );
    });
  }, [deduplicatedProducts, warehouseStock, exhibitedWarehouseIds, claveToProductIds]);

  // Determinar si estamos filtrando por categoría "Software"
  const isSoftwareCategory = useMemo(() => {
    if (activeCategory === 'all') return false;
    const categoryIds = activeCategory.includes(',') 
      ? activeCategory.split(',') 
      : [activeCategory];
    
    return categoryIds.some(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.name.toUpperCase().includes('SOFTWARE') || 
             cat?.name.toUpperCase().includes('SOFT');
    });
  }, [activeCategory, categories]);

  // Determinar si estamos filtrando por categoría "Promociones"
  const isPromotionsCategory = useMemo(() => {
    if (activeCategory === 'all') return false;
    const categoryIds = activeCategory.includes(',') 
      ? activeCategory.split(',') 
      : [activeCategory];
    
    return categoryIds.some(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.name.toUpperCase().includes('PROMO');
    });
  }, [activeCategory, categories]);
  
  // Aplicar filtros adicionales (categoría y búsqueda con ranking por tokens)
  const filteredProducts = useMemo(() => {
    let categoryFiltered;
    if (activeCategory === 'all') {
      categoryFiltered = productsInExhibitedWarehouses;
    } else if (activeCategory.includes(',')) {
      const categoryIds = activeCategory.split(',');
      categoryFiltered = productsInExhibitedWarehouses.filter(p => p.category_id && categoryIds.includes(p.category_id));
    } else {
      categoryFiltered = productsInExhibitedWarehouses.filter(p => p.category_id === activeCategory);
    }

    const searched = searchProducts(categoryFiltered, searchTerm) as Product[];
    
    if (!searchTerm.trim()) {
      return searched.sort((a, b) => {
        const aHasImg = a.image_url ? 1 : 0;
        const bHasImg = b.image_url ? 1 : 0;
        return bHasImg - aHasImg;
      });
    }
    
    return searched;
  }, [productsInExhibitedWarehouses, activeCategory, searchTerm]);

  // Combinar productos físicos con software ESD y/o promociones
  const allFilteredItems = useMemo(() => {
    const productItems: any[] = filteredProducts.map(p => ({
      ...p,
      type: 'product' as const
    }));

    let combined: any[] = [...productItems];

    if (isSoftwareCategory) {
      const softwareItems = (softwareESD as any[]).map((s: any) => ({
        id: s.id,
        clave: s.clave,
        name: `${s.marca} - ${s.descripcion}`,
        category_id: activeCategory,
        image_url: s.img_url,
        existencias: 9999,
        costo: s.precio,
        type: 'software' as const
      }));
      combined = [...combined, ...softwareItems];
    }

    if (isPromotionsCategory) {
      const promotionItems = promotions.map((p: Promotion) => ({
        id: p.id,
        clave: p.clave,
        name: p.nombre,
        category_id: activeCategory,
        image_url: p.img_url,
        existencias: p.existencias ?? 0,
        costo: p.precio,
        type: 'promotion' as const
      }));
      combined = [...combined, ...promotionItems];
    }

    if (searchTerm.trim() && (isSoftwareCategory || isPromotionsCategory)) {
      return searchProducts(combined, searchTerm);
    }

    return combined;
  }, [filteredProducts, softwareESD, promotions, isSoftwareCategory, isPromotionsCategory, searchTerm, activeCategory]);

  // Helper to get aggregated exhibited stock for a product (considering clave merging)
  const getAggregatedStock = (item: any): number => {
    if (item.type === 'software') return item.existencias || 9999;
    const allIds = item.clave ? (claveToProductIds.get(item.clave) || [item.id]) : [item.id];
    return allIds.reduce((total: number, pid: string) => {
      return total + warehouseStock
        .filter(ws => exhibitedWarehouseIds.has(ws.warehouse_id) && ws.product_id === pid)
        .reduce((sum, ws) => sum + ws.existencias, 0);
    }, 0);
  };

  const isLoading = isLoadingProducts;
  const error = productsError;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">Error al cargar los productos. Intente nuevamente.</p>
      </div>
    );
  }

  if (allFilteredItems.length === 0) {
    return <NoProductsFound resetFilters={resetFilters} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-8">
      {allFilteredItems.map((item) => (
        <ProductCard
          key={item.id}
          id={item.id}
          clave={item.clave}
          name={item.name}
          image={item.image_url || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'}
          existencias={getAggregatedStock(item)}
          costo={item.costo}
          categoryId={item.category_id}
          showPrice={showPrices}
          profitMultiplier={item.type === 'software' ? 1.20 : (productMultiplierMap.get(item.id) ?? 1.20)}
          type={item.type}
        />
      ))}
    </div>
  );
};

export default ProductsList;
