import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Search, Edit, Download, GripVertical, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SoftwareESD {
  id: string;
  marca: string;
  clave: string;
  descripcion: string;
  detalles: string | null;
  precio: number;
  img_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface SoftwareBrand {
  id: string;
  name: string;
  image_url: string | null;
  display_order: number | null;
}

type FilterType = 'all' | 'active' | 'inactive';

// Sortable brand item component
const SortableBrandItem: React.FC<{
  brand: SoftwareBrand;
  onEditImage: (name: string, imageUrl: string) => void;
}> = ({ brand, onEditImage }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: brand.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-background border rounded-lg p-2">
      <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={16} className="text-muted-foreground" />
      </div>
      <div className="w-8 h-8 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
        {brand.image_url ? (
          <img src={brand.image_url} alt={brand.name} className="w-full h-full object-contain" />
        ) : (
          <Download size={14} className="text-muted-foreground" />
        )}
      </div>
      <span className="text-sm font-medium flex-1">{brand.name}</span>
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEditImage(brand.name, brand.image_url || '')}>
        <Edit size={12} />
      </Button>
    </div>
  );
};

// Sortable table row component
const SortableRow: React.FC<{
  software: SoftwareESD;
  formatPrice: (price: number) => string;
  handleEdit: (software: SoftwareESD) => void;
  deleteMutation: any;
  toggleActiveMutation: any;
}> = ({ software, formatPrice, handleEdit, deleteMutation, toggleActiveMutation }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: software.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(!software.is_active && 'opacity-50')}>
      <TableCell className="w-8 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={16} className="text-muted-foreground" />
      </TableCell>
      <TableCell>
        {software.img_url ? (
          <img src={software.img_url} alt={software.descripcion} className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Download size={20} className="text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{software.clave}</TableCell>
      <TableCell className="max-w-[150px]">
        <p className="font-semibold text-sm">{software.marca}</p>
        <p className="truncate font-medium">{software.descripcion}</p>
        {software.detalles && <p className="text-xs text-muted-foreground truncate">{software.detalles}</p>}
      </TableCell>
      <TableCell className="text-right font-semibold text-tech-blue">{formatPrice(software.precio)}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={software.is_active}
          onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: software.id, is_active: checked })}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(software)}>
            <Edit size={16} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar software?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El software "{software.descripcion}" será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(software.id)}
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
  );
};

const AdminSoftwareESD: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<SoftwareESD | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [formData, setFormData] = useState({
    marca: '',
    clave: '',
    descripcion: '',
    detalles: '',
    precio: '',
    img_url: '',
    is_active: true,
  });
  // Brand image editing
  const [editingBrandName, setEditingBrandName] = useState<string | null>(null);
  const [brandImageUrl, setBrandImageUrl] = useState('');
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [isAddBrandDialogOpen, setIsAddBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandImageUrl, setNewBrandImageUrl] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch software ESD
  const { data: softwareList = [], isLoading } = useQuery({
    queryKey: ['admin-software-esd'],
    queryFn: async (): Promise<SoftwareESD[]> => {
      const { data, error } = await (supabase
        .from('software_esd')
        .select('*')
        .order('marca', { ascending: true })
        .order('display_order', { ascending: true }) as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch brands
  const { data: brandsList = [] } = useQuery({
    queryKey: ['software-esd-brands'],
    queryFn: async (): Promise<SoftwareBrand[]> => {
      const { data, error } = await (supabase
        .from('software_esd_brands')
        .select('*')
        .order('display_order', { ascending: true }) as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Brand image map
  const brandImageMap = React.useMemo(() => {
    const map = new Map<string, string | null>();
    (brandsList as SoftwareBrand[]).forEach(b => map.set(b.name, b.image_url));
    return map;
  }, [brandsList]);

  // Save brand image mutation
  const saveBrandImageMutation = useMutation({
    mutationFn: async ({ name, image_url }: { name: string; image_url: string | null }) => {
      const { error } = await (supabase
        .from('software_esd_brands')
        .upsert({ name, image_url }, { onConflict: 'name' }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software-esd-brands'] });
      toast.success('Imagen de marca actualizada');
      setEditingBrandName(null);
      setBrandImageUrl('');
    },
    onError: () => toast.error('Error al actualizar imagen de marca'),
  });

  // Reorder brands mutation
  const reorderBrandsMutation = useMutation({
    mutationFn: async (orderedBrands: { id: string; display_order: number }[]) => {
      for (const item of orderedBrands) {
        const { error } = await (supabase.from('software_esd_brands').update({ display_order: item.display_order }).eq('id', item.id) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software-esd-brands'] });
      toast.success('Orden de marcas actualizado');
    },
    onError: () => toast.error('Error al reordenar marcas'),
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { marca: string; clave: string; descripcion: string; detalles: string | null; precio: number; img_url: string | null; is_active: boolean; display_order: number }) => {
      if (editingSoftware) {
        const { error } = await (supabase.from('software_esd').update(data).eq('id', editingSoftware.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('software_esd').insert([data]) as any);
        if (error) throw error;
      }
      // Ensure the brand exists in brands table
      await (supabase.from('software_esd_brands').upsert({ name: data.marca }, { onConflict: 'name' }) as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-software-esd'] });
      queryClient.invalidateQueries({ queryKey: ['software-esd'] });
      queryClient.invalidateQueries({ queryKey: ['software-esd-brands'] });
      toast.success(editingSoftware ? 'Software actualizado' : 'Software agregado');
      resetForm();
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('software_esd').delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-software-esd'] });
      queryClient.invalidateQueries({ queryKey: ['software-esd'] });
      toast.success('Software eliminado');
    },
    onError: () => toast.error('Error al eliminar software'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from('software_esd').update({ is_active }).eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-software-esd'] });
      queryClient.invalidateQueries({ queryKey: ['software-esd'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: { id: string; display_order: number }[]) => {
      for (const item of orderedIds) {
        const { error } = await (supabase.from('software_esd').update({ display_order: item.display_order }).eq('id', item.id) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-software-esd'] });
      queryClient.invalidateQueries({ queryKey: ['software-esd'] });
      toast.success('Orden actualizado');
    },
    onError: () => toast.error('Error al reordenar'),
  });

  const resetForm = () => {
    setFormData({ marca: '', clave: '', descripcion: '', detalles: '', precio: '', img_url: '', is_active: true });
    setEditingSoftware(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (software: SoftwareESD) => {
    setEditingSoftware(software);
    setFormData({
      marca: software.marca,
      clave: software.clave,
      descripcion: software.descripcion,
      detalles: software.detalles || '',
      precio: software.precio.toString(),
      img_url: software.img_url || '',
      is_active: software.is_active,
    });
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.marca.trim() || !formData.clave.trim() || !formData.descripcion.trim() || !formData.precio) {
      toast.error('Marca, clave, descripción y precio son requeridos');
      return;
    }
    const maxOrder = softwareList.reduce((max, s) => Math.max(max, s.display_order || 0), 0);
    saveMutation.mutate({
      marca: formData.marca.trim(),
      clave: formData.clave.trim(),
      descripcion: formData.descripcion.trim(),
      detalles: formData.detalles.trim() || null,
      precio: parseFloat(formData.precio),
      img_url: formData.img_url.trim() || null,
      is_active: formData.is_active,
      display_order: editingSoftware ? (editingSoftware.display_order || 0) : maxOrder + 1,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredSoftware.findIndex(s => s.id === active.id);
    const newIndex = filteredSoftware.findIndex(s => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredSoftware, oldIndex, newIndex);
    const updates = reordered.map((s, i) => ({ id: s.id, display_order: i }));

    queryClient.setQueryData(['admin-software-esd'], (old: SoftwareESD[] | undefined) => {
      if (!old) return old;
      const orderMap = new Map(updates.map(u => [u.id, u.display_order]));
      return [...old].map(s => orderMap.has(s.id) ? { ...s, display_order: orderMap.get(s.id)! } : s)
        .sort((a, b) => {
          const marcaCompare = a.marca.localeCompare(b.marca);
          if (marcaCompare !== 0) return marcaCompare;
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        });
    });

    reorderMutation.mutate(updates);
  };

  // Filter software
  const filteredSoftware = softwareList
    .filter(s => {
      const matchesSearch = 
        s.marca.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.clave.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || (activeFilter === 'active' ? s.is_active : !s.is_active);
      return matchesSearch && matchesFilter;
    });

  const formatPriceFn = (price: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);

  const totalCount = softwareList.length;
  const activeCount = softwareList.filter(s => s.is_active).length;
  const inactiveCount = softwareList.filter(s => !s.is_active).length;

  // Get unique brands for dropdown
  const uniqueBrands = Array.from(new Set(softwareList.map(s => s.marca))).sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Download size={20} />
            Software ESD
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isAddBrandDialogOpen} onOpenChange={setIsAddBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus size={16} className="mr-2" />Agregar Marca</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Agregar Marca</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-brand-name">Nombre de marca *</Label>
                    <Input id="new-brand-name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Ej: Adobe" />
                  </div>
                  <div>
                    <Label htmlFor="new-brand-image">URL de imagen (opcional)</Label>
                    <Input id="new-brand-image" value={newBrandImageUrl} onChange={(e) => setNewBrandImageUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button className="w-full" disabled={!newBrandName.trim() || saveBrandImageMutation.isPending} onClick={() => {
                    saveBrandImageMutation.mutate({ name: newBrandName.trim(), image_url: newBrandImageUrl.trim() || null }, {
                      onSuccess: () => { setNewBrandName(''); setNewBrandImageUrl(''); setIsAddBrandDialogOpen(false); }
                    });
                  }}>
                    {saveBrandImageMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                    Agregar Marca
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus size={16} className="mr-2" />Agregar Software</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSoftware ? 'Editar software' : 'Agregar software'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <Input 
                      id="marca" 
                      value={formData.marca} 
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })} 
                      placeholder="Ej: Microsoft, Bitdefender, ESET..." 
                      list="brands-list"
                    />
                    <datalist id="brands-list">
                      {uniqueBrands.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clave">Clave *</Label>
                      <Input id="clave" value={formData.clave} onChange={(e) => setFormData({ ...formData, clave: e.target.value })} placeholder="Ej: MS-365-BS" />
                    </div>
                    <div>
                      <Label htmlFor="precio">Precio *</Label>
                      <Input id="precio" type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Input id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej: Microsoft 365 Business Standard" />
                  </div>
                  <div>
                    <Label htmlFor="detalles">Detalles</Label>
                    <Textarea 
                      id="detalles" 
                      value={formData.detalles} 
                      onChange={(e) => setFormData({ ...formData, detalles: e.target.value })} 
                      placeholder="Características del producto..." 
                      rows={3} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="img_url">URL de imagen del producto (opcional)</Label>
                    <Input id="img_url" value={formData.img_url} onChange={(e) => setFormData({ ...formData, img_url: e.target.value })} placeholder="https://..." />
                    {formData.img_url && (
                      <div className="mt-2 aspect-[4/3] max-w-[200px] overflow-hidden rounded border">
                        <img src={formData.img_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Activo (visible en página)</Label>
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                      {editingSoftware ? 'Guardar cambios' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Brand images management - Collapsible */}
        {(brandsList as SoftwareBrand[]).length > 0 && (
          <Collapsible open={brandsOpen} onOpenChange={setBrandsOpen} className="mb-6">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Image size={16} />
                  Imágenes y orden de marcas ({(brandsList as SoftwareBrand[]).length})
                </span>
                {brandsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-3">Arrastra para reordenar</p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    const brands = brandsList as SoftwareBrand[];
                    const oldIndex = brands.findIndex(b => b.id === active.id);
                    const newIndex = brands.findIndex(b => b.id === over.id);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const reordered = arrayMove(brands, oldIndex, newIndex);
                    const updates = reordered.map((b, i) => ({ id: b.id, display_order: i }));
                    queryClient.setQueryData(['software-esd-brands'], reordered.map((b, i) => ({ ...b, display_order: i })));
                    reorderBrandsMutation.mutate(updates);
                  }}
                >
                  <SortableContext items={(brandsList as SoftwareBrand[]).map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {(brandsList as SoftwareBrand[]).map(brand => (
                        <SortableBrandItem
                          key={brand.id}
                          brand={brand}
                          onEditImage={(name, imageUrl) => {
                            setEditingBrandName(name);
                            setBrandImageUrl(imageUrl);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Brand image edit dialog */}
        <Dialog open={!!editingBrandName} onOpenChange={(open) => !open && setEditingBrandName(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Imagen de marca: {editingBrandName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>URL de imagen</Label>
                <Input
                  value={brandImageUrl}
                  onChange={(e) => setBrandImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              {brandImageUrl && (
                <div className="aspect-square max-w-[150px] mx-auto rounded border overflow-hidden bg-muted">
                  <img src={brandImageUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBrandName(null)}>Cancelar</Button>
                <Button
                  onClick={() => editingBrandName && saveBrandImageMutation.mutate({ name: editingBrandName, image_url: brandImageUrl.trim() || null })}
                  disabled={saveBrandImageMutation.isPending}
                >
                  {saveBrandImageMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar por marca, descripción o clave..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 max-w-md" />
        </div>

        {/* Stats - clickable filters */}
        <div className="flex gap-4 mb-4">
          <Badge
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            className={cn("text-sm cursor-pointer", activeFilter === 'all' && 'bg-primary')}
            onClick={() => setActiveFilter('all')}
          >
            Total: {totalCount}
          </Badge>
          <Badge
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            className={cn("text-sm cursor-pointer", activeFilter === 'active' ? 'bg-green-500' : 'bg-green-500/10 text-green-600 border-green-500')}
            onClick={() => setActiveFilter('active')}
          >
            Activos: {activeCount}
          </Badge>
          <Badge
            variant={activeFilter === 'inactive' ? 'default' : 'outline'}
            className={cn("text-sm cursor-pointer", activeFilter === 'inactive' ? 'bg-muted-foreground' : '')}
            onClick={() => setActiveFilter('inactive')}
          >
            Inactivos: {inactiveCount}
          </Badge>
        </div>

        {/* Table with drag-and-drop */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredSoftware.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {softwareList.length === 0 ? 'No hay software ESD. Agrega uno para comenzar.' : 'No se encontraron resultados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-16">Imagen</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Marca / Descripción</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext items={filteredSoftware.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <TableBody>
                    {filteredSoftware.map((software) => (
                      <SortableRow
                        key={software.id}
                        software={software}
                        formatPrice={formatPriceFn}
                        handleEdit={handleEdit}
                        deleteMutation={deleteMutation}
                        toggleActiveMutation={toggleActiveMutation}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSoftwareESD;
