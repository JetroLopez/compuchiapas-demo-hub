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

interface PorSurtirProduct {
  id: string;
  product_id: string | null;
  clave: string;
  nombre: string;
  status: string;
  created_at: string;
}

const AdminPorSurtir: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newClave, setNewClave] = useState('');
  const [newNombre, setNewNombre] = useState('');

  // Fetch products por surtir
  const { data: productsPorSurtir = [], isLoading } = useQuery({
    queryKey: ['products-por-surtir'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_por_surtir')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PorSurtirProduct[];
    },
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

  // Mark as ordered (in transit)
  const markAsOrderedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products_por_surtir')
        .update({ status: 'ordered' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
      toast({
        title: 'Estado actualizado',
        description: 'El producto ha sido marcado como pedido y en camino.',
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

  // Delete product completely
  const deleteProductMutation = useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string | null }) => {
      // Delete from por_surtir list
      const { error: porSurtirError } = await supabase
        .from('products_por_surtir')
        .delete()
        .eq('id', id);
      
      if (porSurtirError) throw porSurtirError;

      // If has associated product, delete from products table too
      if (productId) {
        const { error: productError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        
        if (productError) throw productError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-por-surtir'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Producto eliminado',
        description: 'El producto ha sido eliminado completamente.',
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

  const pendingProducts = productsPorSurtir.filter(p => p.status === 'pending');
  const orderedProducts = productsPorSurtir.filter(p => p.status === 'ordered');

  const handleCopyAll = () => {
    const allProducts = [...pendingProducts, ...orderedProducts];
    const text = allProducts.map(p => `${p.nombre} ${p.clave}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: `${allProducts.length} productos copiados al portapapeles.`,
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
          {/* Copy all button */}
          {(pendingProducts.length > 0 || orderedProducts.length > 0) && (
            <Button
              variant="outline"
              onClick={handleCopyAll}
              className="w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar todos ({pendingProducts.length + orderedProducts.length})
            </Button>
          )}

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
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Pendientes ({pendingProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{product.clave}</div>
                          <div className="text-sm text-muted-foreground">{product.nombre}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-300"
                            onClick={() => markAsOrderedMutation.mutate(product.id)}
                            disabled={markAsOrderedMutation.isPending}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Pedido y en camino
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Borrar producto
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esto eliminará el producto "{product.nombre}" completamente de la base de datos. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate({ 
                                    id: product.id, 
                                    productId: product.product_id 
                                  })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ordered section (green) */}
              {orderedProducts.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h3 className="font-semibold text-sm text-green-600 uppercase tracking-wide">
                    Pedidos en camino ({orderedProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {orderedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-300 dark:border-green-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-green-700 dark:text-green-400">{product.clave}</div>
                          <div className="text-sm text-green-600 dark:text-green-500">{product.nombre}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            En camino
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esto eliminará el producto "{product.nombre}" completamente de la base de datos. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate({ 
                                    id: product.id, 
                                    productId: product.product_id 
                                  })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
