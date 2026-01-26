import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Settings, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAllComponentSpecs, getComponentTypeFromCategory } from '@/hooks/useCompatibility';
import { COMPONENT_LABELS, COMPONENT_ICONS, ProductWithSpec, ComponentSpec } from '@/lib/compatibility-rules';

type ComponentType = 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'psu' | 'case' | 'storage';

const SOCKET_OPTIONS = ['AM4', 'AM5', 'LGA1700', 'LGA1200', 'LGA1151'];
const RAM_TYPE_OPTIONS = ['DDR4', 'DDR5', 'DDR3'];
const FORM_FACTOR_OPTIONS = ['ATX', 'mATX', 'ITX', 'EATX'];
const PSU_EFFICIENCY_OPTIONS = ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'];
const STORAGE_TYPE_OPTIONS = ['SSD NVMe', 'SSD SATA', 'HDD', 'SSD M.2'];

const AdminComponentSpecs: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<ProductWithSpec | null>(null);
  const [specs, setSpecs] = useState<Partial<ComponentSpec>>({});

  const { data: products = [], isLoading } = useAllComponentSpecs();

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clave?.toLowerCase().includes(search.toLowerCase());
    
    const componentType = getComponentTypeFromCategory(p.category_id);
    const matchesType = filterType === 'all' || componentType === filterType;
    
    return matchesSearch && matchesType;
  });

  // Save specs mutation
  const saveMutation = useMutation({
    mutationFn: async ({ productId, componentType, specs }: { 
      productId: string; 
      componentType: ComponentType;
      specs: Partial<ComponentSpec>;
    }) => {
      // Check if specs exist
      const { data: existing } = await supabase
        .from('component_specs')
        .select('id')
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('component_specs')
          .update({
            component_type: componentType,
            ...specs,
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', productId);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('component_specs')
          .insert({
            product_id: productId,
            component_type: componentType,
            ...specs,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-component-specs'] });
      queryClient.invalidateQueries({ queryKey: ['component-products'] });
      toast({
        title: 'Guardado',
        description: 'Especificaciones guardadas correctamente',
      });
      setEditingProduct(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las especificaciones',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // Delete specs mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('component_specs')
        .delete()
        .eq('product_id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-component-specs'] });
      queryClient.invalidateQueries({ queryKey: ['component-products'] });
      toast({
        title: 'Eliminado',
        description: 'Especificaciones eliminadas',
      });
      setEditingProduct(null);
    },
  });

  const openEditor = (product: ProductWithSpec) => {
    setEditingProduct(product);
    if (product.spec) {
      setSpecs(product.spec);
    } else {
      const componentType = getComponentTypeFromCategory(product.category_id);
      setSpecs({ component_type: componentType as ComponentType });
    }
  };

  const handleSave = () => {
    if (!editingProduct || !specs.component_type) return;
    
    saveMutation.mutate({
      productId: editingProduct.id,
      componentType: specs.component_type as ComponentType,
      specs,
    });
  };

  const handleDelete = () => {
    if (!editingProduct?.spec) return;
    deleteMutation.mutate(editingProduct.id);
  };

  const renderSpecFields = (type: ComponentType) => {
    switch (type) {
      case 'cpu':
        return (
          <>
            <div>
              <Label>Socket</Label>
              <Select value={specs.socket || ''} onValueChange={(v) => setSpecs({ ...specs, socket: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar socket" /></SelectTrigger>
                <SelectContent>
                  {SOCKET_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>TDP (Watts)</Label>
              <Input
                type="number"
                value={specs.cpu_tdp || ''}
                onChange={(e) => setSpecs({ ...specs, cpu_tdp: parseInt(e.target.value) || undefined })}
                placeholder="65"
              />
            </div>
          </>
        );

      case 'motherboard':
        return (
          <>
            <div>
              <Label>Socket</Label>
              <Select value={specs.socket || ''} onValueChange={(v) => setSpecs({ ...specs, socket: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar socket" /></SelectTrigger>
                <SelectContent>
                  {SOCKET_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de RAM</Label>
              <Select value={specs.ram_type || ''} onValueChange={(v) => setSpecs({ ...specs, ram_type: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {RAM_TYPE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Factor de Forma</Label>
              <Select value={specs.form_factor || ''} onValueChange={(v) => setSpecs({ ...specs, form_factor: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tamaño" /></SelectTrigger>
                <SelectContent>
                  {FORM_FACTOR_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Slots de RAM</Label>
              <Input
                type="number"
                value={specs.ram_slots || ''}
                onChange={(e) => setSpecs({ ...specs, ram_slots: parseInt(e.target.value) || undefined })}
                placeholder="4"
              />
            </div>
            <div>
              <Label>Velocidad máx RAM (MHz)</Label>
              <Input
                type="number"
                value={specs.max_ram_speed || ''}
                onChange={(e) => setSpecs({ ...specs, max_ram_speed: parseInt(e.target.value) || undefined })}
                placeholder="3200"
              />
            </div>
            <div>
              <Label>Slots M.2</Label>
              <Input
                type="number"
                value={specs.m2_slots || ''}
                onChange={(e) => setSpecs({ ...specs, m2_slots: parseInt(e.target.value) || undefined })}
                placeholder="2"
              />
            </div>
            <div>
              <Label>Chipset</Label>
              <Input
                value={specs.chipset || ''}
                onChange={(e) => setSpecs({ ...specs, chipset: e.target.value })}
                placeholder="B550, Z790, A620..."
              />
            </div>
          </>
        );

      case 'ram':
        return (
          <>
            <div>
              <Label>Tipo de RAM</Label>
              <Select value={specs.ram_type || ''} onValueChange={(v) => setSpecs({ ...specs, ram_type: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {RAM_TYPE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacidad (GB por módulo)</Label>
              <Input
                type="number"
                value={specs.ram_capacity || ''}
                onChange={(e) => setSpecs({ ...specs, ram_capacity: parseInt(e.target.value) || undefined })}
                placeholder="8"
              />
            </div>
            <div>
              <Label>Velocidad (MHz)</Label>
              <Input
                type="number"
                value={specs.ram_speed || ''}
                onChange={(e) => setSpecs({ ...specs, ram_speed: parseInt(e.target.value) || undefined })}
                placeholder="3200"
              />
            </div>
            <div>
              <Label>Módulos en el kit</Label>
              <Input
                type="number"
                value={specs.ram_modules || ''}
                onChange={(e) => setSpecs({ ...specs, ram_modules: parseInt(e.target.value) || undefined })}
                placeholder="2"
              />
            </div>
          </>
        );

      case 'gpu':
        return (
          <>
            <div>
              <Label>TDP (Watts)</Label>
              <Input
                type="number"
                value={specs.gpu_tdp || ''}
                onChange={(e) => setSpecs({ ...specs, gpu_tdp: parseInt(e.target.value) || undefined })}
                placeholder="250"
              />
            </div>
            <div>
              <Label>Longitud (mm)</Label>
              <Input
                type="number"
                value={specs.gpu_length || ''}
                onChange={(e) => setSpecs({ ...specs, gpu_length: parseInt(e.target.value) || undefined })}
                placeholder="300"
              />
            </div>
          </>
        );

      case 'psu':
        return (
          <>
            <div>
              <Label>Potencia (Watts)</Label>
              <Input
                type="number"
                value={specs.psu_wattage || ''}
                onChange={(e) => setSpecs({ ...specs, psu_wattage: parseInt(e.target.value) || undefined })}
                placeholder="650"
              />
            </div>
            <div>
              <Label>Eficiencia</Label>
              <Select value={specs.psu_efficiency || ''} onValueChange={(v) => setSpecs({ ...specs, psu_efficiency: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar certificación" /></SelectTrigger>
                <SelectContent>
                  {PSU_EFFICIENCY_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'case':
        return (
          <>
            <div>
              <Label>Factores de forma soportados</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FORM_FACTOR_OPTIONS.map(ff => {
                  const isSelected = specs.case_form_factors?.includes(ff);
                  return (
                    <Badge
                      key={ff}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = specs.case_form_factors || [];
                        const updated = isSelected
                          ? current.filter(f => f !== ff)
                          : [...current, ff];
                        setSpecs({ ...specs, case_form_factors: updated });
                      }}
                    >
                      {ff}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Longitud máxima GPU (mm)</Label>
              <Input
                type="number"
                value={specs.case_max_gpu_length || ''}
                onChange={(e) => setSpecs({ ...specs, case_max_gpu_length: parseInt(e.target.value) || undefined })}
                placeholder="350"
              />
            </div>
          </>
        );

      case 'storage':
        return (
          <>
            <div>
              <Label>Tipo</Label>
              <Select value={specs.storage_type || ''} onValueChange={(v) => setSpecs({ ...specs, storage_type: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {STORAGE_TYPE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacidad (GB)</Label>
              <Input
                type="number"
                value={specs.storage_capacity || ''}
                onChange={(e) => setSpecs({ ...specs, storage_capacity: parseInt(e.target.value) || undefined })}
                placeholder="1000"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Especificaciones de Componentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nombre o clave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {COMPONENT_ICONS[key]} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredProducts.map(product => {
                  const componentType = getComponentTypeFromCategory(product.category_id);
                  const hasSpecs = !!product.spec;
                  
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => openEditor(product)}
                    >
                      <div className="text-lg">
                        {componentType ? COMPONENT_ICONS[componentType] : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.clave}</p>
                      </div>
                      <Badge variant={hasSpecs ? "default" : "secondary"}>
                        {hasSpecs ? (
                          <><Check size={12} className="mr-1" /> Configurado</>
                        ) : (
                          'Sin specs'
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {filteredProducts.length} productos • {filteredProducts.filter(p => p.spec).length} con especificaciones
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Especificaciones</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{editingProduct.name}</p>
                <p className="text-sm text-muted-foreground">{editingProduct.clave}</p>
              </div>

              <div>
                <Label>Tipo de Componente</Label>
                <Select 
                  value={specs.component_type || ''} 
                  onValueChange={(v) => setSpecs({ ...specs, component_type: v as ComponentType })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {COMPONENT_ICONS[key]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {specs.component_type && (
                <div className="grid grid-cols-2 gap-4">
                  {renderSpecFields(specs.component_type as ComponentType)}
                </div>
              )}

              <div className="flex justify-between pt-4">
                {editingProduct.spec && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <X size={16} className="mr-2" />
                    Eliminar specs
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!specs.component_type || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Check size={16} className="mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComponentSpecs;
