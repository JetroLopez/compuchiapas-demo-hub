import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Loader2, ClipboardPaste, AlertTriangle, CheckCircle2, Warehouse, Plus, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ParsedProduct {
  clave: string;
  descripcion: string;
  linea: string;
  existencias: number;
  costo: number;
  imagen_url?: string;
}

interface WarehouseType {
  id: string;
  name: string;
}

type AppRole = 'admin' | 'tecnico' | 'ventas' | 'supervisor' | 'user';

interface ProductSyncProps {
  userRole?: AppRole | null;
}

const ProductSync: React.FC<ProductSyncProps> = ({ userRole }) => {
  const queryClient = useQueryClient();
  const [pastedData, setPastedData] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [showNewWarehouseDialog, setShowNewWarehouseDialog] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Fetch warehouses
  const { data: warehouses = [], refetch: refetchWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data || []) as WarehouseType[];
    },
  });

  // Fetch categories to map LINEA values
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  // Create new warehouse mutation
  const createWarehouseMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data as WarehouseType;
    },
    onSuccess: (data) => {
      refetchWarehouses();
      setSelectedWarehouse(data);
      setShowNewWarehouseDialog(false);
      setNewWarehouseName('');
      toast.success(`Almacén "${data.name}" creado`);
    },
    onError: (error: any) => {
      toast.error(`Error al crear almacén: ${error.message}`);
    },
  });

  // Helper function to parse numbers that may have commas as thousands separators
  const parseNumberWithCommas = (value: string | undefined): number => {
    if (!value) return 0;
    // Remove commas (thousands separator) before parsing
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseTableData = (text: string): ParsedProduct[] => {
    const lines = text
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const products: ParsedProduct[] = [];

    // Detect delimiter (tab or multiple spaces)
    const firstLine = lines[0];
    const isTabDelimited = firstLine.includes('\t');

    const looksLikeUrl = (value: string) => /^https?:\/\//i.test(value);

    for (const line of lines) {
      // Skip header row if detected
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('clave') && lowerLine.includes('descripcion')) {
        continue;
      }

      let clave = '';
      let descripcion = '';
      let linea = '';
      let existencias = 0;
      let costo = 0;
      let imagen_url: string | undefined;

      if (isTabDelimited) {
        const parts = line.split('\t').map((p) => p.trim());
        if (parts.length < 4) continue;

        clave = parts[0] || '';
        descripcion = parts[1] || '';
        linea = parts[2] || '';
        existencias = parseInt(parts[3] || '0', 10) || 0;
        // Costo is 5th column (index 4), imagen_url is 6th column (index 5)
        costo = parseNumberWithCommas(parts[4]);
        imagen_url = parts[5]?.trim() || undefined;
      } else {
        // Try: separated by 2+ spaces (common when copying from some systems)
        const parts = line
          .split(/\s{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

        if (parts.length >= 4) {
          clave = parts[0] || '';
          descripcion = parts[1] || '';
          linea = parts[2] || '';
          existencias = parseInt(parts[3] || '0', 10) || 0;
          // Costo is 5th column (index 4), imagen_url is 6th column (index 5)
          costo = parseNumberWithCommas(parts[4]);
          imagen_url = parts[5]?.trim() || undefined;
        } else {
          // Fallback: single-space separated (descripcion puede contener espacios)
          // Formato esperado:
          // CLAVE <descripcion...> LINEA EXISTENCIAS COSTO [URL_IMAGEN]
          const tokens = line.split(/\s+/).filter(Boolean);
          if (tokens.length < 4) continue;

          clave = tokens[0] || '';

          const last = tokens[tokens.length - 1];
          const hasUrl = looksLikeUrl(last);

          if (hasUrl) {
            imagen_url = last;
            costo = parseNumberWithCommas(tokens[tokens.length - 2]);
            existencias = parseInt(tokens[tokens.length - 3] || '0', 10) || 0;
            linea = tokens[tokens.length - 4] || '';
            descripcion = tokens.slice(1, tokens.length - 4).join(' ').trim();
          } else {
            // Check if last is a decimal number (could be costo)
            const lastAsNumber = parseNumberWithCommas(last);
            const secondLast = tokens[tokens.length - 2];
            const secondLastAsInt = parseInt(secondLast || '0', 10);
            
            // If we have at least 5 tokens and last looks like a costo
            if (tokens.length >= 5 && lastAsNumber > 0) {
              costo = lastAsNumber;
              existencias = secondLastAsInt || 0;
              linea = tokens[tokens.length - 3] || '';
              descripcion = tokens.slice(1, tokens.length - 3).join(' ').trim();
            } else {
              existencias = parseInt(last || '0', 10) || 0;
              linea = tokens[tokens.length - 2] || '';
              descripcion = tokens.slice(1, tokens.length - 2).join(' ').trim();
            }
          }
        }
      }

      // Only include products with existencias >= 1
      if (clave && descripcion && linea && existencias >= 1) {
        products.push({
          clave,
          descripcion,
          linea,
          existencias,
          costo,
          imagen_url,
        });
      }
    }

    return products;
  };

  const handlePaste = () => {
    setParseError(null);

    if (!pastedData.trim()) {
      setParseError('No hay datos para procesar');
      return;
    }

    try {
      const products = parseTableData(pastedData);

      if (products.length === 0) {
        setParseError(
          'No se encontraron productos válidos. Asegúrate de que el formato sea: CLAVE | DESCRIPCION | LINEA | EXISTENCIAS | URL_IMAGEN (opcional)'
        );
        return;
      }

      setParsedProducts(products);
      toast.success(`${products.length} productos detectados`);
    } catch (error) {
      setParseError('Error al procesar los datos');
    }
  };

  const syncMutation = useMutation({
    mutationFn: async ({ products, warehouseId }: { products: ParsedProduct[]; warehouseId: string }) => {
      // Deduplicate by CLAVE + DESCRIPCION to create unique product keys
      // This ensures products are identified by both their code AND name
      const deduped = new Map<string, ParsedProduct>();
      let duplicates = 0;
      
      for (const p of products) {
        if (!p.clave || !p.descripcion) continue;
        // Create unique key from CLAVE + DESCRIPCION (normalized)
        const uniqueKey = `${p.clave.trim().toLowerCase()}|||${p.descripcion.trim().toLowerCase()}`;
        if (deduped.has(uniqueKey)) duplicates++;
        // Keep the last occurrence (usually the most recent inventory row)
        deduped.set(uniqueKey, p);
      }
      const uniqueProducts = Array.from(deduped.values());

      const chunkSize = 500;
      const pageSize = 1000;

      // 1. Get all existing products to check for CLAVE + NAME matches
      const existingProducts: { id: string; clave: string | null; name: string }[] = [];

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('products')
          .select('id, clave, name')
          .range(from, from + pageSize - 1);

        if (error) throw error;
        existingProducts.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }

      // 2. Create a map of CLAVE+NAME -> product_id for existing products
      const claveNameToProductId = new Map<string, string>();
      existingProducts.forEach((p) => {
        if (p.clave && p.name) {
          const key = `${p.clave.trim().toLowerCase()}|||${p.name.trim().toLowerCase()}`;
          claveNameToProductId.set(key, p.id);
        }
      });

      // 3. Separate products into new vs existing
      const newProducts: any[] = [];
      const existingProductIds: string[] = [];
      const productToExistencias = new Map<string, number>(); // product_id -> existencias
      const productToCosto = new Map<string, number>(); // product_id -> costo
      const productToCategoryId = new Map<string, string | null>(); // product_id -> category_id

      // Track new categories that need to be created
      const newCategories = new Map<string, string>(); // linea code -> linea code (as name too)

      // First pass: identify new categories
      for (const product of uniqueProducts) {
        const categoryExists = categories.some(
          (c) =>
            c.name.toLowerCase() === product.linea.toLowerCase() ||
            c.id.toLowerCase() === product.linea.toLowerCase()
        );
        if (!categoryExists && product.linea) {
          newCategories.set(product.linea.toUpperCase(), product.linea.toUpperCase());
        }
      }

      // Create new categories if any
      if (newCategories.size > 0) {
        const categoriesToInsert = Array.from(newCategories.keys()).map(linea => ({
          id: linea,
          name: linea,
          is_active: true,
        }));
        
        const { error: catError } = await supabase
          .from('categories')
          .upsert(categoriesToInsert, { onConflict: 'id' });
        
        if (catError) {
          console.error('Error creating categories:', catError);
        } else {
          // Add to local categories array for mapping
          categoriesToInsert.forEach(cat => {
            categories.push({ id: cat.id, name: cat.name });
          });
        }
      }

      for (const product of uniqueProducts) {
        const category = categories.find(
          (c) =>
            c.name.toLowerCase() === product.linea.toLowerCase() ||
            c.id.toLowerCase() === product.linea.toLowerCase()
        );

        const productData: any = {
          clave: product.clave,
          name: product.descripcion,
          category_id: category?.id || null,
          is_active: true,
          costo: product.costo,
        };

        if (product.imagen_url) {
          productData.image_url = product.imagen_url;
        }

        const uniqueKey = `${product.clave.trim().toLowerCase()}|||${product.descripcion.trim().toLowerCase()}`;
        const existingProductId = claveNameToProductId.get(uniqueKey);

        if (existingProductId) {
          // Product exists - we'll update its stock for this warehouse
          existingProductIds.push(existingProductId);
          productToExistencias.set(existingProductId, product.existencias);
          productToCosto.set(existingProductId, product.costo);
          productToCategoryId.set(existingProductId, category?.id || null);
        } else {
          // New product - will be inserted
          newProducts.push({ ...productData, existencias: product.existencias });
        }
      }

      // 3.5. Update costo AND category_id for existing products
      for (let i = 0; i < existingProductIds.length; i += chunkSize) {
        const chunk = existingProductIds.slice(i, i + chunkSize);
        for (const productId of chunk) {
          const newCosto = productToCosto.get(productId);
          const newCategoryId = productToCategoryId.get(productId);
          
          const updateData: { costo?: number; category_id?: string | null } = {};
          if (newCosto !== undefined) {
            updateData.costo = newCosto;
          }
          if (newCategoryId !== undefined) {
            updateData.category_id = newCategoryId;
          }
          
          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('products')
              .update(updateData)
              .eq('id', productId);
          }
        }
      }

      // 4. Insert new products and get their IDs
      const newProductIds: { id: string; clave: string; name: string; existencias: number }[] = [];
      
      for (let i = 0; i < newProducts.length; i += chunkSize) {
        const chunk = newProducts.slice(i, i + chunkSize);
        const { data: insertedProducts, error: insertError } = await supabase
          .from('products')
          .insert(chunk)
          .select('id, clave, name');

        if (insertError) throw insertError;

        // Map new products to their existencias
        (insertedProducts || []).forEach((p) => {
          const originalProduct = chunk.find(
            (c: any) => c.clave === p.clave && c.name === p.name
          );
          if (originalProduct) {
            newProductIds.push({
              id: p.id,
              clave: p.clave || '',
              name: p.name,
              existencias: originalProduct.existencias,
            });
          }
        });
      }

      // 5. Create/Update warehouse stock ONLY for the selected warehouse
      // This is critical: we only touch stock records for the current warehouse
      const stockUpserts: { product_id: string; warehouse_id: string; existencias: number }[] = [];
      
      // Track all product IDs that ARE in this sync (to detect missing ones later)
      const syncedProductIds = new Set<string>();

      // Add stock for existing products
      for (const productId of existingProductIds) {
        const existencias = productToExistencias.get(productId) || 0;
        stockUpserts.push({
          product_id: productId,
          warehouse_id: warehouseId,
          existencias,
        });
        syncedProductIds.add(productId);
      }

      // Add stock for new products
      for (const newProduct of newProductIds) {
        stockUpserts.push({
          product_id: newProduct.id,
          warehouse_id: warehouseId,
          existencias: newProduct.existencias,
        });
        syncedProductIds.add(newProduct.id);
      }

      // Upsert all stock records for this warehouse
      for (let i = 0; i < stockUpserts.length; i += chunkSize) {
        const chunk = stockUpserts.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('product_warehouse_stock')
          .upsert(chunk, { onConflict: 'product_id,warehouse_id' });
        if (error) throw error;
      }
      
      // 5b. CRITICAL: Set stock to 0 for products that HAD stock in this warehouse 
      // but are NOT in the current sync (they were removed from POS)
      const { data: existingWarehouseStock, error: existingStockError } = await supabase
        .from('product_warehouse_stock')
        .select('product_id, existencias')
        .eq('warehouse_id', warehouseId)
        .gt('existencias', 0);
      
      if (existingStockError) throw existingStockError;
      
      // Find products that had stock but are NOT in current sync
      const missingProducts: string[] = [];
      (existingWarehouseStock || []).forEach((stock) => {
        if (!syncedProductIds.has(stock.product_id)) {
          missingProducts.push(stock.product_id);
        }
      });
      
      // Set their stock to 0 in this warehouse
      if (missingProducts.length > 0) {
        for (let i = 0; i < missingProducts.length; i += chunkSize) {
          const chunk = missingProducts.slice(i, i + chunkSize);
          const { error: zeroError } = await supabase
            .from('product_warehouse_stock')
            .update({ existencias: 0 })
            .eq('warehouse_id', warehouseId)
            .in('product_id', chunk);
          if (zeroError) throw zeroError;
        }
      }

      // 6. Detect zero-stock products in this warehouse for "Por Surtir"
      // Instead of updating products.existencias (redundant), we only track por surtir
      const zeroStockProducts: { id: string; clave: string; name: string }[] = [];
      const restoredProducts: string[] = [];

      // Get all stock for this warehouse after sync
      const { data: updatedWarehouseStock, error: updatedStockError } = await supabase
        .from('product_warehouse_stock')
        .select('product_id, existencias')
        .eq('warehouse_id', warehouseId);
      
      if (updatedStockError) throw updatedStockError;

      // Get product info for zero-stock items
      const zeroStockIds = (updatedWarehouseStock || [])
        .filter(s => s.existencias === 0)
        .map(s => s.product_id);
      const positiveStockIds = (updatedWarehouseStock || [])
        .filter(s => s.existencias > 0)
        .map(s => s.product_id);

      if (zeroStockIds.length > 0) {
        for (let i = 0; i < zeroStockIds.length; i += chunkSize) {
          const chunk = zeroStockIds.slice(i, i + chunkSize);
          const { data: prods } = await supabase
            .from('products')
            .select('id, clave, name')
            .in('id', chunk);
          (prods || []).forEach(p => {
            zeroStockProducts.push({ id: p.id, clave: p.clave || '', name: p.name });
          });
        }
      }

      // Products with stock > 0 in this warehouse: remove their por surtir entry for THIS warehouse
      if (positiveStockIds.length > 0) {
        restoredProducts.push(...positiveStockIds);
      }
      
      // 7. Add zero stock products to "Por Surtir" table WITH warehouse_id
      // IMPORTANT: Only add if NO other product with the same clave has stock (handles duplicate product entries)
      if (zeroStockProducts.length > 0) {
        const zeroStockProductIds = zeroStockProducts.map(p => p.id);
        const zeroStockClaves = [...new Set(zeroStockProducts.map(p => p.clave).filter(Boolean))];
        
        // First, clean up any legacy entries (without warehouse_id) for these products
        for (let i = 0; i < zeroStockProductIds.length; i += chunkSize) {
          const chunk = zeroStockProductIds.slice(i, i + chunkSize);
          await supabase
            .from('products_por_surtir')
            .delete()
            .in('product_id', chunk)
            .is('warehouse_id', null);
        }
        
        // Check which claves have stock via OTHER product entries (duplicate products with same clave)
        const clavesWithStock = new Set<string>();
        if (zeroStockClaves.length > 0) {
          for (let i = 0; i < zeroStockClaves.length; i += chunkSize) {
            const chunk = zeroStockClaves.slice(i, i + chunkSize);
            const { data: productsWithStock } = await supabase
              .from('products')
              .select('clave, id')
              .in('clave', chunk);
            
            if (productsWithStock) {
              const otherProductIds = productsWithStock
                .filter(p => !zeroStockProductIds.includes(p.id))
                .map(p => p.id);
              
              if (otherProductIds.length > 0) {
                const { data: stockData } = await supabase
                  .from('product_warehouse_stock')
                  .select('product_id, existencias')
                  .in('product_id', otherProductIds)
                  .gt('existencias', 0);
                
                if (stockData) {
                  const productIdsWithStock = new Set(stockData.map(s => s.product_id));
                  productsWithStock
                    .filter(p => productIdsWithStock.has(p.id) && p.clave)
                    .forEach(p => clavesWithStock.add(p.clave!));
                }
              }
            }
          }
        }
        
        // Filter out products whose clave already has stock via another product entry
        const filteredZeroStock = zeroStockProducts.filter(p => !clavesWithStock.has(p.clave));
        
        if (filteredZeroStock.length > 0) {
          const filteredIds = filteredZeroStock.map(p => p.id);
          
          // Check for existing entries for this specific warehouse to avoid duplicates
          const { data: existingPorSurtir } = await supabase
            .from('products_por_surtir')
            .select('product_id')
            .in('product_id', filteredIds)
            .eq('warehouse_id', warehouseId);
          
          const existingProductIds2 = new Set((existingPorSurtir || []).map((e: any) => e.product_id));
          const newPorSurtir = filteredZeroStock
            .filter((p) => !existingProductIds2.has(p.id))
            .map((p) => ({
              product_id: p.id,
              clave: p.clave,
              nombre: p.name,
              status: 'pending',
              warehouse_id: warehouseId,
            }));
          
          if (newPorSurtir.length > 0) {
            const { error: porSurtirError } = await supabase
              .from('products_por_surtir')
              .insert(newPorSurtir);
            
            if (porSurtirError) throw porSurtirError;
          }
        }
      }
      
      // 8. Remove restored products from "Por Surtir" for THIS warehouse only
      // Also remove by clave to handle duplicate product entries
      if (restoredProducts.length > 0) {
        // Get claves of restored products
        const { data: restoredProductInfo } = await supabase
          .from('products')
          .select('id, clave')
          .in('id', restoredProducts);
        
        const restoredClaves = [...new Set((restoredProductInfo || []).map(p => p.clave).filter(Boolean))];
        
        // Delete by product_id for this warehouse
        for (let i = 0; i < restoredProducts.length; i += chunkSize) {
          const chunk = restoredProducts.slice(i, i + chunkSize);
          const { error: removeError } = await supabase
            .from('products_por_surtir')
            .delete()
            .in('product_id', chunk)
            .eq('warehouse_id', warehouseId);
          
          if (removeError) throw removeError;
        }
        
        // Also delete by clave for this warehouse (catches duplicate product entries)
        if (restoredClaves.length > 0) {
          for (let i = 0; i < restoredClaves.length; i += chunkSize) {
            const chunk = restoredClaves.slice(i, i + chunkSize);
            await supabase
              .from('products_por_surtir')
              .delete()
              .in('clave', chunk)
              .eq('warehouse_id', warehouseId);
          }
        }
      }

      return {
        synced: uniqueProducts.length,
        newProducts: newProducts.length,
        existingUpdated: existingProductIds.length,
        duplicates,
        zeroStockAdded: zeroStockProducts.length,
        restoredFromZero: restoredProducts.length,
        removedFromSync: missingProducts.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-warehouse-stock'] });
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      refetchCategories();

      const extras: string[] = [];
      if (result.duplicates > 0) extras.push(`${result.duplicates} duplicados fusionados`);
      if (result.removedFromSync > 0) extras.push(`${result.removedFromSync} productos sin stock`);
      if (result.zeroStockAdded > 0) extras.push(`${result.zeroStockAdded} agregados a Por Surtir`);
      if (result.restoredFromZero > 0) extras.push(`${result.restoredFromZero} restaurados de Por Surtir`);
      
      const extraText = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      toast.success(
        `Sincronización completada: ${result.newProducts} nuevos, ${result.existingUpdated} actualizados${extraText}`
      );
      setSyncSuccess(true);
      setPastedData('');
      setParsedProducts([]);
      
      // Reset success state after 3 seconds
      setTimeout(() => setSyncSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      const message =
        error && typeof error === 'object' && 'message' in (error as any)
          ? String((error as any).message)
          : 'Error desconocido';
      toast.error(`Error al sincronizar productos: ${message}`);
    },
  });

  const handleSave = () => {
    if (!selectedWarehouse) {
      toast.error('Selecciona un almacén antes de sincronizar');
      return;
    }
    if (parsedProducts.length === 0) {
      toast.error('No hay productos para guardar');
      return;
    }
    syncMutation.mutate({ products: parsedProducts, warehouseId: selectedWarehouse.id });
  };

  const handleCreateWarehouse = () => {
    if (!newWarehouseName.trim()) {
      toast.error('Ingresa un nombre para el almacén');
      return;
    }
    createWarehouseMutation.mutate(newWarehouseName.trim());
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste size={20} />
            Sincronizar Inventario
          </CardTitle>
          <CardDescription>
            Selecciona un almacén y pega los datos de tu punto de venta con formato: CLAVE, DESCRIPCIÓN, LÍNEA, EXISTENCIAS, URL_IMAGEN (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warehouse selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Almacén:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[150px] justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse size={16} />
                    {selectedWarehouse ? selectedWarehouse.name : 'Seleccionar...'}
                  </div>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {warehouses.map((warehouse) => (
                  <DropdownMenuItem
                    key={warehouse.id}
                    onClick={() => setSelectedWarehouse(warehouse)}
                  >
                    {warehouse.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNewWarehouseDialog(true)}>
                  <Plus size={16} className="mr-2" />
                  Nuevo almacén
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedWarehouse && (
              <span className="text-sm text-muted-foreground">
                Solo se actualizará el stock de este almacén
              </span>
            )}
          </div>

          <div>
            <Textarea
              placeholder={`Ejemplo de formato (separado por tabs o espacios):
CLAVE  DESCRIPCION  LINEA  EXISTENCIAS  COSTO  URL_IMAGEN

CLAVE001    Teclado USB Logitech    Periféricos    15    250.00    https://ejemplo.com/teclado.jpg
CLAVE002    Mouse Inalámbrico       Periféricos    8     150.50    https://ejemplo.com/mouse.jpg
CLAVE003    Laptop HP 15            Equipos        3     8500.00`}
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePaste} disabled={!pastedData.trim()}>
              <ClipboardPaste size={16} className="mr-2" />
              Procesar Datos
            </Button>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {parsedProducts.length > 0 && (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>{parsedProducts.length}</strong> productos listos para sincronizar
                  {selectedWarehouse && (
                    <> en almacén <strong>{selectedWarehouse.name}</strong></>
                  )}.
                  Los productos que no estén en esta lista se marcarán con 0 existencias en este almacén.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Clave</th>
                      <th className="text-left p-2">Descripción</th>
                      <th className="text-left p-2">Línea</th>
                      <th className="text-center p-2">Existencias</th>
                      <th className="text-right p-2">Costo</th>
                      <th className="text-left p-2">URL Imagen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 50).map((product, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{product.clave}</td>
                        <td className="p-2 truncate max-w-xs">{product.descripcion}</td>
                        <td className="p-2">{product.linea}</td>
                        <td className="p-2 text-center">{product.existencias}</td>
                        <td className="p-2 text-right font-mono">${product.costo.toFixed(2)}</td>
                        <td className="p-2 truncate max-w-[150px] text-xs text-muted-foreground" title={product.imagen_url}>
                          {product.imagen_url || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedProducts.length > 50 && (
                  <p className="text-center text-muted-foreground py-2 text-sm">
                    ... y {parsedProducts.length - 50} productos más
                  </p>
                )}
              </div>

              <Button 
                onClick={handleSave} 
                className={`w-full transition-colors ${syncSuccess ? 'bg-primary/90 hover:bg-primary' : ''}`}
                disabled={syncMutation.isPending || !selectedWarehouse}
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sincronizando... (puede tardar unos minutos)
                  </>
                ) : syncSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    ¡Sincronización completada!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {selectedWarehouse 
                      ? `Guardar en ${selectedWarehouse.name}` 
                      : 'Selecciona un almacén'}
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* New warehouse dialog */}
      <Dialog open={showNewWarehouseDialog} onOpenChange={setShowNewWarehouseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Almacén</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo almacén
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nombre del almacén (ej: Sucursal Norte)"
              value={newWarehouseName}
              onChange={(e) => setNewWarehouseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWarehouse()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewWarehouseDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateWarehouse}
              disabled={createWarehouseMutation.isPending}
            >
              {createWarehouseMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear Almacén
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductSync;
