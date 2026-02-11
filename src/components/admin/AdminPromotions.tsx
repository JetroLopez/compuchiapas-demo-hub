import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Search, Edit, Eye, EyeOff, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

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
  image_url: string | null;
  existencias: number | null;
}

const AdminPromotions: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    clave: '',
    nombre: '',
    descripcion: '',
    precio: '',
    existencias: '',
    img_url: '',
    is_active: true,
    display_order: '0',
  });

  // Fetch promotions
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Debounced product search term for server-side search
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearchTerm]);

  // Fetch products with server-side search (only when dialog is open and there's a search term)
  const { data: products = [], isFetching: productsFetching } = useQuery({
    queryKey: ['products-for-promo', debouncedProductSearch],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('id, clave, name, image_url, existencias')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(30);

      if (debouncedProductSearch.length >= 2) {
        // Split into tokens and build OR filter
        const tokens = debouncedProductSearch.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
        if (tokens.length > 0) {
          const orClauses = tokens.map(t => `name.ilike.%${t}%,clave.ilike.%${t}%`).join(',');
          query = query.or(orClauses);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isProductDialogOpen,
    staleTime: 30 * 1000,
  });

  // Add/Update promotion mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { clave: string; nombre: string; descripcion: string | null; precio: number; existencias: number | null; img_url: string | null; is_active: boolean; display_order: number }) => {
      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(data)
          .eq('id', editingPromotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success(editingPromotion ? 'Promoción actualizada' : 'Promoción agregada');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Delete promotion mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success('Promoción eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar promoción');
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const resetForm = () => {
    setFormData({
      clave: '',
      nombre: '',
      descripcion: '',
      precio: '',
      existencias: '',
      img_url: '',
      is_active: true,
      display_order: '0',
    });
    setEditingPromotion(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      clave: promo.clave,
      nombre: promo.nombre,
      descripcion: promo.descripcion || '',
      precio: promo.precio.toString(),
      existencias: promo.existencias?.toString() || '',
      img_url: promo.img_url || '',
      is_active: promo.is_active,
      display_order: promo.display_order?.toString() || '0',
    });
    setIsAddDialogOpen(true);
  };

  const handleAddFromProduct = (product: Product) => {
    setFormData({
      clave: product.clave || '',
      nombre: product.name,
      descripcion: '',
      precio: '',
      existencias: product.existencias?.toString() || '',
      img_url: product.image_url || '',
      is_active: true,
      display_order: '0',
    });
    setIsProductDialogOpen(false);
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.clave.trim() || !formData.nombre.trim() || !formData.precio) {
      toast.error('Clave, nombre y precio son requeridos');
      return;
    }

    saveMutation.mutate({
      clave: formData.clave.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      precio: parseFloat(formData.precio),
      existencias: formData.existencias ? parseInt(formData.existencias) : null,
      img_url: formData.img_url.trim() || null,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order) || 0,
    });
  };

  const filteredPromotions = promotions.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clave.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            Promociones y Productos Destacados
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* Add from Product */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Package size={16} className="mr-2" />
                  Desde Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar promoción desde producto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Buscar producto por nombre o clave..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {productsFetching ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : products.length === 0 ? (
                      <p className="text-center py-8 text-sm text-muted-foreground">
                        {debouncedProductSearch.length >= 2 ? 'Sin resultados. Intenta con otro término.' : 'Escribe al menos 2 caracteres para buscar...'}
                      </p>
                    ) : products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleAddFromProduct(product)}
                      >
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package size={20} className="text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.clave}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Plus size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add New */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsAddDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus size={16} className="mr-2" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingPromotion ? 'Editar promoción' : 'Agregar promoción'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clave">Clave *</Label>
                      <Input
                        id="clave"
                        value={formData.clave}
                        onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="precio">Precio *</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        placeholder="1999.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción breve del producto..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="existencias">Existencias</Label>
                      <Input
                        id="existencias"
                        type="number"
                        value={formData.existencias}
                        onChange={(e) => setFormData({ ...formData, existencias: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="display_order">Orden</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="img_url">URL de imagen (proporción 4:3 recomendada)</Label>
                    <Input
                      id="img_url"
                      value={formData.img_url}
                      onChange={(e) => setFormData({ ...formData, img_url: e.target.value })}
                      placeholder="https://..."
                    />
                    {formData.img_url && (
                      <div className="mt-2 aspect-[4/3] max-w-[200px] overflow-hidden rounded border">
                        <img
                          src={formData.img_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Activo (visible en landing)</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                      {editingPromotion ? 'Guardar cambios' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por nombre o clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <Badge variant="outline" className="text-sm">
            Total: {promotions.length}
          </Badge>
          <Badge variant="default" className="text-sm bg-green-500">
            Activas: {promotions.filter(p => p.is_active).length}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Inactivas: {promotions.filter(p => !p.is_active).length}
          </Badge>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {promotions.length === 0 ? 'No hay promociones. Agrega una para comenzar.' : 'No se encontraron resultados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>Clave</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promo) => (
                  <TableRow key={promo.id} className={!promo.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      {promo.img_url ? (
                        <img
                          src={promo.img_url}
                          alt={promo.nombre}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{promo.clave}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate font-medium">{promo.nombre}</p>
                      {promo.descripcion && (
                        <p className="text-xs text-muted-foreground truncate">{promo.descripcion}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-tech-blue">
                      {formatPrice(promo.precio)}
                    </TableCell>
                    <TableCell className="text-center">
                      {promo.existencias !== null ? promo.existencias : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: promo.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(promo)}
                        >
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará "{promo.nombre}" permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(promo.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPromotions;
