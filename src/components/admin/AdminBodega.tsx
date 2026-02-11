import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Trash2, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface BodegaEquipo {
  id: string;
  service_id: string;
  service_clave: string;
  fecha_ingreso_servicio: string;
  marca: string;
  modelo: string;
  color: string;
  numero_serie: string;
  nombre_cliente: string;
  telefono_cliente: string;
  fecha_ultimo_contacto: string | null;
  estatus_al_almacenar: string;
  created_at: string;
  updated_at: string;
}

const AdminBodega: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContactDate, setEditingContactDate] = useState<{ id: string; date: string } | null>(null);

  const { data: equipos, isLoading } = useQuery({
    queryKey: ['admin-bodega'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bodega_equipos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BodegaEquipo[];
    }
  });

  const updateContactDateMutation = useMutation({
    mutationFn: async ({ id, fecha }: { id: string; fecha: string }) => {
      const { error } = await supabase
        .from('bodega_equipos')
        .update({ fecha_ultimo_contacto: fecha })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bodega'] });
      toast.success('Fecha de contacto actualizada');
      setEditingContactDate(null);
    },
    onError: () => toast.error('Error al actualizar')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bodega_equipos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bodega'] });
      toast.success('Equipo eliminado de bodega');
    },
    onError: () => toast.error('Error al eliminar')
  });

  const filtered = (equipos || []).filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.marca.toLowerCase().includes(term) ||
      e.modelo.toLowerCase().includes(term) ||
      e.nombre_cliente.toLowerCase().includes(term) ||
      e.service_clave.toLowerCase().includes(term) ||
      e.numero_serie.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bodega de Equipos</CardTitle>
          <CardDescription>
            Equipos almacenados provenientes de servicios con estatus "Listo y avisado a cliente"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo, cliente, clave o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay equipos en bodega
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave Servicio</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>No. Serie</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Último Contacto</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((equipo) => (
                    <TableRow key={equipo.id}>
                      <TableCell className="font-mono font-medium">{equipo.service_clave}</TableCell>
                      <TableCell>
                        {format(new Date(equipo.fecha_ingreso_servicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>{equipo.marca}</TableCell>
                      <TableCell>{equipo.modelo}</TableCell>
                      <TableCell>{equipo.color}</TableCell>
                      <TableCell className="font-mono text-xs">{equipo.numero_serie || '—'}</TableCell>
                      <TableCell>{equipo.nombre_cliente}</TableCell>
                      <TableCell>
                        {equipo.telefono_cliente ? (
                          <a href={`tel:${equipo.telefono_cliente}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone size={12} />
                            {equipo.telefono_cliente}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setEditingContactDate({
                            id: equipo.id,
                            date: equipo.fecha_ultimo_contacto || new Date().toISOString().split('T')[0]
                          })}
                        >
                          <Calendar size={12} />
                          {equipo.fecha_ultimo_contacto
                            ? format(new Date(equipo.fecha_ultimo_contacto + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })
                            : 'Sin registro'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{equipo.estatus_al_almacenar}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar equipo de bodega?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará el registro de {equipo.marca} {equipo.modelo} del cliente {equipo.nombre_cliente}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(equipo.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit contact date dialog */}
      <Dialog open={!!editingContactDate} onOpenChange={() => setEditingContactDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Actualizar fecha de contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha de último intento de contacto</Label>
              <Input
                type="date"
                value={editingContactDate?.date || ''}
                onChange={(e) => setEditingContactDate(prev => prev ? { ...prev, date: e.target.value } : null)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (editingContactDate) {
                  updateContactDateMutation.mutate({ id: editingContactDate.id, fecha: editingContactDate.date });
                }
              }}
              disabled={updateContactDateMutation.isPending}
            >
              {updateContactDateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBodega;
