import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ComponentSpec, 
  ProductWithSpec, 
  PCBuild, 
  COMPONENT_CATEGORIES,
  checkCompatibility,
  filterCompatibleProducts,
  calculateTotalPower
} from '@/lib/compatibility-rules';

interface Product {
  id: string;
  name: string;
  clave: string | null;
  category_id: string | null;
  existencias: number | null;
  image_url: string | null;
  costo: number | null;
}

export function useComponentProducts(componentType: keyof typeof COMPONENT_CATEGORIES) {
  const categoryIds = COMPONENT_CATEGORIES[componentType] || [];

  return useQuery({
    queryKey: ['component-products', componentType],
    queryFn: async () => {
      // Get product IDs with stock > 0 in any warehouse
      const { data: stockData, error: stockError } = await supabase
        .from('product_warehouse_stock')
        .select('product_id')
        .gt('existencias', 0);
      if (stockError) throw stockError;
      const idsWithStock = [...new Set((stockData || []).map(s => s.product_id))];
      if (idsWithStock.length === 0) return [] as ProductWithSpec[];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, clave, category_id, existencias, image_url, costo')
        .in('category_id', categoryIds)
        .in('id', idsWithStock)
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        return [] as ProductWithSpec[];
      }

      // Fetch specs for these products
      const productIds = products.map(p => p.id);
      const { data: specs, error: specsError } = await supabase
        .from('component_specs')
        .select('*')
        .in('product_id', productIds);

      if (specsError) throw specsError;

      // Merge products with their specs
      const specsMap = new Map(specs?.map(s => [s.product_id, s]) || []);
      
      return products.map(product => ({
        ...product,
        spec: specsMap.get(product.id) as ComponentSpec | undefined,
      })) as ProductWithSpec[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllComponentSpecs() {
  return useQuery({
    queryKey: ['all-component-specs'],
    queryFn: async () => {
      // Get all categories that are component categories
      const allCategoryIds = Object.values(COMPONENT_CATEGORIES).flat();

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, clave, category_id, existencias, image_url, costo')
        .in('category_id', allCategoryIds)
        .eq('is_active', true)
        .order('category_id')
        .order('name');

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        return [] as ProductWithSpec[];
      }

      const productIds = products.map(p => p.id);
      const { data: specs, error: specsError } = await supabase
        .from('component_specs')
        .select('*')
        .in('product_id', productIds);

      if (specsError) throw specsError;

      const specsMap = new Map(specs?.map(s => [s.product_id, s]) || []);
      
      return products.map(product => ({
        ...product,
        spec: specsMap.get(product.id) as ComponentSpec | undefined,
      })) as ProductWithSpec[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePCBuilderCompatibility(build: PCBuild) {
  const compatibility = checkCompatibility(build);
  const power = calculateTotalPower(build);

  return {
    ...compatibility,
    powerNeeded: power.needed,
    powerRecommended: power.recommended,
    psuWattage: build.psu?.spec?.psu_wattage || null,
  };
}

export function useFilteredProducts(
  products: ProductWithSpec[],
  componentType: keyof PCBuild,
  currentBuild: PCBuild
) {
  return filterCompatibleProducts(products, componentType, currentBuild);
}

// Function to get component type from category ID
export function getComponentTypeFromCategory(categoryId: string | null): string | null {
  if (!categoryId) return null;
  
  for (const [type, categories] of Object.entries(COMPONENT_CATEGORIES)) {
    if (categories.includes(categoryId)) {
      return type;
    }
  }
  return null;
}
