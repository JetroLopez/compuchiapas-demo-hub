import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff, X, Save, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface BlogEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author: string;
  is_published: boolean | null;
  is_featured: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author: string;
  is_published: boolean;
  is_featured: boolean;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const AdminBlog: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BlogEntry | null>(null);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    author: 'Compuchiapas',
    is_published: false,
    is_featured: false,
  });

  // Fetch blog entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-blog-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogEntry[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      if (editingEntry) {
        const { error } = await supabase
          .from('blog_entries')
          .update({
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt || null,
            content: data.content || null,
            image_url: data.image_url || null,
            author: data.author,
            is_published: data.is_published,
            is_featured: data.is_featured,
            published_at: data.is_published ? new Date().toISOString() : null,
          })
          .eq('id', editingEntry.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_entries')
          .insert({
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt || null,
            content: data.content || null,
            image_url: data.image_url || null,
            author: data.author,
            is_published: data.is_published,
            is_featured: data.is_featured,
            published_at: data.is_published ? new Date().toISOString() : null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-entries'] });
      toast({
        title: editingEntry ? 'Entrada actualizada' : 'Entrada creada',
        description: editingEntry ? 'La entrada se actualizó correctamente.' : 'La entrada se creó correctamente.',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la entrada.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-entries'] });
      toast({
        title: 'Entrada eliminada',
        description: 'La entrada se eliminó correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la entrada.',
        variant: 'destructive',
      });
    },
  });

  // Toggle published mutation
  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('blog_entries')
        .update({ 
          is_published,
          published_at: is_published ? new Date().toISOString() : null 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-entries'] });
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('blog_entries')
        .update({ is_featured })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-entries'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image_url: '',
      author: 'Compuchiapas',
      is_published: false,
      is_featured: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (entry: BlogEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      slug: entry.slug,
      excerpt: entry.excerpt || '',
      content: entry.content || '',
      image_url: entry.image_url || '',
      author: entry.author,
      is_published: entry.is_published ?? false,
      is_featured: entry.is_featured ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image_url: '',
      author: 'Compuchiapas',
      is_published: false,
      is_featured: false,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingEntry ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast({
        title: 'Error',
        description: 'El título y el slug son obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blog</h2>
          <p className="text-muted-foreground">Gestiona las entradas del blog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} className="mr-2" />
              Nueva entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Editar entrada' : 'Nueva entrada'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Título de la entrada"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-de-la-entrada"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Se genera automáticamente del título
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de imagen</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Nombre del autor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extracto</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Breve descripción de la entrada..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escribe el contenido completo aquí..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="is_published">Publicado</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured">Destacado</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  <X size={16} className="mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {editingEntry ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay entradas</h3>
            <p className="text-muted-foreground mb-4">Crea tu primera entrada de blog</p>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} className="mr-2" />
              Crear entrada
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {entry.image_url && (
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
                        <p className="text-sm text-muted-foreground">/{entry.slug}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {entry.is_featured && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                            <Star size={12} className="mr-1" />
                            Destacado
                          </Badge>
                        )}
                        <Badge variant={entry.is_published ? "default" : "outline"}>
                          {entry.is_published ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </div>
                    </div>
                    {entry.excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{entry.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Por {entry.author}</span>
                      <span>•</span>
                      <span>{new Date(entry.created_at).toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFeaturedMutation.mutate({ 
                        id: entry.id, 
                        is_featured: !entry.is_featured 
                      })}
                      title={entry.is_featured ? 'Quitar destacado' : 'Destacar'}
                    >
                      {entry.is_featured ? <StarOff size={16} /> : <Star size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublishedMutation.mutate({ 
                        id: entry.id, 
                        is_published: !entry.is_published 
                      })}
                      title={entry.is_published ? 'Despublicar' : 'Publicar'}
                    >
                      {entry.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(entry)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar entrada?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la entrada "{entry.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(entry.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
