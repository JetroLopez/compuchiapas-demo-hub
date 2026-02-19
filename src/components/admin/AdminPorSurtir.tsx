import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Truck, Package, Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PorSurtirProduct {
  id: string;
  product_id: string | null;
  clave: string;
  nombre: string;
  status: string;
  created_at: string;
  warehouse_id: string | null;
}

type DeleteScope = 'single' | 'all';

interface Warehouse {
  id: string;
  name: string;
}

interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  existencias: number;
}

const AdminPorSurtir: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newClave, setNewClave] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // Optimistic UI state: track items being visually removed or moved
  const [optimisticDeleted, setOptimisticDeleted] = useState<Set<string>>(new Set());
  const [optimisticStatusOverrides, setOptimisticStatusOverrides] = useState<Map<string, string>>(new Map());

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Warehouse[];
    },
  });

  // Fetch products por surtir
  const { data: productsPorSurtir = [], isLoading } = useQuery({
    queryKey: ['products-por-surtir'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_por_surtir')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Clear optimistic state when fresh data arrives
      setOptimisticDeleted(new Set());
      setOptimisticStatusOverrides(new Map());
      return data as PorSurtirProduct[];
    },
  });

  // Fetch ALL stock records (including 0) by warehouse for all products with same clave
  const { data: warehouseStockMap = new Map() } = useQuery({
    queryKey: ['warehouse-stock-by-clave', productsPorSurtir.map(p => p.clave)],
    queryFn: async () => {
      if (productsPorSurtir.length === 0) return new Map<string, WarehouseStock[]>();

      const claves = productsPorSurtir.map(p => p.clave);
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, clave')
        .in('clave', claves);
      
      if (productsError) throw productsError;
      if (!products || products.length === 0) return new Map<string, WarehouseStock[]>();

      const productIds = products.map(p => p.id);
      
      const { data: stockData, error: stockError } = await supabase
        .from('product_warehouse_stock')
        .select('product_id, warehouse_id, existencias')
        .in('product_id', productIds);
      
      if (stockError) throw stockError;

      const stockMap = new Map<string, WarehouseStock[]>();
      
      for (const stock of stockData || []) {
        const product = products.find(p => p.id === stock.product_id);
        if (!product) continue;
        
        const warehouse = warehouses.find(w => w.id === stock.warehouse_id);
        if (!warehouse) continue;

        const existing = stockMap.get(product.clave) || [];
        existing.push({
          warehouse_id: stock.warehouse_id,
          warehouse_name: warehouse.name,
          existencias: stock.existencias,
        });
        stockMap.set(product.clave, existing);
      }

      return stockMap;
    },
    enabled: productsPorSurtir.length > 0 && warehouses.length > 0,
  });

  // Add manual product
  const addProductMutation = useMutation({
    mutationFn: async ({ clave, nombre }: { clave: string; nombre: string }) => {
      const { error } = await supabase
        .from('products_por_surtir')
        .insert({ clave, nombre, status: 'pending' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
      setNewClave('');
      setNewNombre('');
      toast({
        title: 'Producto agregado',
        description: 'El producto se ha agregado a la lista por surtir.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark as ordered (in transit) - optimistic
  const markAsOrderedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products_por_surtir')
        .update({ status: 'ordered' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: (id: string) => {
      setOptimisticStatusOverrides(prev => new Map(prev).set(id, 'ordered'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
    },
    onError: (error: Error, id: string) => {
      // Revert optimistic update
      setOptimisticStatusOverrides(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark as pending (revert from ordered) - optimistic
  const markAsPendingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products_por_surtir')
        .update({ status: 'pending' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: (id: string) => {
      setOptimisticStatusOverrides(prev => new Map(prev).set(id, 'pending'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
    },
    onError: (error: Error, id: string) => {
      setOptimisticStatusOverrides(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete product - supports single warehouse removal or full product deletion
  const deleteProductMutation = useMutation({
    mutationFn: async ({ id, productId, scope, clave, warehouseId }: { id: string; productId: string | null; scope: DeleteScope; clave: string; warehouseId?: string | null }) => {
      if (scope === 'all') {
        // Delete all por_surtir entries with the same clave
        const { error: porSurtirError } = await supabase
          .from('products_por_surtir')
          .delete()
          .eq('clave', clave);
        if (porSurtirError) throw porSurtirError;

        // Delete all warehouse stock entries and the product itself
        if (productId) {
          await supabase.from('product_warehouse_stock').delete().eq('product_id', productId);
          const { error: productError } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
          if (productError) throw productError;
        }
      } else {
        // Delete only this por_surtir entry
        const { error: porSurtirError } = await supabase
          .from('products_por_surtir')
          .delete()
          .eq('id', id);
        if (porSurtirError) throw porSurtirError;

        // Also remove the warehouse stock entry so it doesn't reappear on next sync
        const targetWarehouse = warehouseId;
        if (productId && targetWarehouse) {
          await supabase
            .from('product_warehouse_stock')
            .delete()
            .eq('product_id', productId)
            .eq('warehouse_id', targetWarehouse);
        }
      }
    },
    onMutate: ({ id, scope, clave }) => {
      if (scope === 'all') {
        // Optimistically hide all entries with same clave
        const idsToHide = productsPorSurtir.filter(p => p.clave === clave).map(p => p.id);
        setOptimisticDeleted(prev => {
          const next = new Set(prev);
          idsToHide.forEach(i => next.add(i));
          return next;
        });
      } else {
        setOptimisticDeleted(prev => new Set(prev).add(id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error, { id, scope, clave }) => {
      if (scope === 'all') {
        const idsToRevert = productsPorSurtir.filter(p => p.clave === clave).map(p => p.id);
        setOptimisticDeleted(prev => {
          const next = new Set(prev);
          idsToRevert.forEach(i => next.delete(i));
          return next;
        });
      } else {
        setOptimisticDeleted(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddProduct = () => {
    if (!newClave.trim() || !newNombre.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor ingresa la clave y descripción del producto.',
        variant: 'destructive',
      });
      return;
    }
    addProductMutation.mutate({ clave: newClave.trim(), nombre: newNombre.trim() });
  };

  // Filter by warehouse - uses warehouse_id directly from the record
  const filterByWarehouse = (product: PorSurtirProduct) => {
    if (selectedWarehouse === 'all') return true;
    return product.warehouse_id === selectedWarehouse;
  };

  // Apply optimistic state: get effective status for a product
  const getEffectiveStatus = (product: PorSurtirProduct): string => {
    return optimisticStatusOverrides.get(product.id) ?? product.status;
  };

  // Filter out optimistically deleted, then apply warehouse filter
  // Also deduplicate by clave+warehouse_id to prevent visual duplicates
  const visibleProducts = (() => {
    const filtered = productsPorSurtir
      .filter(p => !optimisticDeleted.has(p.id))
      .filter(filterByWarehouse);
    
    // Deduplicate: keep first entry per clave+warehouse_id
    const seen = new Set<string>();
    return filtered.filter(p => {
      const key = `${p.clave}|||${p.warehouse_id || 'none'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const pendingProducts = visibleProducts.filter(p => getEffectiveStatus(p) === 'pending');
  const orderedProducts = visibleProducts.filter(p => getEffectiveStatus(p) === 'ordered');

  // Get other warehouse stock info for display
  const getOtherWarehouseStock = (product: PorSurtirProduct): string => {
    const stocks = warehouseStockMap.get(product.clave) || [];
    const relevantStocks = selectedWarehouse === 'all' 
      ? stocks.filter(s => s.existencias > 0)
      : stocks.filter(s => s.warehouse_id !== selectedWarehouse && s.existencias > 0);
    
    if (relevantStocks.length === 0) return '';
    
    return relevantStocks
      .map(s => `${s.existencias} pzas en ${s.warehouse_name}`)
      .join(', ');
  };

  const getWarehouseName = (): string => {
    if (selectedWarehouse === 'all') return 'Todos los almacenes';
    const warehouse = warehouses.find(w => w.id === selectedWarehouse);
    return warehouse?.name || 'Almacén';
  };

  // Find sibling por_surtir entries for same clave in other warehouses
  const getSiblingEntries = (product: PorSurtirProduct) => {
    return productsPorSurtir.filter(
      p => p.clave === product.clave && p.id !== product.id && !optimisticDeleted.has(p.id)
    );
  };

  // Render the delete dialog content based on context
  const renderDeleteDialog = (product: PorSurtirProduct) => {
    const siblings = getSiblingEntries(product);
    const hasSiblings = siblings.length > 0 && selectedWarehouse === 'all';
    const thisWarehouseName = product.warehouse_id
      ? warehouses.find(w => w.id === product.warehouse_id)?.name || 'Almacén'
      : null;

    if (!hasSiblings) {
      // Simple case: only one entry or filtered by warehouse
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Borrar producto</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto eliminará el producto "{product.nombre}" del almacén{selectedWarehouse !== 'all' ? ` ${getWarehouseName()}` : ''}, incluyendo su registro de existencias. No reaparecerá en la siguiente sincronización.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteProductMutation.mutate({
                  id: product.id,
                  productId: product.product_id,
                  scope: 'single',
                  clave: product.clave,
                  warehouseId: product.warehouse_id || (selectedWarehouse !== 'all' ? selectedWarehouse : null),
                })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // Multiple warehouses: show options
    const allWarehouseNames = [
      thisWarehouseName,
      ...siblings.map(s => s.warehouse_id ? warehouses.find(w => w.id === s.warehouse_id)?.name : null),
    ].filter(Boolean);

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <Trash2 className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Borrar producto</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿De qué almacén deseas eliminar?</DialogTitle>
            <DialogDescription>
              El producto "{product.nombre}" ({product.clave}) aparece en {allWarehouseNames.join(' y ')}. Selecciona de dónde deseas eliminarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {thisWarehouseName && (
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteProductMutation.mutate({
                    id: product.id,
                    productId: product.product_id,
                    scope: 'single',
                    clave: product.clave,
                    warehouseId: product.warehouse_id,
                  })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Solo de {thisWarehouseName}
                </Button>
              </DialogClose>
            )}
            {siblings.map(sibling => {
              const siblingName = sibling.warehouse_id
                ? warehouses.find(w => w.id === sibling.warehouse_id)?.name
                : 'Almacén desconocido';
              return (
                <DialogClose asChild key={sibling.id}>
                  <Button
                    variant="outline"
                    className="justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteProductMutation.mutate({
                      id: sibling.id,
                      productId: sibling.product_id,
                      scope: 'single',
                      clave: sibling.clave,
                      warehouseId: sibling.warehouse_id,
                    })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Solo de {siblingName}
                  </Button>
                </DialogClose>
              );
            })}
            <DialogClose asChild>
              <Button
                variant="destructive"
                className="justify-start"
                onClick={() => deleteProductMutation.mutate({
                  id: product.id,
                  productId: product.product_id,
                  scope: 'all',
                  clave: product.clave,
                })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                De todos los almacenes (eliminar producto)
              </Button>
            </DialogClose>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const handleCopyPending = () => {
    const today = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const header = `Productos por surtir ${today} de ${getWarehouseName()}\n\n`;
    const productsList = pendingProducts.map(p => {
      const otherStock = getOtherWarehouseStock(p);
      return `${p.nombre}${otherStock ? `, ${otherStock}` : ''} ${p.clave}`;
    }).join('\n');
    
    navigator.clipboard.writeText(header + productsList);
    toast({
      title: 'Copiado',
      description: `${pendingProducts.length} productos pendientes copiados.`,
    });
  };

  const handleCopyOrdered = () => {
    const today = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const header = `Pedidos en camino ${today} de ${getWarehouseName()}\n\n`;
    const productsList = orderedProducts.map(p => {
      const otherStock = getOtherWarehouseStock(p);
      return `${p.nombre}${otherStock ? `, ${otherStock}` : ''} ${p.clave}`;
    }).join('\n');
    
    navigator.clipboard.writeText(header + productsList);
    toast({
      title: 'Copiado',
      description: `${orderedProducts.length} pedidos en camino copiados.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Por Surtir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warehouse filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Almacén:</span>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los almacenes</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pending products */}
          {pendingProducts.length === 0 && orderedProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay productos por surtir. Los productos con 0 existencias aparecerán aquí automáticamente.
            </p>
          ) : (
            <>
              {/* Pending section */}
              {pendingProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Pendientes ({pendingProducts.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPending}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar todos
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pendingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{product.clave}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.nombre}
                            {product.warehouse_id && (
                              <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {warehouses.find(w => w.id === product.warehouse_id)?.name || 'Almacén'}
                              </span>
                            )}
                            {getOtherWarehouseStock(product) && (
                              <span className="text-blue-600 dark:text-blue-400 ml-1">
                                , {getOtherWarehouseStock(product)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex md:flex-row flex-col items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-300"
                            onClick={() => markAsOrderedMutation.mutate(product.id)}
                          >
                            <Truck className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Pedido y en camino</span>
                          </Button>
                          {renderDeleteDialog(product)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ordered section (green) */}
              {orderedProducts.length > 0 && (
                <div className="space-y-2 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-green-600 uppercase tracking-wide">
                      Pedidos en camino ({orderedProducts.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyOrdered}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar todos
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {orderedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-300 dark:border-green-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-green-700 dark:text-green-400">{product.clave}</div>
                          <div className="text-sm text-green-600 dark:text-green-500">
                            {product.nombre}
                            {product.warehouse_id && (
                              <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                {warehouses.find(w => w.id === product.warehouse_id)?.name || 'Almacén'}
                              </span>
                            )}
                            {getOtherWarehouseStock(product) && (
                              <span className="text-blue-600 dark:text-blue-400 ml-1">
                                , {getOtherWarehouseStock(product)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex md:flex-row flex-col items-center gap-2">
                          <button
                            onClick={() => markAsPendingMutation.mutate(product.id)}
                            className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-green-300 dark:hover:bg-green-700 transition-colors cursor-pointer"
                            title="Click para regresar a pendiente"
                          >
                            <Truck className="h-3 w-3" />
                            <span className="hidden md:inline">En camino</span>
                          </button>
                          {renderDeleteDialog(product)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Manual add form */}
          <div className="border-t border-border pt-4 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Agregar producto manualmente
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="CLAVE"
                value={newClave}
                onChange={(e) => setNewClave(e.target.value)}
                className="sm:w-32"
              />
              <Input
                placeholder="DESCRIPCIÓN"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddProduct}
                disabled={addProductMutation.isPending || !newClave.trim() || !newNombre.trim()}
              >
                {addProductMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPorSurtir;
