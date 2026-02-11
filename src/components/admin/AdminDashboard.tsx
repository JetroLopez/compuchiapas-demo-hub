import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
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
  ChevronUp,
  ShoppingBag,
  ShoppingCart,
  FolderKanban,
  User,
  ShieldCheck
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

type SpecialOrderStatus = 'Notificado con Esdras' | 'Pedido' | 'En tienda' | 'Entregado';

interface SpecialOrder {
  id: string;
  fecha: string;
  cliente: string;
  telefono: string | null;
  producto: string;
  clave: string | null;
  precio: number | null;
  anticipo: number | null;
  resta: number | null;
  folio_ingreso: string | null;
  fecha_aprox_entrega: string | null;
  estatus: SpecialOrderStatus;
  fecha_entrega: string | null;
  folio_servicio: string | null;
  remision: string | null;
  created_at: string;
}

interface ProjectWithLastLog {
  id: string;
  project_number: number;
  nombre_proyecto: string;
  cliente_nombre: string;
  assigned_user_id: string;
  assigned_user_name: string;
  is_completed: boolean;
  last_log_at: string | null;
}

interface AdminDashboardProps {
  onNavigateToTab: (tab: string) => void;
  pendingContactsCount: number;
  onContactsViewed: () => void;
  isTecnico?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onNavigateToTab, 
  pendingContactsCount,
  onContactsViewed,
  isTecnico = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const previousContactsCount = useRef<number>(0);
  const queryClient = useQueryClient();
  const { hasAccess, user, userRole } = useAuth();
  const canEditServices = hasAccess(['admin', 'tecnico']);
  const isAdmin = userRole === 'admin';

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

  // Fetch special orders (pending - not delivered)
  const { data: specialOrders = [], isLoading: specialOrdersLoading, refetch: refetchSpecialOrders } = useQuery({
    queryKey: ['dashboard-special-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_orders')
        .select('*')
        .neq('estatus', 'Entregado')
        .order('fecha', { ascending: true });
      if (error) throw error;
      return (data || []) as SpecialOrder[];
    },
    refetchInterval: 60000,
  });

  // Fetch pending web orders
  const { data: pendingWebOrders = 0 } = useQuery({
    queryKey: ['dashboard-web-orders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('web_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Fetch active projects with last log date
  const { data: activeProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard-projects', user?.id, isAdmin],
    queryFn: async () => {
      // Fetch projects
      let projectsQuery = supabase
        .from('projects')
        .select('id, project_number, nombre_proyecto, cliente_nombre, assigned_user_id, assigned_user_name, is_completed, is_discarded')
        .eq('is_completed', false)
        .or('is_discarded.is.null,is_discarded.eq.false');
      
      // Filter by user for non-admin roles
      if (!isAdmin && user?.id) {
        projectsQuery = projectsQuery.eq('assigned_user_id', user.id);
      }
      
      const { data: projects, error: pError } = await projectsQuery;
      if (pError) throw pError;
      
      // Fetch last log date for each project
      const projectsWithLogs: ProjectWithLastLog[] = [];
      for (const project of projects || []) {
        const { data: logData } = await supabase
          .from('project_logs')
          .select('created_at')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        projectsWithLogs.push({
          ...project,
          last_log_at: logData?.[0]?.created_at || null
        });
      }
      
      return projectsWithLogs;
    },
    refetchInterval: 60000,
    enabled: !!user?.id
  });

  // Mutation to update service estatus_interno
  const updateEstatusInternoMutation = useMutation({
    mutationFn: async ({ serviceId, estatusInterno }: { serviceId: string; estatusInterno: EstatusInterno }) => {
      const { error } = await supabase
        .from('services')
        .update({ estatus_interno: estatusInterno })
        .eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-services'] });
      toast.success('Estatus actualizado');
    },
    onError: (error) => {
      console.error('Error updating estatus interno:', error);
      toast.error('Error al actualizar estatus');
    },
  });

  // Get time-based glow/shadow color class (only the glow, not the border)
  const getTimeBasedGlowClass = (fechaElaboracion: string, estatusInterno: EstatusInterno) => {
    if (estatusInterno === 'Listo y avisado a cliente') return ''; // No glow for "Listo"
    const days = differenceInDays(currentTime, new Date(fechaElaboracion));
    if (days >= 5) return 'shadow-[0_0_12px_rgba(239,68,68,0.5)]';
    if (days >= 3) return 'shadow-[0_0_12px_rgba(234,179,8,0.5)]';
    return 'shadow-[0_0_12px_rgba(34,197,94,0.5)]';
  };

  // Get service background and border color based on estatus_interno
  const getServiceBackgroundColor = (estatusInterno: EstatusInterno, fechaElaboracion: string) => {
    const days = differenceInDays(currentTime, new Date(fechaElaboracion));
    
    if (estatusInterno === 'Listo y avisado a cliente') {
      // Gray, no glow
      return 'bg-gray-200 dark:bg-gray-700 border-gray-400 text-gray-600 dark:text-gray-300';
    }
    if (estatusInterno === 'En proceso') {
      // Full celeste/sky styling (background + border) matching format of others
      return 'bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300';
    }
    // Default "En tienda" - time-based background and border
    if (days >= 5) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
    if (days >= 3) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300';
    return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
  };

  // Get urgency class (glow animation) - only for non-"Listo" items
  const getUrgencyClass = (fechaElaboracion: string, estatusInterno: EstatusInterno) => {
    if (estatusInterno === 'Listo y avisado a cliente') return ''; // No animation for "Listo"
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

  // Get special order urgency based on fecha_aprox_entrega
  const getSpecialOrderColor = (fechaAprox: string | null) => {
    if (!fechaAprox) return 'bg-muted/50 border-border text-foreground';
    const daysUntilDelivery = differenceInDays(new Date(fechaAprox), currentTime);
    if (daysUntilDelivery < 0) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300'; // Overdue
    if (daysUntilDelivery <= 1) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300'; // Today or tomorrow
    if (daysUntilDelivery <= 3) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300'; // 2-3 days
    return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300'; // More than 3 days
  };

  const getSpecialOrderUrgencyClass = (fechaAprox: string | null) => {
    if (!fechaAprox) return '';
    const daysUntilDelivery = differenceInDays(new Date(fechaAprox), currentTime);
    if (daysUntilDelivery < 0) return 'animate-urgency'; // Overdue
    if (daysUntilDelivery <= 1) return 'animate-urgency'; // Today or tomorrow
    if (daysUntilDelivery <= 3) return 'animate-urgency-pulse'; // 2-3 days
    return '';
  };

  const getSpecialOrderStatusBadge = (estatus: SpecialOrderStatus) => {
    switch (estatus) {
      case 'Notificado con Esdras':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500 text-xs">Notificado</Badge>;
      case 'Pedido':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 text-xs">Pedido</Badge>;
      case 'En tienda':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-xs">En tienda</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{estatus}</Badge>;
    }
  };

  // Sort services: "Listo y avisado" at bottom, then by clave (descending - highest clave first means oldest at bottom, newest at top)
  const sortedServices = [...services].sort((a, b) => {
    // "Listo y avisado" items go to bottom
    const aIsListo = a.estatus_interno === 'Listo y avisado a cliente';
    const bIsListo = b.estatus_interno === 'Listo y avisado a cliente';
    
    if (aIsListo && !bIsListo) return 1; // a goes after b
    if (!aIsListo && bIsListo) return -1; // b goes after a
    
    // Within same status group, sort by clave descending (lower clave = older, should be at bottom)
    // So we sort ascending to have lower claves at top when we want them at bottom visually
    const claveA = parseInt(a.clave) || 0;
    const claveB = parseInt(b.clave) || 0;
    return claveA - claveB; // Lower claves first (older items at top which will be at bottom visually in scroll)
  });

  // Sort special orders by fecha (oldest first for priority) and then by fecha_aprox_entrega urgency
  const sortedSpecialOrders = [...specialOrders].sort((a, b) => {
    // First priority: orders with fecha_aprox_entrega that are overdue or close
    const daysA = a.fecha_aprox_entrega ? differenceInDays(new Date(a.fecha_aprox_entrega), currentTime) : 999;
    const daysB = b.fecha_aprox_entrega ? differenceInDays(new Date(b.fecha_aprox_entrega), currentTime) : 999;
    
    if (daysA !== daysB) return daysA - daysB; // Most urgent first
    
    // Second priority: oldest fecha first
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });

  // Get project color based on last log interaction (days since last log)
  const getProjectColor = (lastLogAt: string | null) => {
    if (!lastLogAt) return 'bg-muted/50 border-border text-foreground'; // No logs yet
    const daysSinceLastLog = differenceInDays(currentTime, new Date(lastLogAt));
    if (daysSinceLastLog >= 5) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
    if (daysSinceLastLog >= 3) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300';
    return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
  };

  // Sort projects by last log urgency (oldest interaction first)
  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const daysA = a.last_log_at ? differenceInDays(currentTime, new Date(a.last_log_at)) : 999;
    const daysB = b.last_log_at ? differenceInDays(currentTime, new Date(b.last_log_at)) : 999;
    return daysB - daysA; // Most urgent (oldest interaction) first
  });

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background p-4 overflow-auto' 
    : '';

  const handleEstatusInternoChange = (serviceId: string, newEstatus: EstatusInterno, e: React.MouseEvent) => {
    e.stopPropagation();
    updateEstatusInternoMutation.mutate({ serviceId, estatusInterno: newEstatus });
  };

  const toggleServiceExpand = (serviceId: string) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="text-2xl font-bold">Resumen</h2>
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
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => refetchServices()} title="Actualizar">
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => refetchServices()}>
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

      {/* Stats Overview - Hide some for tecnico */}
      {isTecnico ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
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
              specialOrders.length > 0 && "ring-2 ring-cyan-500"
            )} 
            onClick={() => onNavigateToTab('special-orders')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 relative">
                  <ShoppingBag className="h-5 w-5 text-cyan-500" />
                  {sortedSpecialOrders.some(o => o.fecha_aprox_entrega && differenceInDays(new Date(o.fecha_aprox_entrega), currentTime) < 0) && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{specialOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Pedidos especiales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors relative",
              activeProjects.length > 0 && "ring-2 ring-teal-500"
            )} 
            onClick={() => onNavigateToTab('projects')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <FolderKanban className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Proyectos activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
              specialOrders.length > 0 && "ring-2 ring-cyan-500"
            )} 
            onClick={() => onNavigateToTab('special-orders')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 relative">
                  <ShoppingBag className="h-5 w-5 text-cyan-500" />
                  {sortedSpecialOrders.some(o => o.fecha_aprox_entrega && differenceInDays(new Date(o.fecha_aprox_entrega), currentTime) < 0) && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{specialOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Pedidos especiales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors relative",
              activeProjects.length > 0 && "ring-2 ring-teal-500"
            )} 
            onClick={() => onNavigateToTab('projects')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <FolderKanban className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Proyectos activos</p>
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

          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors relative",
              pendingWebOrders > 0 && "ring-2 ring-indigo-500"
            )} 
            onClick={() => onNavigateToTab('web-orders')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 relative">
                  <ShoppingCart className="h-5 w-5 text-indigo-500" />
                  {pendingWebOrders > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {pendingWebOrders > 9 ? '9+' : pendingWebOrders}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingWebOrders}</p>
                  <p className="text-xs text-muted-foreground">Pedidos web</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid - Different layout for tecnico */}
      {isTecnico ? (
        // Tecnico layout: Services left (wider), Special Orders right (narrower)
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Left Column - Services (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} />
                    Servicios en Tienda
                    <Badge variant="secondary" className="text-xs">{services.length}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-[10px] px-1.5">
                      Nuevo
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-[10px] px-1.5">
                      3+d
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500 text-[10px] px-1.5">
                      5+d
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                {servicesLoading ? (
                  <div className="space-y-1">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : sortedServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay servicios activos</p>
                  </div>
                ) : (
                  <ScrollArea className={isFullscreen ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-350px)] min-h-[400px]"}>
                    <div className="space-y-2 pr-4">
                      {sortedServices.map((service) => {
                        const days = differenceInDays(currentTime, new Date(service.fecha_elaboracion));
                        const isExpanded = expandedServiceId === service.id;
                        return (
                          <div
                            key={service.id}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all cursor-pointer",
                              getServiceBackgroundColor(service.estatus_interno, service.fecha_elaboracion),
                              getTimeBasedGlowClass(service.fecha_elaboracion, service.estatus_interno),
                              getUrgencyClass(service.fecha_elaboracion, service.estatus_interno)
                            )}
                            onClick={() => toggleServiceExpand(service.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm">#{service.clave}</span>
                                  {canEditServices ? (
                                    <Select
                                      value={service.estatus_interno}
                                      onValueChange={(value: EstatusInterno) => {
                                        updateEstatusInternoMutation.mutate({ 
                                          serviceId: service.id, 
                                          estatusInterno: value 
                                        });
                                      }}
                                    >
                                      <SelectTrigger 
                                        className="h-5 w-auto text-[10px] px-1.5 py-0 border-0 bg-transparent hover:bg-muted/50"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e) => e.stopPropagation()}>
                                        <SelectItem value="En tienda">Por revisar</SelectItem>
                                        <SelectItem value="En proceso">En proceso</SelectItem>
                                        <SelectItem value="Listo y avisado a cliente">Listo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    getEstatusInternoBadge(service.estatus_interno)
                                  )}
                                  {service.cliente !== 'MOSTR' && (
                                    <span className="text-xs opacity-75">• {service.cliente}</span>
                                  )}
                                </div>
                                <p className="text-xs opacity-80 mt-0.5">
                                  {service.condicion || 'Sin descripción'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge className={cn("text-white text-xs px-2 py-0.5", getServiceBadgeColor(days))}>
                                  {days === 0 ? 'Hoy' : `${days}d`}
                                </Badge>
                                {days >= 5 && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                                )}
                                {(service.comentarios || canEditServices) && (
                                  isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-current/20 space-y-2">
                                {service.comentarios && (
                                  <p className="text-xs opacity-90">{service.comentarios}</p>
                                )}
                                <div className="text-xs opacity-75">
                                  <span>Ingreso: {format(new Date(service.fecha_elaboracion), "d MMM yyyy", { locale: es })}</span>
                                </div>
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
          </div>

          {/* Right Column - Special Orders (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className={cn(
              "flex flex-col h-full",
              sortedSpecialOrders.some(o => o.fecha_aprox_entrega && differenceInDays(new Date(o.fecha_aprox_entrega), currentTime) < 0) && "ring-2 ring-red-500"
            )}>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} />
                    Pedidos
                    <Badge variant="secondary" className="text-xs">{specialOrders.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500 text-[9px] px-1">
                      Urgente
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                {specialOrdersLoading ? (
                  <div className="space-y-1">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedSpecialOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-1 opacity-30" />
                    <p className="text-sm">No hay pedidos</p>
                  </div>
                ) : (
                  <ScrollArea className={isFullscreen ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-350px)] min-h-[400px]"}>
                    <div className="space-y-2 pr-2">
                      {sortedSpecialOrders.map((order) => {
                        const daysUntilDelivery = order.fecha_aprox_entrega 
                          ? differenceInDays(new Date(order.fecha_aprox_entrega), currentTime)
                          : null;
                        const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;
                        
                        return (
                          <div
                            key={order.id}
                            className={cn(
                              "p-2 rounded-lg border-2 transition-all cursor-pointer bg-white dark:bg-slate-800",
                              getSpecialOrderColor(order.fecha_aprox_entrega),
                              getSpecialOrderUrgencyClass(order.fecha_aprox_entrega)
                            )}
                            onClick={() => onNavigateToTab('special-orders')}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-bold text-xs truncate">{order.producto}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5">
                                  <span className="truncate">{order.cliente}</span>
                                  {getSpecialOrderStatusBadge(order.estatus)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {daysUntilDelivery !== null ? (
                                  <Badge className={cn(
                                    "text-white text-[10px] px-1.5 py-0",
                                    isOverdue ? "bg-red-500" : daysUntilDelivery <= 1 ? "bg-red-500" : daysUntilDelivery <= 3 ? "bg-yellow-500 text-black" : "bg-green-500"
                                  )}>
                                    {isOverdue 
                                      ? `-${Math.abs(daysUntilDelivery)}d` 
                                      : daysUntilDelivery === 0 
                                        ? 'Hoy' 
                                        : `${daysUntilDelivery}d`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] px-1">S/F</Badge>
                                )}
                                {isOverdue && (
                                  <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Default layout for admin/ventas
        <div className={cn(
          "grid gap-4",
          isFullscreen ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* Left Column - Services + Special Orders */}
          <div className="space-y-4">
            {/* Services Panel - Expanded */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} />
                    Servicios en Tienda
                    <Badge variant="secondary" className="text-xs">{services.length}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-[10px] px-1.5">
                      Nuevo
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-[10px] px-1.5">
                      3+d
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500 text-[10px] px-1.5">
                      5+d
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                {servicesLoading ? (
                  <div className="space-y-1">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : sortedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay servicios activos</p>
                  </div>
                ) : (
                  <ScrollArea className={isFullscreen ? "h-[calc(60vh-180px)]" : "h-[350px] min-h-[250px]"}>
                    <div className="space-y-2 pr-4">
                      {sortedServices.map((service) => {
                        const days = differenceInDays(currentTime, new Date(service.fecha_elaboracion));
                        const isExpanded = expandedServiceId === service.id;
                        return (
                          <div
                            key={service.id}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all cursor-pointer",
                              getServiceBackgroundColor(service.estatus_interno, service.fecha_elaboracion),
                              getTimeBasedGlowClass(service.fecha_elaboracion, service.estatus_interno),
                              getUrgencyClass(service.fecha_elaboracion, service.estatus_interno)
                            )}
                            onClick={() => toggleServiceExpand(service.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm">#{service.clave}</span>
                                  {canEditServices ? (
                                    <Select
                                      value={service.estatus_interno}
                                      onValueChange={(value: EstatusInterno) => {
                                        updateEstatusInternoMutation.mutate({ 
                                          serviceId: service.id, 
                                          estatusInterno: value 
                                        });
                                      }}
                                    >
                                      <SelectTrigger 
                                        className="h-5 w-auto text-[10px] px-1.5 py-0 border-0 bg-transparent hover:bg-muted/50"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e) => e.stopPropagation()}>
                                        <SelectItem value="En tienda">Por revisar</SelectItem>
                                        <SelectItem value="En proceso">En proceso</SelectItem>
                                        <SelectItem value="Listo y avisado a cliente">Listo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    getEstatusInternoBadge(service.estatus_interno)
                                  )}
                                  {service.cliente !== 'MOSTR' && (
                                    <span className="text-xs opacity-75">• {service.cliente}</span>
                                  )}
                                </div>
                                <p className="text-xs truncate opacity-80 mt-0.5">
                                  {service.condicion || 'Sin descripción'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge className={cn("text-white text-xs px-2 py-0.5", getServiceBadgeColor(days))}>
                                  {days === 0 ? 'Hoy' : `${days}d`}
                                </Badge>
                                {days >= 5 && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                                )}
                                {(service.comentarios || canEditServices) && (
                                  isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-current/20 space-y-2">
                                {service.comentarios && (
                                  <p className="text-xs opacity-90">{service.comentarios}</p>
                                )}
                                <div className="text-xs opacity-75">
                                  <span>Ingreso: {format(new Date(service.fecha_elaboracion), "d MMM yyyy", { locale: es })}</span>
                                </div>
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

            {/* Special Orders Monitor - Below Services */}
            <Card className={cn(
              "flex flex-col",
              sortedSpecialOrders.some(o => o.fecha_aprox_entrega && differenceInDays(new Date(o.fecha_aprox_entrega), currentTime) < 0) && "ring-2 ring-red-500"
            )}>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} />
                    Pedidos Especiales
                    <Badge variant="secondary" className="text-xs">{specialOrders.length}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-[10px] px-1.5">
                      +3d
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-[10px] px-1.5">
                      2-3d
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500 text-[10px] px-1.5">
                      Urgente
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                {specialOrdersLoading ? (
                  <div className="space-y-1">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedSpecialOrders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-1 opacity-30" />
                    <p className="text-sm">No hay pedidos pendientes</p>
                  </div>
                ) : (
                  <ScrollArea className={isFullscreen ? "h-[calc(40vh-150px)]" : "h-[250px] min-h-[180px]"}>
                    <div className="space-y-2 pr-4">
                      {sortedSpecialOrders.map((order) => {
                        const daysUntilDelivery = order.fecha_aprox_entrega 
                          ? differenceInDays(new Date(order.fecha_aprox_entrega), currentTime)
                          : null;
                        const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;
                        
                        return (
                          <div
                            key={order.id}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all cursor-pointer bg-white dark:bg-slate-800",
                              getSpecialOrderColor(order.fecha_aprox_entrega),
                              getSpecialOrderUrgencyClass(order.fecha_aprox_entrega)
                            )}
                            onClick={() => onNavigateToTab('special-orders')}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm">{order.producto}</span>
                                  {getSpecialOrderStatusBadge(order.estatus)}
                                </div>
                                <div className="flex items-center gap-1 text-xs opacity-75 mt-0.5">
                                  <span>{order.cliente}</span>
                                  {order.fecha_aprox_entrega && (
                                    <span>• {format(new Date(order.fecha_aprox_entrega), "d MMM", { locale: es })}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {daysUntilDelivery !== null ? (
                                  <Badge className={cn(
                                    "text-white text-xs px-2 py-0.5",
                                    isOverdue ? "bg-red-500" : daysUntilDelivery <= 1 ? "bg-red-500" : daysUntilDelivery <= 3 ? "bg-yellow-500 text-black" : "bg-green-500"
                                  )}>
                                    {isOverdue 
                                      ? `-${Math.abs(daysUntilDelivery)}d` 
                                      : daysUntilDelivery === 0 
                                        ? 'Hoy' 
                                        : `${daysUntilDelivery}d`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5">S/F</Badge>
                                )}
                                {isOverdue && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Warranties Monitor - Below Special Orders (admin/supervisor only) */}
            {(isAdmin || hasAccess(['supervisor'])) && (
              <WarrantiesDashboardWidget onNavigateToTab={onNavigateToTab} />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">

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

            {/* Projects Monitor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={18} />
                    Proyectos
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500 text-[10px] px-1.5">
                      1-2d
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-[10px] px-1.5">
                      3d
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500 text-[10px] px-1.5">
                      5+d
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedActiveProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay proyectos activos
                  </p>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {sortedActiveProjects.map((project) => {
                        const daysSinceLog = project.last_log_at 
                          ? differenceInDays(currentTime, new Date(project.last_log_at))
                          : null;
                        
                        return (
                          <div
                            key={project.id}
                            className={cn(
                              "p-3 rounded-lg border-2 cursor-pointer hover:opacity-80 transition-opacity",
                              getProjectColor(project.last_log_at)
                            )}
                            onClick={() => onNavigateToTab('projects')}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{project.nombre_proyecto}</p>
                                <div className="flex items-center gap-1 text-xs opacity-75 mt-0.5">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">{project.cliente_nombre}</span>
                                </div>
                                <p className="text-[10px] opacity-60 mt-0.5">
                                  #{project.project_number} • {project.assigned_user_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {daysSinceLog !== null ? (
                                  <Badge className={cn(
                                    "text-white text-xs px-2 py-0.5",
                                    daysSinceLog >= 5 ? "bg-red-500" : daysSinceLog >= 3 ? "bg-yellow-500 text-black" : "bg-green-500"
                                  )}>
                                    {daysSinceLog === 0 ? 'Hoy' : `${daysSinceLog}d`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5">Sin log</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
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
      )}
    </div>
  );
};

// Warranties dashboard widget for admin/supervisor
const WarrantiesDashboardWidget: React.FC<{ onNavigateToTab: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['dashboard-warranties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranties')
        .select('id, descripcion_producto, clave_proveedor, estatus, fecha_ingreso')
        .neq('estatus', 'Listo para su entrega')
        .order('fecha_ingreso', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const getWarrantyStatusBadge = (estatus: string) => {
    switch (estatus) {
      case 'En revisión':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 text-[10px] px-1.5">En revisión</Badge>;
      case 'Con proveedor':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 text-[10px] px-1.5">Con proveedor</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5">{estatus}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Garantías Activas
            <Badge variant="secondary" className="text-xs">{warranties.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-1">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : warranties.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <ShieldCheck className="h-6 w-6 mx-auto mb-1 opacity-30" />
            <p className="text-sm">Sin garantías pendientes</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px] min-h-[120px]">
            <div className="space-y-2 pr-4">
              {warranties.map((w: any) => (
                <div
                  key={w.id}
                  className="p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToTab('warranties')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{w.descripcion_producto}</span>
                      <span className="text-xs text-muted-foreground">{w.clave_proveedor} • {format(new Date(w.fecha_ingreso), "d MMM", { locale: es })}</span>
                    </div>
                    {getWarrantyStatusBadge(w.estatus)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;