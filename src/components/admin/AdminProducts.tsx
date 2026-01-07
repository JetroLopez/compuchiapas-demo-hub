import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, Download, Trash2, Plus, Loader2, Search, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  clave: string | null;
  name: string;
  category_id: string | null;
  image_url: string | null;
  existencias: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface EditedProduct {
  clave?: string | null;
  name?: string;
  category_id?: string | null;
  image_url?: string | null;
  existencias?: number | null;
}

const AdminProducts: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editedProducts, setEditedProducts] = useState<Record<string, EditedProduct>>({});
  const [newProduct, setNewProduct] = useState({
    clave: '',
    name: '',
    category_id: '',
    image_url: '',
    existencias: 0,
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Reset edited products when products change (after save or refetch)
  useEffect(() => {
    setEditedProducts({});
  }, [products]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(editedProducts).length > 0;
  }, [editedProducts]);

  // Update a product field locally
  const updateProductField = (productId: string, field: keyof EditedProduct, value: string | number | null) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentEdits = editedProducts[productId] || {};
    const originalValue = product[field];
    
    // If the new value equals the original, remove the edit
    if (value === originalValue || (value === '' && originalValue === null)) {
      const { [field]: _, ...remainingEdits } = currentEdits;
      if (Object.keys(remainingEdits).length === 0) {
        const { [productId]: __, ...remainingProducts } = editedProducts;
        setEditedProducts(remainingProducts);
      } else {
        setEditedProducts({ ...editedProducts, [productId]: remainingEdits });
      }
    } else {
      setEditedProducts({
        ...editedProducts,
        [productId]: { ...currentEdits, [field]: value === '' ? null : value }
      });
    }
  };

  // Get the display value for a field (edited or original)
  const getFieldValue = (product: Product, field: keyof EditedProduct) => {
    const edited = editedProducts[product.id];
    if (edited && field in edited) {
      return edited[field];
    }
    return product[field];
  };

  // Save all changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(editedProducts).map(([id, changes]) => ({
        id,
        ...changes,
      }));

      for (const update of updates) {
        const { id, ...fields } = update;
        const { error } = await supabase
          .from('products')
          .update(fields)
          .eq('id', id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`${Object.keys(editedProducts).length} producto(s) actualizado(s)`);
      setEditedProducts({});
    },
    onError: () => {
      toast.error('Error al guardar cambios');
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const { error } = await supabase.from('products').insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Producto agregado');
      setIsAddDialogOpen(false);
      setNewProduct({ clave: '', name: '', category_id: '', image_url: '', existencias: 0 });
    },
    onError: () => {
      toast.error('Error al agregar producto');
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Producto eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar producto');
    },
  });

  // Import CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const claveIndex = headers.findIndex(h => h === 'clave');
        const nameIndex = headers.findIndex(h => h === 'descripcion' || h === 'name' || h === 'nombre');
        const imageIndex = headers.findIndex(h => h === 'image_url' || h === 'imagen');
        const existenciasIndex = headers.findIndex(h => h === 'existencias' || h === 'stock');
        const categoryIndex = headers.findIndex(h => h === 'category_id' || h === 'categoria');

        if (nameIndex === -1) {
          toast.error('El CSV debe tener una columna "descripcion" o "name"');
          return;
        }

        const productsToInsert = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          const product: any = {
            name: values[nameIndex] || '',
            clave: claveIndex !== -1 ? values[claveIndex] || null : null,
            image_url: imageIndex !== -1 ? values[imageIndex] || null : null,
            existencias: existenciasIndex !== -1 ? parseInt(values[existenciasIndex]) || 0 : 0,
            category_id: categoryIndex !== -1 ? values[categoryIndex] || null : null,
          };

          if (product.name) {
            productsToInsert.push(product);
          }
        }

        if (productsToInsert.length === 0) {
          toast.error('No se encontraron productos válidos en el CSV');
          return;
        }

        const { error } = await supabase.from('products').insert(productsToInsert);
        
        if (error) {
          toast.error('Error al importar productos');
          console.error(error);
        } else {
          toast.success(`${productsToInsert.length} productos importados`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        }
      } catch (error) {
        toast.error('Error al procesar el archivo CSV');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['clave', 'descripcion', 'image_url', 'existencias', 'category_id'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.clave || '',
        p.name,
        p.image_url || '',
        p.existencias || 0,
        p.category_id || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('CSV exportado');
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    addProductMutation.mutate({
      clave: newProduct.clave || null,
      name: newProduct.name,
      category_id: newProduct.category_id || null,
      image_url: newProduct.image_url || null,
      existencias: newProduct.existencias,
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.clave && p.clave.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isProductEdited = (productId: string) => {
    return productId in editedProducts;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Gestión de Productos</CardTitle>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              Importar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download size={16} className="mr-2" />
              Exportar CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus size={16} className="mr-2" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Producto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clave">Clave</Label>
                    <Input
                      id="clave"
                      value={newProduct.clave}
                      onChange={(e) => setNewProduct({ ...newProduct, clave: e.target.value })}
                      placeholder="ABC123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Descripción *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Nombre del producto"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newProduct.category_id}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="image_url">URL de Imagen</Label>
                    <Input
                      id="image_url"
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="existencias">Existencias</Label>
                    <Input
                      id="existencias"
                      type="number"
                      value={newProduct.existencias}
                      onChange={(e) => setNewProduct({ ...newProduct, existencias: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={handleAddProduct} className="w-full" disabled={addProductMutation.isPending}>
                    {addProductMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Agregar Producto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              size="sm" 
              variant={hasChanges ? "default" : "outline"}
              disabled={!hasChanges || saveChangesMutation.isPending}
              onClick={() => saveChangesMutation.mutate()}
              className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {saveChangesMutation.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {hasChanges && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            Hay {Object.keys(editedProducts).length} producto(s) con cambios sin guardar
          </div>
        )}

        {/* Products Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Clave</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead className="w-40">Categoría</TableHead>
                  <TableHead className="w-32">URL Imagen</TableHead>
                  <TableHead className="w-24 text-center">Existencias</TableHead>
                  <TableHead className="w-16 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      className={isProductEdited(product.id) ? "bg-amber-50/50 dark:bg-amber-950/30" : ""}
                    >
                      <TableCell className="p-1">
                        <Input
                          value={(getFieldValue(product, 'clave') as string) || ''}
                          onChange={(e) => updateProductField(product.id, 'clave', e.target.value)}
                          className="h-8 font-mono text-sm"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={(getFieldValue(product, 'name') as string) || ''}
                          onChange={(e) => updateProductField(product.id, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Select
                          value={(getFieldValue(product, 'category_id') as string) || ''}
                          onValueChange={(value) => updateProductField(product.id, 'category_id', value || null)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={(getFieldValue(product, 'image_url') as string) || ''}
                          onChange={(e) => updateProductField(product.id, 'image_url', e.target.value)}
                          className="h-8 text-xs w-28"
                          placeholder="URL"
                          title={(getFieldValue(product, 'image_url') as string) || ''}
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={(getFieldValue(product, 'existencias') as number) ?? 0}
                          onChange={(e) => updateProductField(product.id, 'existencias', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm text-center"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-4">
          Total: {filteredProducts.length} productos
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminProducts;
