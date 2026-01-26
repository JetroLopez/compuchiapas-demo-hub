import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, Download, Trash2, Plus, Loader2, Search, Save, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import * as XLSX from 'xlsx';
import ExhibitedWarehousesToggle from './ExhibitedWarehousesToggle';
import { calculatePrice, formatPrice } from '@/lib/price-utils';

interface Product {
  id: string;
  clave: string | null;
  name: string;
  category_id: string | null;
  image_url: string | null;
  existencias: number | null;
  costo: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface ProductWarehouseStock {
  product_id: string;
  warehouse_id: string;
  existencias: number;
}

interface EditedProduct {
  clave?: string | null;
  name?: string;
  category_id?: string | null;
  image_url?: string | null;
  existencias?: number | null;
}

type AppRole = 'admin' | 'tecnico' | 'ventas' | 'user';

interface AdminProductsProps {
  userRole?: AppRole | null;
}

const INITIAL_ITEMS = 10;

const AdminProducts: React.FC<AdminProductsProps> = ({ userRole }) => {
  const queryClient = useQueryClient();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  
  // Role-based permissions
  const canDelete = userRole === 'admin';
  const canDeleteAll = userRole === 'admin';
  const canExport = userRole === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedProducts, setEditedProducts] = useState<Record<string, EditedProduct>>({});
  const [showAll, setShowAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [newProduct, setNewProduct] = useState({
    clave: '',
    name: '',
    category_id: '',
    image_url: '',
    existencias: 0,
  });

  // Fetch products with pagination to overcome 1000 row limit
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
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
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts.push(...data);
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allProducts;
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

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product warehouse stock with pagination
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

  // Delete all products
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Todos los productos han sido eliminados');
    } catch (error: any) {
      toast.error(`Error al eliminar productos: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Parse products from array of rows
  const parseProductRows = (rows: any[], headers: string[], validCategoryIds: Set<string>): any[] => {
    const normalizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());
    
    const claveIndex = normalizedHeaders.findIndex(h => h === 'clave');
    const nameIndex = normalizedHeaders.findIndex(h => h === 'descripcion' || h === 'name' || h === 'nombre');
    const imageIndex = normalizedHeaders.findIndex(h => h === 'image_url' || h === 'imagen' || h === 'img_url');
    const existenciasIndex = normalizedHeaders.findIndex(h => h === 'existencias' || h === 'stock');
    const categoryIndex = normalizedHeaders.findIndex(h => h === 'category_id' || h === 'categoria' || h === 'linea');

    if (nameIndex === -1) {
      throw new Error('El archivo debe tener una columna "descripcion" o "name"');
    }

    const productsToInsert = [];
    for (const row of rows) {
      const values = Array.isArray(row) ? row : Object.values(row);
      
      const rawCategoryId = categoryIndex !== -1 ? String(values[categoryIndex] || '').trim() : null;
      // Validate category_id exists, otherwise set to null
      const categoryId = rawCategoryId && validCategoryIds.has(rawCategoryId) ? rawCategoryId : null;
      
      const product: any = {
        name: String(values[nameIndex] || '').trim(),
        clave: claveIndex !== -1 ? String(values[claveIndex] || '').trim() || null : null,
        image_url: imageIndex !== -1 ? String(values[imageIndex] || '').trim() || null : null,
        existencias: existenciasIndex !== -1 ? parseInt(String(values[existenciasIndex])) || 0 : 0,
        category_id: categoryId,
      };

      if (product.name) {
        productsToInsert.push(product);
      }
    }

    return productsToInsert;
  };

  // Import CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Fetch valid category IDs
        const { data: categoriesData } = await supabase.from('categories').select('id');
        const validCategoryIds = new Set((categoriesData || []).map(c => c.id));

        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
        const productsToInsert = parseProductRows(rows, headers, validCategoryIds);

        if (productsToInsert.length === 0) {
          toast.error('No se encontraron productos válidos en el CSV');
          return;
        }

        const { error } = await supabase.from('products').insert(productsToInsert);
        
        if (error) {
          toast.error(`Error al importar productos: ${error.message}`);
        } else {
          toast.success(`${productsToInsert.length} productos importados`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        }
      } catch (error: any) {
        toast.error(error.message || 'Error al procesar el archivo CSV');
      }
    };
    reader.readAsText(file);
    
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  // Import XLSX
  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Fetch valid category IDs
        const { data: categoriesData } = await supabase.from('categories').select('id');
        const validCategoryIds = new Set((categoriesData || []).map(c => c.id));

        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          toast.error('El archivo XLSX está vacío o no tiene datos');
          return;
        }

        const headers = jsonData[0].map(h => String(h || ''));
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
        
        const productsToInsert = parseProductRows(rows, headers, validCategoryIds);

        if (productsToInsert.length === 0) {
          toast.error('No se encontraron productos válidos en el XLSX');
          return;
        }

        const { error } = await supabase.from('products').insert(productsToInsert);
        
        if (error) {
          toast.error(`Error al importar productos: ${error.message}`);
        } else {
          toast.success(`${productsToInsert.length} productos importados desde XLSX`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        }
      } catch (error: any) {
        toast.error(error.message || 'Error al procesar el archivo XLSX');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
    
    if (xlsxInputRef.current) {
      xlsxInputRef.current.value = '';
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

  // Export XLSX
  const handleExportXLSX = () => {
    const data = products.map(p => ({
      clave: p.clave || '',
      descripcion: p.name,
      image_url: p.image_url || '',
      existencias: p.existencias || 0,
      category_id: p.category_id || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    XLSX.writeFile(workbook, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('XLSX exportado');
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
      costo: 0,
    });
  };

  // Get product warehouse IDs for filtering (only with stock > 0)
  const getProductWarehouseIds = (productId: string): string[] => {
    return warehouseStock
      .filter(ws => ws.product_id === productId && ws.existencias > 0)
      .map(ws => ws.warehouse_id);
  };

  // Get all warehouse IDs where a product exists (regardless of stock level)
  const getProductWarehouseIdsAll = (productId: string): string[] => {
    return warehouseStock
      .filter(ws => ws.product_id === productId)
      .map(ws => ws.warehouse_id);
  };

  // Get total stock for a product across all warehouses
  const getProductTotalStock = (productId: string): number => {
    return warehouseStock
      .filter(ws => ws.product_id === productId)
      .reduce((sum, ws) => sum + ws.existencias, 0);
  };

  // Get warehouses info for a product
  const getProductWarehouses = (productId: string): string => {
    const productWarehouses = warehouseStock
      .filter(ws => ws.product_id === productId && ws.existencias > 0)
      .map(ws => {
        const warehouse = warehouses.find(w => w.id === ws.warehouse_id);
        return warehouse ? `${warehouse.name}: ${ws.existencias}` : null;
      })
      .filter(Boolean);
    return productWarehouses.join(', ') || '-';
  };

  const filteredProducts = products.filter(p => {
    // Text search filter
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clave && p.clave.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Warehouse filter - use different logic based on showZeroStock
    const matchesWarehouse = selectedWarehouse === 'all' || 
      (showZeroStock 
        ? getProductWarehouseIdsAll(p.id).includes(selectedWarehouse)
        : getProductWarehouseIds(p.id).includes(selectedWarehouse));
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      p.category_id === selectedCategory;
    
    // Zero stock filter
    const totalStock = getProductTotalStock(p.id);
    const matchesStockFilter = showZeroStock || totalStock > 0;
    
    return matchesSearch && matchesWarehouse && matchesCategory && matchesStockFilter;
  });

  // Productos a mostrar según paginación
  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, INITIAL_ITEMS);
  const remainingCount = filteredProducts.length - INITIAL_ITEMS;
  const hasMoreProducts = !showAll && remainingCount > 0;

  const handleShowMore = async () => {
    setIsLoadingMore(true);
    // Simular carga para mejor UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowAll(true);
    setIsLoadingMore(false);
  };

  // Reset showAll when search changes
  useEffect(() => {
    setShowAll(false);
  }, [searchTerm]);

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
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <input
              ref={xlsxInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportXLSX}
              className="hidden"
            />
            
            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload size={16} className="mr-2" />
                  Importar
                  <ChevronDown size={14} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => csvInputRef.current?.click()}>
                  Importar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => xlsxInputRef.current?.click()}>
                  Importar XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Export Dropdown - Only for admin */}
            {canExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download size={16} className="mr-2" />
                    Exportar
                    <ChevronDown size={14} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportXLSX}>
                    Exportar XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Exhibited Warehouses Toggle - Only for admin */}
            {canExport && <ExhibitedWarehousesToggle />}

            {/* Show Zero Stock Toggle */}
            <div className="flex items-center gap-2 px-3 py-1 border rounded-md bg-background">
              <Switch
                id="show-zero-stock"
                checked={showZeroStock}
                onCheckedChange={setShowZeroStock}
              />
              <Label htmlFor="show-zero-stock" className="text-sm cursor-pointer whitespace-nowrap">
                Mostrar sin existencias
              </Label>
            </div>

            {/* Delete All Button - Only for admin */}
            {canDeleteAll && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 size={16} className="mr-2" />
                    Borrar todo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará TODOS los productos de la base de datos. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAll}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sí, borrar todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

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
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Warehouse Filter */}
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por almacén" />
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
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle for Prices and Zero Stock */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-prices"
              checked={showPrices}
              onCheckedChange={setShowPrices}
            />
            <Label htmlFor="show-prices" className="text-sm">
              Mostrar precios
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-zero-stock"
              checked={showZeroStock}
              onCheckedChange={setShowZeroStock}
            />
            <Label htmlFor="show-zero-stock" className="text-sm">
              Mostrar productos sin stock
            </Label>
          </div>
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
                  <TableHead className="w-40">Almacenes</TableHead>
                  <TableHead className="w-32">URL Imagen</TableHead>
                  <TableHead className="w-24 text-center">Existencias</TableHead>
                  {showPrices && (
                    <>
                      <TableHead className="w-24 text-right">Costo</TableHead>
                      <TableHead className="w-24 text-right">Precio</TableHead>
                    </>
                  )}
                  <TableHead className="w-16 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showPrices ? 9 : 7} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedProducts.map((product) => (
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
                      <TableCell className="p-1 text-xs text-muted-foreground">
                        {getProductWarehouses(product.id)}
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
                      {showPrices && (
                        <>
                          <TableCell className="p-1 text-right font-mono text-sm text-muted-foreground">
                            ${(product.costo ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="p-1 text-right font-mono text-sm font-medium">
                            {formatPrice(calculatePrice(product.costo, product.category_id))}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="p-1 text-right">
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Show more button */}
        {!isLoading && hasMoreProducts && (
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={handleShowMore}
              disabled={isLoadingMore}
              className="min-w-[200px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Espere un momento...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Mostrar {remainingCount} productos más
                </>
              )}
            </Button>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-4">
          {showAll || filteredProducts.length <= INITIAL_ITEMS 
            ? `Total: ${filteredProducts.length} productos`
            : `Mostrando ${displayedProducts.length} de ${filteredProducts.length} productos`
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminProducts;
