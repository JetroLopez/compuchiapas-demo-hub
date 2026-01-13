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
  imagen_url?: string;
}

interface WarehouseType {
  id: string;
  name: string;
}

const ProductSync: React.FC = () => {
  const queryClient = useQueryClient();
  const [pastedData, setPastedData] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [showNewWarehouseDialog, setShowNewWarehouseDialog] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');

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
  const { data: categories = [] } = useQuery({
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
      let imagen_url: string | undefined;

      if (isTabDelimited) {
        const parts = line.split('\t').map((p) => p.trim());
        if (parts.length < 4) continue;

        clave = parts[0] || '';
        descripcion = parts[1] || '';
        linea = parts[2] || '';
        existencias = parseInt(parts[3] || '0', 10) || 0;
        imagen_url = parts[4]?.trim() || undefined;
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
          imagen_url = parts[4]?.trim() || undefined;
        } else {
          // Fallback: single-space separated (descripcion puede contener espacios)
          // Formato esperado:
          // CLAVE <descripcion...> LINEA EXISTENCIAS [URL_IMAGEN]
          const tokens = line.split(/\s+/).filter(Boolean);
          if (tokens.length < 4) continue;

          clave = tokens[0] || '';

          const last = tokens[tokens.length - 1];
          const hasUrl = looksLikeUrl(last);

          if (hasUrl) {
            imagen_url = last;
            existencias = parseInt(tokens[tokens.length - 2] || '0', 10) || 0;
            linea = tokens[tokens.length - 3] || '';
            descripcion = tokens.slice(1, tokens.length - 3).join(' ').trim();
          } else {
            existencias = parseInt(last || '0', 10) || 0;
            linea = tokens[tokens.length - 2] || '';
            descripcion = tokens.slice(1, tokens.length - 2).join(' ').trim();
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
      // Deduplicate by CLAVE to avoid Postgres error:
      // "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const deduped = new Map<string, ParsedProduct>();
      let duplicates = 0;
      for (const p of products) {
        if (!p.clave) continue;
        if (deduped.has(p.clave)) duplicates++;
        // Keep the last occurrence (usually the most recent inventory row)
        deduped.set(p.clave, p);
      }
      const uniqueProducts = Array.from(deduped.values());

      const newClaves = new Set(uniqueProducts.map((p) => p.clave).filter(Boolean));

      // 1. Get all existing products
      const pageSize = 1000;
      const existingProducts: { id: string; clave: string }[] = [];

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('products')
          .select('id, clave')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        existingProducts.push(...(data || []));

        if (!data || data.length < pageSize) break;
      }

      // 2. Get existing stock records for this warehouse
      const existingStockMap = new Map<string, string>(); // product_id -> stock_id
      
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('product_warehouse_stock')
          .select('id, product_id')
          .eq('warehouse_id', warehouseId)
          .range(from, from + pageSize - 1);

        if (error) throw error;

        (data || []).forEach((s) => existingStockMap.set(s.product_id, s.id));

        if (!data || data.length < pageSize) break;
      }

      // 3. Create a map of clave -> product_id for existing products
      const claveToProductId = new Map<string, string>();
      existingProducts.forEach((p) => {
        if (p.clave) claveToProductId.set(p.clave, p.id);
      });

      // 4. Find products not in the new list and set their stock to 0 for this warehouse
      const productIdsNotInList = existingProducts
        .filter((p) => p.clave && !newClaves.has(p.clave))
        .map((p) => p.id);

      // Update stock to 0 for products not in list (only for this warehouse)
      const chunkSize = 500;
      for (let i = 0; i < productIdsNotInList.length; i += chunkSize) {
        const chunk = productIdsNotInList.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('product_warehouse_stock')
          .upsert(
            chunk.map((productId) => ({
              product_id: productId,
              warehouse_id: warehouseId,
              existencias: 0,
            })),
            { onConflict: 'product_id,warehouse_id' }
          );
        if (error) throw error;
      }

      // 5. Upsert products and their stock
      const newProducts: any[] = [];
      const existingProductUpdates: { clave: string; data: any }[] = [];

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
        };

        if (product.imagen_url) {
          productData.image_url = product.imagen_url;
        }

        if (claveToProductId.has(product.clave)) {
          existingProductUpdates.push({ clave: product.clave, data: productData });
        } else {
          newProducts.push(productData);
        }
      }

      // Insert new products
      if (newProducts.length > 0) {
        const { data: insertedProducts, error: insertError } = await supabase
          .from('products')
          .upsert(newProducts, { onConflict: 'clave' })
          .select('id, clave');

        if (insertError) throw insertError;

        // Add to claveToProductId map
        (insertedProducts || []).forEach((p) => {
          if (p.clave) claveToProductId.set(p.clave, p.id);
        });
      }

      // Update existing products
      for (const update of existingProductUpdates) {
        const { error } = await supabase
          .from('products')
          .update(update.data)
          .eq('clave', update.clave);
        if (error) throw error;
      }

      // 6. Upsert stock for all products in this warehouse
      const stockUpserts = uniqueProducts
        .filter((p) => claveToProductId.has(p.clave))
        .map((p) => ({
          product_id: claveToProductId.get(p.clave)!,
          warehouse_id: warehouseId,
          existencias: p.existencias,
        }));

      for (let i = 0; i < stockUpserts.length; i += chunkSize) {
        const chunk = stockUpserts.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('product_warehouse_stock')
          .upsert(chunk, { onConflict: 'product_id,warehouse_id' });
        if (error) throw error;
      }

      // 7. Update the main products table existencias with sum from all warehouses
      // Get all stock for products that were updated
      const updatedProductIds = [...new Set(stockUpserts.map((s) => s.product_id))];
      
      for (let i = 0; i < updatedProductIds.length; i += chunkSize) {
        const chunk = updatedProductIds.slice(i, i + chunkSize);
        
        // Get sum of existencias for each product across all warehouses
        const { data: stockData, error: stockError } = await supabase
          .from('product_warehouse_stock')
          .select('product_id, existencias')
          .in('product_id', chunk);
        
        if (stockError) throw stockError;

        // Calculate sum per product
        const productSums = new Map<string, number>();
        (stockData || []).forEach((s) => {
          const current = productSums.get(s.product_id) || 0;
          productSums.set(s.product_id, current + s.existencias);
        });

        // Update products with total existencias
        for (const [productId, totalExistencias] of productSums) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ existencias: totalExistencias })
            .eq('id', productId);
          if (updateError) throw updateError;
        }
      }

      return {
        synced: uniqueProducts.length,
        deactivated: productIdsNotInList.length,
        duplicates,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      const extra = result.duplicates > 0 ? ` (${result.duplicates} claves duplicadas fusionadas)` : '';
      toast.success(
        `Sincronización completada: ${result.synced} productos actualizados, ${result.deactivated} marcados sin existencias en este almacén${extra}`
      );
      setPastedData('');
      setParsedProducts([]);
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

CLAVE001    Teclado USB Logitech    Periféricos    15    https://ejemplo.com/teclado.jpg
CLAVE002    Mouse Inalámbrico       Periféricos    8     https://ejemplo.com/mouse.jpg
CLAVE003    Laptop HP 15            Equipos        3`}
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
                <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                className="w-full" 
                disabled={syncMutation.isPending || !selectedWarehouse}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {selectedWarehouse 
                  ? `Guardar en ${selectedWarehouse.name}` 
                  : 'Selecciona un almacén'}
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
