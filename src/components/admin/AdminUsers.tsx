import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Loader2, UserPlus, Wrench, ShoppingCart, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import AdminPageManager from './AdminPageManager';

type AppRole = 'admin' | 'tecnico' | 'ventas' | 'supervisor' | 'user';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const emailSchema = z.string().email('Correo electrónico inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, signUp } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Fetch profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user roles
  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async (): Promise<UserRole[]> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (error) throw error;
      return (data || []) as UserRole[];
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // First delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Rol actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar rol');
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(newUserEmail);
      passwordSchema.parse(newUserPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    if (!newUserName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signUp(newUserEmail, newUserPassword, newUserName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este correo ya está registrado');
      } else {
        toast.error('Error al crear usuario: ' + error.message);
      }
      setIsSubmitting(false);
      return;
    }
    
    // Note: The role will be set to 'user' by default via the trigger
    // Admin needs to change it after creation if needed
    toast.success('Usuario creado correctamente. Asigna el rol correspondiente.');
    setIsDialogOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setIsSubmitting(false);
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
  };

  const getUserRole = (userId: string): AppRole => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary"><Shield size={12} className="mr-1" /> Admin</Badge>;
      case 'supervisor':
        return <Badge className="bg-indigo-500"><Shield size={12} className="mr-1" /> Supervisor</Badge>;
      case 'tecnico':
        return <Badge className="bg-orange-500"><Wrench size={12} className="mr-1" /> Técnico</Badge>;
      case 'ventas':
        return <Badge className="bg-green-500"><ShoppingCart size={12} className="mr-1" /> Ventas</Badge>;
      default:
        return <Badge variant="secondary"><User size={12} className="mr-1" /> Usuario</Badge>;
    }
  };

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Administra usuarios y asigna roles</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus size={16} />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo usuario. El rol se puede asignar después de la creación.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Nombre completo</Label>
                <Input
                  id="new-user-name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Correo electrónico</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Contraseña</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando usuario...
                  </>
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead className="text-right">Cambiar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => {
                    const currentRole = getUserRole(profile.id);
                    const isCurrentUser = profile.id === currentUser?.id;
                    
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>{profile.email || '-'}</TableCell>
                        <TableCell>{profile.full_name || '-'}</TableCell>
                        <TableCell>
                          {getRoleBadge(currentRole)}
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCurrentUser && (
                            <Select
                              value={currentRole}
                              onValueChange={(value: AppRole) => 
                                changeRoleMutation.mutate({ userId: profile.id, newRole: value })
                              }
                              disabled={changeRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="tecnico">Técnico</SelectItem>
                                <SelectItem value="ventas">Ventas</SelectItem>
                                <SelectItem value="user">Usuario</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Permisos por Rol:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Admin:</strong> Acceso completo a todas las funciones</li>
            <li><strong>Supervisor:</strong> Acceso completo excepto Usuarios y Componentes PC</li>
            <li><strong>Técnico:</strong> Servicios, pedidos especiales y proyectos</li>
            <li><strong>Ventas:</strong> Productos, promociones, contacto, blog, pedidos y servicios (solo lectura)</li>
            <li><strong>Usuario:</strong> Solo visualización del dashboard</li>
          </ul>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Total: {profiles.length} usuarios
        </p>
      </CardContent>
    </Card>

    {/* Page Manager - Admin only */}
    <div className="mt-6">
      <AdminPageManager />
    </div>
  </>
  );
};

export default AdminUsers;
