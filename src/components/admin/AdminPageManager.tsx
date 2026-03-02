import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Shield } from 'lucide-react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { toast } from 'sonner';

const PAGE_CONFIG = [
  { id: 'inicio', label: 'Inicio', description: 'Página principal', icon: '🏠' },
  { id: 'servicios', label: 'Servicios', description: '/servicios', icon: '🔧' },
  { id: 'productos', label: 'Productos', description: '/productos', icon: '📦' },
  { id: 'software-esd', label: 'Software ESD', description: '/software-esd', icon: '💿' },
  { id: 'blog', label: 'Blog', description: '/blog', icon: '📝' },
  { id: 'contacto', label: 'Contacto', description: '/contacto', icon: '📧' },
  { id: 'admin', label: 'Panel Admin', description: 'Restringe acceso a roles no-admin', icon: '🛡️', isSpecial: true },
];

const AdminPageManager: React.FC = () => {
  const { pages, isLoading, toggleMutation } = usePageVisibility();

  const handleToggle = (pageId: string, currentVisible: boolean) => {
    toggleMutation.mutate(
      { pageId, isVisible: !currentVisible },
      {
        onSuccess: () => {
          toast.success(`Página "${pageId}" ${!currentVisible ? 'visible' : 'oculta'}`);
        },
        onError: () => {
          toast.error('Error al actualizar visibilidad');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={20} />
          Administrador de Páginas
        </CardTitle>
        <CardDescription>
          Controla la visibilidad de las páginas públicas. Las páginas ocultas mostrarán error 404 y se eliminarán del menú de navegación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PAGE_CONFIG.map((page) => {
          const pageData = pages.find(p => p.id === page.id);
          const isVisible = pageData?.is_visible ?? true;

          return (
            <div
              key={page.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                page.isSpecial ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{page.icon}</span>
                <div>
                  <Label className="text-sm font-semibold">{page.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {page.isSpecial ? (
                      <span className="flex items-center gap-1">
                        <Shield size={12} />
                        Al ocultar, los roles no-admin verán "Función no disponible en el plan actual"
                      </span>
                    ) : (
                      page.description
                    )}
                  </p>
                </div>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={() => handleToggle(page.id, isVisible)}
                disabled={toggleMutation.isPending}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminPageManager;
