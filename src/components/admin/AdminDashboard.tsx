import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wrench, 
  MessageCircle, 
  Package, 
  Tag, 
  Clock, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Bell,
  Warehouse,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type EstatusInterno = 'En tienda' | 'En proceso' | 'Listo y avisado a cliente';

interface Service {
  id: string;
  clave: string;
  cliente: string;
  estatus: 'Emitida' | 'Remitida' | 'Facturada' | 'Cancelada';
  fecha_elaboracion: string;
  condicion: string;
  estatus_interno: EstatusInterno;
  comentarios: string | null;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  subject: string;
  created_at: string;
  status: string | null;
}

interface Promotion {
  id: string;
  nombre: string;
  precio: number;
  existencias: number | null;
  is_active: boolean;
  created_at: string;
}

interface WarehouseStock {
  id: string;
  name: string;
  updated_at: string;
  product_count: number;
}

interface AdminDashboardProps {
  onNavigateToTab: (tab: string) => void;
  pendingContactsCount: number;
  onContactsViewed: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onNavigateToTab, 
  pendingContactsCount,
  onContactsViewed 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const previousContactsCount = useRef<number>(0);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Create notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.6, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = audioContext.currentTime;
      // Triple beep pattern for urgency
      playBeep(currentTime, 880, 0.15);
      playBeep(currentTime + 0.2, 988, 0.15);
      playBeep(currentTime + 0.4, 1047, 0.15);
      playBeep(currentTime + 0.6, 1175, 0.25);
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  // Fetch active services (Emitida or Remitida - in store)
  const { data: services = [], isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['dashboard-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .in('estatus', ['Emitida', 'Remitida'])
        .order('fecha_elaboracion', { ascending: true });
      if (error) throw error;
      return (data || []) as Service[];
    },
    refetchInterval: 60000,
  });

  // Fetch pending contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['dashboard-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('id, name, subject, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as ContactSubmission[];
    },
    refetchInterval: 30000,
  });

  // Play sound when contacts change
  useEffect(() => {
    if (pendingContactsCount > previousContactsCount.current && previousContactsCount.current >= 0) {
      playNotificationSound();
    }
    previousContactsCount.current = pendingContactsCount;
  }, [pendingContactsCount, playNotificationSound]);

  // Fetch active promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery({
    queryKey: ['dashboard-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, nombre, precio, existencias, is_active, created_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as Promotion[];
    },
  });

  // Fetch warehouse sync info
  const { data: warehouseInfo = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['dashboard-warehouses'],
    queryFn: async () => {
      const { data: warehouses, error: wError } = await supabase
        .from('warehouses')
        .select('id, name');
      if (wError) throw wError;

      const result: WarehouseStock[] = [];
      for (const warehouse of warehouses || []) {
        const { data: stockData, error: sError } = await supabase
          .from('product_warehouse_stock')
          .select('updated_at')
          .eq('warehouse_id', warehouse.id)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const { count, error: cError } = await supabase
          .from('product_warehouse_stock')
          .select('id', { count: 'exact', head: true })
          .eq('warehouse_id', warehouse.id)
          .gt('existencias', 0);

        result.push({
          id: warehouse.id,
          name: warehouse.name,
          updated_at: stockData?.[0]?.updated_at || '',
          product_count: count || 0,
        });
      }
      return result;
    },
  });

  // Get service age color and urgency class
  const getServiceColor = (fechaElaboracion: string) => {
    const days = differenceInDays(currentTime, new Date(fechaElaboracion));
    if (days >= 5) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
    if (days >= 3) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300';
    return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
  };

  const getUrgencyClass = (fechaElaboracion: string) => {
    const days = differenceInDays(currentTime, new Date(fechaElaboracion));
    if (days >= 5) return 'animate-urgency';
    if (days >= 3) return 'animate-urgency-pulse';
    return '';
  };

  const getServiceBadgeColor = (days: number) => {
    if (days >= 5) return 'bg-red-500 hover:bg-red-600';
    if (days >= 3) return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    return 'bg-green-500 hover:bg-green-600';
  };

  const getEstatusInternoBadge = (estatus: EstatusInterno) => {
    switch (estatus) {
      case 'En tienda':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-xs">Por revisar</Badge>;
      case 'En proceso':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 text-xs">En proceso</Badge>;
      case 'Listo y avisado a cliente':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-xs">Listo</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{estatus}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Sin datos';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Sort services by age (oldest first) and priority
  const sortedServices = [...services].sort((a, b) => {
    const daysA = differenceInDays(currentTime, new Date(a.fecha_elaboracion));
    const daysB = differenceInDays(currentTime, new Date(b.fecha_elaboracion));
    return daysB - daysA;
  });

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background p-4 overflow-auto' 
    : '';

  const toggleServiceExpand = (serviceId: string) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Compusistemas de Chiapas</h2>
          <span className="text-sm text-muted-foreground">
            {format(currentTime, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-full"
            title={soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchServices()}>
            <RefreshCw size={16} className="mr-2" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onNavigateToTab('services')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wrench className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{services.length}</p>
                <p className="text-xs text-muted-foreground">Servicios en tienda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors relative",
            pendingContactsCount > 0 && "ring-2 ring-orange-500 animate-glow"
          )} 
          onClick={() => {
            onNavigateToTab('contacts');
            onContactsViewed();
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 relative">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                {pendingContactsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-notification-bounce">
                    {pendingContactsCount > 9 ? '9+' : pendingContactsCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{contacts.length}</p>
                <p className="text-xs text-muted-foreground">Contactos pendientes</p>
              </div>
            </div>
            {pendingContactsCount > 0 && (
              <div className="absolute top-1 right-1">
                <Bell className="h-5 w-5 text-orange-500 animate-bounce" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onNavigateToTab('promotions')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Tag className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotions.length}</p>
                <p className="text-xs text-muted-foreground">Promociones activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onNavigateToTab('sync')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Warehouse className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouseInfo.length}</p>
                <p className="text-xs text-muted-foreground">Almacenes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className={cn(
        "grid gap-6",
        isFullscreen ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Services Panel */}
        <Card className={isFullscreen ? "lg:col-span-2" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={18} />
                Servicios en Tienda
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500">
                  Nuevo
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500">
                  3+ días
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500">
                  5+ días
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sortedServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No hay servicios activos en tienda</p>
              </div>
            ) : (
              <ScrollArea className={isFullscreen ? "h-[calc(100vh-400px)]" : "h-[400px]"}>
                <div className="space-y-2 pr-4">
                  {sortedServices.map((service) => {
                    const days = differenceInDays(currentTime, new Date(service.fecha_elaboracion));
                    const isExpanded = expandedServiceId === service.id;
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all cursor-pointer",
                          getServiceColor(service.fecha_elaboracion),
                          getUrgencyClass(service.fecha_elaboracion)
                        )}
                        onClick={() => toggleServiceExpand(service.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-lg">#{service.clave}</span>
                              <Badge variant="secondary" className="text-xs">
                                {service.estatus}
                              </Badge>
                              {getEstatusInternoBadge(service.estatus_interno)}
                              {service.cliente !== 'MOSTR' && (
                                <Badge variant="outline" className="text-xs">
                                  Cliente: {service.cliente}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm truncate">
                              {service.condicion || 'Sin descripción'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ingreso: {format(new Date(service.fecha_elaboracion), "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={cn("text-white", getServiceBadgeColor(days))}>
                              {days === 0 ? 'Hoy' : `${days} día${days > 1 ? 's' : ''}`}
                            </Badge>
                            {days >= 5 && (
                              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                            )}
                            {service.comentarios && (
                              isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded comments section */}
                        {isExpanded && service.comentarios && (
                          <div className="mt-3 pt-3 border-t border-current/20">
                            <p className="text-xs font-medium mb-1">Comentarios:</p>
                            <p className="text-sm opacity-90">{service.comentarios}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Warehouse Sync Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Warehouse size={18} />
                Última Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              {warehousesLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : warehouseInfo.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay almacenes configurados
                </p>
              ) : (
                <div className="space-y-3">
                  {warehouseInfo.map((warehouse) => {
                    const hoursAgo = warehouse.updated_at 
                      ? differenceInHours(currentTime, new Date(warehouse.updated_at))
                      : null;
                    const isStale = hoursAgo !== null && hoursAgo > 24;
                    
                    return (
                      <div
                        key={warehouse.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isStale ? "border-yellow-500 bg-yellow-500/10" : "border-border"
                        )}
                      >
                        <div>
                          <p className="font-medium">{warehouse.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {warehouse.product_count} productos con stock
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Clock size={14} className={isStale ? "text-yellow-500" : "text-muted-foreground"} />
                            <span className={cn(
                              "text-sm",
                              isStale ? "text-yellow-600 dark:text-yellow-400 font-medium" : "text-muted-foreground"
                            )}>
                              {formatTimeAgo(warehouse.updated_at)}
                            </span>
                          </div>
                          {isStale && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Requiere sincronización</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Promotions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag size={18} />
                Promociones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {promotionsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : promotions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay promociones activas
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {promotions.map((promo) => {
                      const daysActive = differenceInDays(currentTime, new Date(promo.created_at));
                      return (
                        <div
                          key={promo.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{promo.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(promo.precio)} • {promo.existencias || 0} en stock
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {daysActive === 0 ? 'Hoy' : `${daysActive}d activa`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Recent Contact Requests */}
          <Card className={cn(
            pendingContactsCount > 0 && "ring-2 ring-orange-500 animate-glow"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  Contactos Recientes
                </div>
                {pendingContactsCount > 0 && (
                  <Badge className="bg-orange-500 animate-notification-bounce">
                    {pendingContactsCount} nuevo{pendingContactsCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay contactos pendientes
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.slice(0, 5).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onNavigateToTab('contacts');
                        onContactsViewed();
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.subject || 'Sin asunto'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTimeAgo(contact.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;