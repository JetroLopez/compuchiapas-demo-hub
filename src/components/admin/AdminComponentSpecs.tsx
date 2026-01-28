import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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

type ComponentType = 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'psu' | 'case' | 'storage' | 'cooling';

const SOCKET_OPTIONS = ['AM4', 'AM5', 'LGA1700', 'LGA1200'];
const RAM_TYPE_OPTIONS = ['DDR4', 'DDR5', 'DDR3'];
const FORM_FACTOR_OPTIONS = ['ATX', 'mATX', 'ITX', 'EATX'];
const PSU_EFFICIENCY_OPTIONS = ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'];
const PSU_FORM_FACTOR_OPTIONS = ['ATX', 'SFX', 'SFX-L', 'TFX', 'Flex ATX'];
const COLOR_OPTIONS = ['Negro', 'Blanco', 'Otro'];
const PSU_POSITION_OPTIONS = ['Superior', 'Inferior', 'Trasero'];
const M2_SIZE_OPTIONS = ['2242', '2260', '2280', '22110'];
const COOLING_TYPE_OPTIONS = ['Aire', 'Líquido'];

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

      const specData = {
        component_type: componentType,
        // Common
        is_gamer: specs.is_gamer,
        // CPU
        socket: specs.socket,
        cpu_tdp: specs.cpu_tdp,
        cpu_base_frequency: specs.cpu_base_frequency,
        cpu_has_igpu: specs.cpu_has_igpu,
        // Motherboard
        ram_type: specs.ram_type,
        form_factor: specs.form_factor,
        ram_slots: specs.ram_slots,
        max_ram_speed: specs.max_ram_speed,
        m2_slots: specs.m2_slots,
        chipset: specs.chipset,
        // RAM
        ram_capacity: specs.ram_capacity,
        ram_speed: specs.ram_speed,
        ram_modules: specs.ram_modules,
        // GPU
        gpu_tdp: specs.gpu_tdp,
        gpu_length: specs.gpu_length,
        gpu_hdmi_ports: specs.gpu_hdmi_ports,
        gpu_displayport_ports: specs.gpu_displayport_ports,
        gpu_mini_displayport_ports: specs.gpu_mini_displayport_ports,
        gpu_vga_ports: specs.gpu_vga_ports,
        gpu_dvi_ports: specs.gpu_dvi_ports,
        gpu_brand: specs.gpu_brand,
        // PSU
        psu_wattage: specs.psu_wattage,
        psu_efficiency: specs.psu_efficiency,
        psu_form_factor: specs.psu_form_factor,
        psu_color: specs.psu_color,
        psu_modular: specs.psu_modular,
        psu_pcie_cable: specs.psu_pcie_cable,
        // Case
        case_max_gpu_length: specs.case_max_gpu_length,
        case_form_factors: specs.case_form_factors,
        case_color: specs.case_color,
        case_fans_included: specs.case_fans_included,
        case_fans_count: specs.case_fans_count,
        case_psu_position: specs.case_psu_position,
        // Storage
        storage_type: specs.storage_type,
        storage_capacity: specs.storage_capacity,
        storage_interface: specs.storage_interface,
        storage_subtype: specs.storage_subtype,
        storage_m2_size: specs.storage_m2_size,
        storage_speed: specs.storage_speed,
        storage_has_heatsink: specs.storage_has_heatsink,
        // Cooling
        cooling_fans_count: specs.cooling_fans_count,
        cooling_color: specs.cooling_color,
        cooling_type: specs.cooling_type,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('component_specs')
          .update(specData)
          .eq('product_id', productId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('component_specs')
          .insert({
            product_id: productId,
            ...specData,
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

  const renderGamerCheckbox = () => (
    <div className="col-span-2 flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
      <Checkbox
        id="is_gamer"
        checked={specs.is_gamer || false}
        onCheckedChange={(checked) => setSpecs({ ...specs, is_gamer: checked as boolean })}
      />
      <Label htmlFor="is_gamer" className="cursor-pointer font-medium text-purple-700 dark:text-purple-300">
        🎮 Producto Gamer
      </Label>
    </div>
  );

  const renderSpecFields = (type: ComponentType) => {
    switch (type) {
      case 'cpu':
        return (
          <>
            {renderGamerCheckbox()}
            <div className="col-span-2 flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <Checkbox
                id="cpu_has_igpu"
                checked={specs.cpu_has_igpu || false}
                onCheckedChange={(checked) => setSpecs({ ...specs, cpu_has_igpu: checked as boolean })}
              />
              <Label htmlFor="cpu_has_igpu" className="cursor-pointer font-medium text-blue-700 dark:text-blue-300">
                🖥️ Incluye Gráficos Integrados
              </Label>
            </div>
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
            <div>
              <Label>Frecuencia Base (GHz)</Label>
              <Input
                type="number"
                step="0.1"
                value={specs.cpu_base_frequency || ''}
                onChange={(e) => setSpecs({ ...specs, cpu_base_frequency: parseFloat(e.target.value) || undefined })}
                placeholder="3.6"
              />
            </div>
          </>
        );

      case 'motherboard':
        return (
          <>
            {renderGamerCheckbox()}
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
            {(specs.m2_slots || 0) > 0 && (
              <div>
                <Label>Tamaño máximo M.2</Label>
                <Select value={specs.storage_m2_size || ''} onValueChange={(v) => setSpecs({ ...specs, storage_m2_size: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tamaño" /></SelectTrigger>
                  <SelectContent>
                    {M2_SIZE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            {renderGamerCheckbox()}
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
            {renderGamerCheckbox()}
            <div>
              <Label>Marca</Label>
              <Input
                value={specs.gpu_brand || ''}
                onChange={(e) => setSpecs({ ...specs, gpu_brand: e.target.value })}
                placeholder="NVIDIA, AMD, Intel..."
              />
            </div>
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
            
            <div className="col-span-2">
              <Label className="mb-3 block">Salidas de Video</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(specs.gpu_hdmi_ports || 0) > 0}
                    onCheckedChange={(checked) => setSpecs({ ...specs, gpu_hdmi_ports: checked ? 1 : 0 })}
                  />
                  <span className="text-sm">HDMI</span>
                  {(specs.gpu_hdmi_ports || 0) > 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="w-16 h-8"
                      value={specs.gpu_hdmi_ports || 1}
                      onChange={(e) => setSpecs({ ...specs, gpu_hdmi_ports: parseInt(e.target.value) || 1 })}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(specs.gpu_displayport_ports || 0) > 0}
                    onCheckedChange={(checked) => setSpecs({ ...specs, gpu_displayport_ports: checked ? 1 : 0 })}
                  />
                  <span className="text-sm">DisplayPort</span>
                  {(specs.gpu_displayport_ports || 0) > 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="w-16 h-8"
                      value={specs.gpu_displayport_ports || 1}
                      onChange={(e) => setSpecs({ ...specs, gpu_displayport_ports: parseInt(e.target.value) || 1 })}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(specs.gpu_mini_displayport_ports || 0) > 0}
                    onCheckedChange={(checked) => setSpecs({ ...specs, gpu_mini_displayport_ports: checked ? 1 : 0 })}
                  />
                  <span className="text-sm">Mini DP</span>
                  {(specs.gpu_mini_displayport_ports || 0) > 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="w-16 h-8"
                      value={specs.gpu_mini_displayport_ports || 1}
                      onChange={(e) => setSpecs({ ...specs, gpu_mini_displayport_ports: parseInt(e.target.value) || 1 })}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(specs.gpu_vga_ports || 0) > 0}
                    onCheckedChange={(checked) => setSpecs({ ...specs, gpu_vga_ports: checked ? 1 : 0 })}
                  />
                  <span className="text-sm">VGA</span>
                  {(specs.gpu_vga_ports || 0) > 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="w-16 h-8"
                      value={specs.gpu_vga_ports || 1}
                      onChange={(e) => setSpecs({ ...specs, gpu_vga_ports: parseInt(e.target.value) || 1 })}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(specs.gpu_dvi_ports || 0) > 0}
                    onCheckedChange={(checked) => setSpecs({ ...specs, gpu_dvi_ports: checked ? 1 : 0 })}
                  />
                  <span className="text-sm">DVI</span>
                  {(specs.gpu_dvi_ports || 0) > 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      className="w-16 h-8"
                      value={specs.gpu_dvi_ports || 1}
                      onChange={(e) => setSpecs({ ...specs, gpu_dvi_ports: parseInt(e.target.value) || 1 })}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        );

      case 'psu':
        return (
          <>
            {renderGamerCheckbox()}
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
            <div>
              <Label>Factor de Forma</Label>
              <Select value={specs.psu_form_factor || ''} onValueChange={(v) => setSpecs({ ...specs, psu_form_factor: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar factor" /></SelectTrigger>
                <SelectContent>
                  {PSU_FORM_FACTOR_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Select value={specs.psu_color || ''} onValueChange={(v) => setSpecs({ ...specs, psu_color: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Switch
                checked={specs.psu_modular || false}
                onCheckedChange={(checked) => setSpecs({ ...specs, psu_modular: checked })}
              />
              <Label>Modular</Label>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Switch
                checked={specs.psu_pcie_cable || false}
                onCheckedChange={(checked) => setSpecs({ ...specs, psu_pcie_cable: checked })}
              />
              <Label>Cable PCI-E (GPU)</Label>
            </div>
          </>
        );

      case 'case':
        return (
          <>
            {renderGamerCheckbox()}
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
            <div>
              <Label>Color</Label>
              <Select value={specs.case_color || ''} onValueChange={(v) => setSpecs({ ...specs, case_color: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posición de la Fuente</Label>
              <Select value={specs.case_psu_position || ''} onValueChange={(v) => setSpecs({ ...specs, case_psu_position: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar posición" /></SelectTrigger>
                <SelectContent>
                  {PSU_POSITION_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Switch
                checked={specs.case_fans_included || false}
                onCheckedChange={(checked) => setSpecs({ ...specs, case_fans_included: checked, case_fans_count: checked ? 1 : 0 })}
              />
              <Label>Incluye Ventiladores</Label>
            </div>
            {specs.case_fans_included && (
              <div>
                <Label>Cantidad de Ventiladores</Label>
                <Input
                  type="number"
                  min="1"
                  value={specs.case_fans_count || 1}
                  onChange={(e) => setSpecs({ ...specs, case_fans_count: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                />
              </div>
            )}
          </>
        );

      case 'storage':
        return (
          <>
            {renderGamerCheckbox()}
            <div>
              <Label>Interfaz Principal</Label>
              <Select 
                value={specs.storage_interface || ''} 
                onValueChange={(v) => setSpecs({ 
                  ...specs, 
                  storage_interface: v,
                  storage_subtype: undefined,
                  storage_m2_size: undefined,
                  storage_type: undefined
                })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar interfaz" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M2">M.2</SelectItem>
                  <SelectItem value="SATA">SATA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {specs.storage_interface === 'M2' && (
              <>
                <div>
                  <Label>Tipo M.2</Label>
                  <Select 
                    value={specs.storage_subtype || ''} 
                    onValueChange={(v) => setSpecs({ ...specs, storage_subtype: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mSATA">mSATA</SelectItem>
                      <SelectItem value="NVMe">NVMe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {specs.storage_subtype && (
                  <div>
                    <Label>Tamaño M.2</Label>
                    <Select 
                      value={specs.storage_m2_size || ''} 
                      onValueChange={(v) => setSpecs({ ...specs, storage_m2_size: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar tamaño" /></SelectTrigger>
                      <SelectContent>
                        {M2_SIZE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {specs.storage_interface === 'SATA' && (
              <div>
                <Label>Tipo SATA</Label>
                <Select 
                  value={specs.storage_subtype || ''} 
                  onValueChange={(v) => setSpecs({ ...specs, storage_subtype: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSD">SSD</SelectItem>
                    <SelectItem value="HDD">HDD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Capacidad (GB)</Label>
              <Input
                type="number"
                value={specs.storage_capacity || ''}
                onChange={(e) => setSpecs({ ...specs, storage_capacity: parseInt(e.target.value) || undefined })}
                placeholder="1000"
              />
            </div>
            <div>
              <Label>Velocidad (MB/s)</Label>
              <Input
                type="number"
                value={specs.storage_speed || ''}
                onChange={(e) => setSpecs({ ...specs, storage_speed: parseInt(e.target.value) || undefined })}
                placeholder="3500"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Switch
                checked={specs.storage_has_heatsink || false}
                onCheckedChange={(checked) => setSpecs({ ...specs, storage_has_heatsink: checked })}
              />
              <Label>Incluye Disipador</Label>
            </div>
          </>
        );

      case 'cooling':
        return (
          <>
            {renderGamerCheckbox()}
            <div>
              <Label>Tipo de Enfriamiento</Label>
              <Select value={specs.cooling_type || ''} onValueChange={(v) => setSpecs({ ...specs, cooling_type: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {COOLING_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad de Ventiladores</Label>
              <Input
                type="number"
                min="1"
                value={specs.cooling_fans_count || ''}
                onChange={(e) => setSpecs({ ...specs, cooling_fans_count: parseInt(e.target.value) || undefined })}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select value={specs.cooling_color || ''} onValueChange={(v) => setSpecs({ ...specs, cooling_color: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negro">Negro</SelectItem>
                  <SelectItem value="Blanco">Blanco</SelectItem>
                </SelectContent>
              </Select>
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
                  const isGamer = product.spec?.is_gamer;
                  
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
                      {isGamer && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                          🎮 Gamer
                        </Badge>
                      )}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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