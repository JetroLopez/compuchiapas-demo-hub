import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, Package, Users, Shield, RefreshCw } from 'lucide-react';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminUsers from '@/components/admin/AdminUsers';
import ProductSync from '@/components/admin/ProductSync';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gradient">Compuchiapas Admin</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Shield size={12} />
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isAdmin ? (
          <Tabs defaultValue="sync" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="sync" className="gap-2">
                <RefreshCw size={16} />
                Sincronizar
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} />
                Productos
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users size={16} />
                Usuarios
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sync">
              <ProductSync />
            </TabsContent>
            
            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">
              No tienes permisos de administrador. Contacta al administrador para obtener acceso.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
