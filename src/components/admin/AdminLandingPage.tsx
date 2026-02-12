import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit, Eye, EyeOff, GripVertical, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

const AdminLandingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    is_active: true,
    display_order: '0',
  });
  const [uploading, setUploading] = useState(false);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: async (): Promise<HeroSlide[]> => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSlide) {
        const { error } = await supabase.from('hero_slides').update(data).eq('id', editingSlide.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hero_slides').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success(editingSlide ? 'Slide actualizado' : 'Slide agregado');
      resetForm();
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success('Slide eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('hero_slides').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, display_order: '0' });
    setEditingSlide(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      link_url: slide.link_url || '',
      is_active: slide.is_active ?? true,
      display_order: slide.display_order?.toString() || '0',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.image_url.trim()) {
      toast.error('La URL de imagen es requerida');
      return;
    }
    saveMutation.mutate({
      title: formData.title.trim() || null,
      subtitle: formData.subtitle.trim() || null,
      image_url: formData.image_url.trim(),
      link_url: formData.link_url.trim() || null,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order) || 0,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('hero-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('hero-images')
        .getPublicUrl(data.path);

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success('Imagen subida exitosamente');
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image size={20} />
            Landing Page - Hero Carousel
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-2" /> Agregar Slide</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSlide ? 'Editar slide' : 'Agregar slide'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Imagen (formato horizontal recomendado: 1200x500)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://... o sube una imagen"
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span>{uploading ? <Loader2 size={16} className="animate-spin" /> : 'Subir'}</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 aspect-[12/5] max-w-full overflow-hidden rounded border">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Título (opcional, se superpone a la imagen)</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título del banner" />
                </div>
                <div>
                  <Label>Subtítulo (opcional)</Label>
                  <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Descripción breve" />
                </div>
                <div>
                  <Label>URL de enlace (opcional)</Label>
                  <Input value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="/productos o https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Orden</Label>
                    <Input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between pt-6">
                    <Label>Activo</Label>
                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                    {editingSlide ? 'Guardar' : 'Agregar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : slides.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No hay slides configurados. Agrega uno para comenzar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide) => (
              <div key={slide.id} className={`relative group rounded-lg overflow-hidden border ${!slide.is_active ? 'opacity-50' : ''}`}>
                <div className="aspect-[12/5]">
                  <img src={slide.image_url} alt={slide.title || 'Slide'} className="w-full h-full object-cover" />
                </div>
                {(slide.title || slide.subtitle) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    {slide.title && <p className="text-white font-bold text-sm">{slide.title}</p>}
                    {slide.subtitle && <p className="text-white/80 text-xs">{slide.subtitle}</p>}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => toggleActiveMutation.mutate({ id: slide.id, is_active: !slide.is_active })}>
                    {slide.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleEdit(slide)}>
                    <Edit size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="h-7 w-7"><Trash2 size={14} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar slide?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(slide.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  #{slide.display_order}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminLandingPage;
