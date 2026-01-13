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
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Skip header line
      if (trimmedLine.toLowerCase().includes('clave') && trimmedLine.toLowerCase().includes('cliente')) {
        continue;
      }
      
      // Try tab-separated first
      let parts = trimmedLine.split('\t').map(p => p.trim()).filter(p => p);
      
      // If not enough parts, try multiple spaces
      if (parts.length < 5) {
        parts = trimmedLine.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
      }
      
      if (parts.length >= 5) {
        const clave = parts[0];
        const cliente = parts[1];
        const estatusRaw = parts[2];
        const fechaRaw = parts[3];
        const condicion = parts.slice(4).join(' ');
        
        // Validate and normalize status
        let estatus: ServiceStatus = 'Emitida';
        const estatusLower = estatusRaw.toLowerCase();
        if (estatusLower.includes('emitida')) estatus = 'Emitida';
        else if (estatusLower.includes('remitida')) estatus = 'Remitida';
        else if (estatusLower.includes('facturada')) estatus = 'Facturada';
        else if (estatusLower.includes('cancelada')) estatus = 'Cancelada';
        
        // Parse date (DD/MM/YYYY to YYYY-MM-DD)
        let fecha_elaboracion = new Date().toISOString().split('T')[0];
        const dateMatch = fechaRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          fecha_elaboracion = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        services.push({
          clave,
          cliente,
          estatus,
          fecha_elaboracion,
          condicion
        });
      }
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

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (services: ParsedService[]) => {
      // Separate services by status
      const activeServices = services.filter(s => s.estatus === 'Emitida');
      const inactiveServices = services.filter(s => s.estatus !== 'Emitida');
      
      // Delete services that are no longer active (Remitida, Facturada, Cancelada)
      if (inactiveServices.length > 0) {
        const { error: deleteError } = await supabase
          .from('services')
          .delete()
          .in('clave', inactiveServices.map(s => s.clave));
        
        if (deleteError) throw deleteError;
      }
      
      // Upsert active services
      if (activeServices.length > 0) {
        const { error: upsertError } = await supabase
          .from('services')
          .upsert(
            activeServices.map(s => ({
              clave: s.clave,
              cliente: s.cliente,
              estatus: s.estatus,
              fecha_elaboracion: s.fecha_elaboracion,
              condicion: s.condicion
            })),
            { onConflict: 'clave' }
          );
        
        if (upsertError) throw upsertError;
      }
      
      return {
        added: activeServices.length,
        removed: inactiveServices.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(`Sincronización completada: ${result.added} activos, ${result.removed} eliminados`);
      setPastedData('');
      setParsedServices([]);
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

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, estatus }: { id: string; estatus: ServiceStatus }) => {
      // If status is not "Emitida", delete the service
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

  const getStatusBadge = (status: ServiceStatus) => {
    const variants: Record<ServiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Emitida': 'default',
      'Remitida': 'secondary',
      'Facturada': 'outline',
      'Cancelada': 'destructive'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  // Filter services
  const filteredServices = services?.filter(service => {
    const matchesSearch = 
      service.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.condicion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || service.estatus === statusFilter;
    
    return matchesSearch && matchesStatus;
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
            Pega los datos de servicios para sincronizar. Los servicios con estatus Remitida, Facturada o Cancelada serán eliminados automáticamente.
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
        <CardHeader>
          <CardTitle>Servicios en Tienda</CardTitle>
          <CardDescription>
            {filteredServices.length} servicios activos
          </CardDescription>
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Condición</TableHead>
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
                        {format(new Date(service.fecha_elaboracion + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2">{service.condicion}</span>
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
