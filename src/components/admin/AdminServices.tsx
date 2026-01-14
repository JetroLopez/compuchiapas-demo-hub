import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Upload, Search, Trash2, RefreshCw } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceStatus = 'Emitida' | 'Remitida' | 'Facturada' | 'Cancelada';
type EstatusInterno = 'En tienda' | 'En proceso' | 'Listo y avisado a cliente';

interface ParsedService {
  clave: string;
  cliente: string;
  estatus: ServiceStatus;
  fecha_elaboracion: string;
  condicion: string;
}

interface Service {
  id: string;
  clave: string;
  cliente: string;
  estatus: ServiceStatus;
  fecha_elaboracion: string;
  condicion: string;
  estatus_interno: EstatusInterno;
  comentarios: string | null;
  created_at: string;
  updated_at: string;
}

const AdminServices: React.FC = () => {
  const queryClient = useQueryClient();
  const [pastedData, setPastedData] = useState('');
  const [parsedServices, setParsedServices] = useState<ParsedService[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [estatusInternoFilter, setEstatusInternoFilter] = useState<string>('all');

  // Fetch existing services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('fecha_elaboracion', { ascending: false });
      
      if (error) throw error;
      return data as Service[];
    }
  });

  // Parse pasted data
  const parseTableData = (text: string): ParsedService[] => {
    const lines = text.trim().split('\n');
    const services: ParsedService[] = [];
    
    const lineRegex = /^\s*(0+\d+)\s+(\S+)\s+(Emitida|Remitida|Facturada|Cancelada)\s+(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(.*))?$/i;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.toLowerCase().includes('clave') && trimmedLine.toLowerCase().includes('cliente')) {
        continue;
      }
      
      const match = line.match(lineRegex);
      if (!match) continue;
      
      const [, claveRaw, clienteRaw, estatusRaw, fechaRaw, condicionRaw] = match;
      
      const clave = claveRaw.replace(/^0+/, '') || '0';
      const cliente = clienteRaw.trim();
      
      let estatus: ServiceStatus = 'Emitida';
      const estatusLower = estatusRaw.toLowerCase();
      if (estatusLower === 'emitida') estatus = 'Emitida';
      else if (estatusLower === 'remitida') estatus = 'Remitida';
      else if (estatusLower === 'facturada') estatus = 'Facturada';
      else if (estatusLower === 'cancelada') estatus = 'Cancelada';
      
      let fecha_elaboracion = new Date().toISOString().split('T')[0];
      const dateParts = fechaRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateParts) {
        const [, day, month, year] = dateParts;
        fecha_elaboracion = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      const condicion = condicionRaw?.trim() || '';

      services.push({
        clave,
        cliente,
        estatus,
        fecha_elaboracion,
        condicion
      });
    }
    
    return services;
  };

  const handleParse = () => {
    setParseError(null);
    try {
      const parsed = parseTableData(pastedData);
      if (parsed.length === 0) {
        setParseError('No se encontraron servicios válidos. Asegúrate de que el formato sea: Clave, Cliente, Estatus, Fecha, Condición');
        return;
      }
      setParsedServices(parsed);
      toast.success(`${parsed.length} servicios parseados correctamente`);
    } catch (error) {
      setParseError('Error al parsear los datos');
      console.error(error);
    }
  };

  // Sync mutation - preserves estatus_interno and comentarios for existing claves
  const syncMutation = useMutation({
    mutationFn: async (newServices: ParsedService[]) => {
      // First, get existing services with their estatus_interno and comentarios
      const { data: existingServices, error: fetchError } = await supabase
        .from('services')
        .select('clave, estatus_interno, comentarios');
      
      if (fetchError) throw fetchError;

      // Create a map of existing data
      const existingDataMap = new Map<string, { estatus_interno: string; comentarios: string | null }>();
      existingServices?.forEach(s => {
        existingDataMap.set(s.clave, { 
          estatus_interno: s.estatus_interno, 
          comentarios: s.comentarios 
        });
      });

      // Prepare services for upsert, preserving existing estatus_interno and comentarios
      const servicesToUpsert = newServices.map(s => {
        const existing = existingDataMap.get(s.clave);
        return {
          clave: s.clave,
          cliente: s.cliente,
          estatus: s.estatus,
          fecha_elaboracion: s.fecha_elaboracion,
          condicion: s.condicion,
          // Preserve existing values or use defaults
          estatus_interno: existing?.estatus_interno || 'En tienda',
          comentarios: existing?.comentarios || null
        };
      });

      const { error: upsertError } = await supabase
        .from('services')
        .upsert(servicesToUpsert, { onConflict: 'clave' });
      
      if (upsertError) throw upsertError;
      
      const activeServices = newServices.filter(s => s.estatus === 'Emitida');
      const inactiveServices = newServices.filter(s => s.estatus !== 'Emitida');
      
      return {
        total: newServices.length,
        active: activeServices.length,
        inactive: inactiveServices.length
      };
    },
    onSuccess: async (result) => {
      toast.success(`Sincronización completada: ${result.total} procesados (${result.active} activos)`);
      setPastedData('');
      setParsedServices([]);
      
      toast.info('Limpiando servicios no activos...');
      
      setTimeout(async () => {
        try {
          const { error: deleteError } = await supabase
            .from('services')
            .delete()
            .neq('estatus', 'Emitida');
          
          if (deleteError) {
            console.error('Error cleaning up:', deleteError);
            toast.error('Error al limpiar servicios inactivos');
          } else {
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            toast.success(`Servicios inactivos eliminados correctamente`);
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 1500);
      
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Error al sincronizar servicios');
    }
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Servicio eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar servicio');
    }
  });

  // Delete all services mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('services')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Todos los servicios han sido eliminados');
    },
    onError: () => {
      toast.error('Error al eliminar servicios');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, estatus }: { id: string; estatus: ServiceStatus }) => {
      if (estatus !== 'Emitida') {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return { deleted: true };
      }
      
      const { error } = await supabase
        .from('services')
        .update({ estatus })
        .eq('id', id);
      
      if (error) throw error;
      return { deleted: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      if (result.deleted) {
        toast.success('Servicio eliminado (estatus actualizado)');
      } else {
        toast.success('Estatus actualizado');
      }
    },
    onError: () => {
      toast.error('Error al actualizar estatus');
    }
  });

  // Update estatus_interno mutation
  const updateEstatusInternoMutation = useMutation({
    mutationFn: async ({ id, estatus_interno }: { id: string; estatus_interno: EstatusInterno }) => {
      const { error } = await supabase
        .from('services')
        .update({ estatus_interno })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Estatus interno actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estatus interno');
    }
  });

  // Update comentarios mutation
  const updateComentariosMutation = useMutation({
    mutationFn: async ({ id, comentarios }: { id: string; comentarios: string }) => {
      const { error } = await supabase
        .from('services')
        .update({ comentarios: comentarios || null })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Comentarios actualizados');
    },
    onError: () => {
      toast.error('Error al actualizar comentarios');
    }
  });

  const getStatusBadge = (status: ServiceStatus) => {
    const variants: Record<ServiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Emitida': 'default',
      'Remitida': 'secondary',
      'Facturada': 'outline',
      'Cancelada': 'destructive'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getEstatusInternoBadge = (estatus: EstatusInterno) => {
    switch (estatus) {
      case 'En tienda':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500">En tienda</Badge>;
      case 'En proceso':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500">En proceso</Badge>;
      case 'Listo y avisado a cliente':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500">Listo</Badge>;
      default:
        return <Badge variant="outline">{estatus}</Badge>;
    }
  };

  // Filter services
  const filteredServices = services?.filter(service => {
    const matchesSearch = 
      service.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.condicion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || service.estatus === statusFilter;
    const matchesEstatusInterno = estatusInternoFilter === 'all' || service.estatus_interno === estatusInternoFilter;
    
    return matchesSearch && matchesStatus && matchesEstatusInterno;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronizar Servicios
          </CardTitle>
          <CardDescription>
            Pega los datos de servicios para sincronizar. Los valores de estatus interno y comentarios se conservarán para servicios existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Pega los datos aquí (formato: Clave, Cliente, Estatus, Fecha, Condición)

Ejemplo:
0000004667	MOSTR	Emitida	13/01/2026	CANON G2110
0000004668	MOSTR	Emitida	13/01/2026	LAPTOP DELL LATITUDE 5400`}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!pastedData.trim()}>
              Parsear Datos
            </Button>
            
            {parsedServices.length > 0 && (
              <Button 
                onClick={() => syncMutation.mutate(parsedServices)}
                disabled={syncMutation.isPending}
                variant="default"
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sincronizar {parsedServices.length} servicios
                  </>
                )}
              </Button>
            )}
          </div>
          
          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
          
          {parsedServices.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Vista previa ({parsedServices.length} servicios):</h4>
              <div className="max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Condición</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedServices.slice(0, 5).map((service, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{service.clave}</TableCell>
                        <TableCell>{service.cliente}</TableCell>
                        <TableCell>{getStatusBadge(service.estatus)}</TableCell>
                        <TableCell>{service.fecha_elaboracion}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.condicion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedServices.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ... y {parsedServices.length - 5} más
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servicios en Tienda</CardTitle>
            <CardDescription>
              {filteredServices.length} servicios activos
            </CardDescription>
          </div>
          {services && services.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Todo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todos los servicios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará TODOS los {services.length} servicios permanentemente. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteAllMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Eliminar Todo'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por clave, cliente o condición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="Emitida">Emitida</SelectItem>
                <SelectItem value="Remitida">Remitida</SelectItem>
                <SelectItem value="Facturada">Facturada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estatusInternoFilter} onValueChange={setEstatusInternoFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estatus interno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="En tienda">En tienda</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Listo y avisado a cliente">Listo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {servicesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios registrados
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Estatus Interno</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Condición</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono font-medium">{service.clave}</TableCell>
                      <TableCell>{service.cliente}</TableCell>
                      <TableCell>
                        <Select
                          value={service.estatus}
                          onValueChange={(value: ServiceStatus) => 
                            updateStatusMutation.mutate({ id: service.id, estatus: value })
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Emitida">Emitida</SelectItem>
                            <SelectItem value="Remitida">Remitida</SelectItem>
                            <SelectItem value="Facturada">Facturada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={service.estatus_interno}
                          onValueChange={(value: EstatusInterno) => 
                            updateEstatusInternoMutation.mutate({ id: service.id, estatus_interno: value })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            {getEstatusInternoBadge(service.estatus_interno)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En tienda">En tienda</SelectItem>
                            <SelectItem value="En proceso">En proceso</SelectItem>
                            <SelectItem value="Listo y avisado a cliente">Listo y avisado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {format(new Date(service.fecha_elaboracion + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <span className="line-clamp-2">{service.condicion}</span>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <Input
                          placeholder="Agregar comentario..."
                          defaultValue={service.comentarios || ''}
                          className="h-8 text-xs"
                          onBlur={(e) => {
                            if (e.target.value !== (service.comentarios || '')) {
                              updateComentariosMutation.mutate({ 
                                id: service.id, 
                                comentarios: e.target.value 
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />
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
                              <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el servicio {service.clave} permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(service.id)}
                              >
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
    </div>
  );
};

export default AdminServices;