import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, Package, Users, Shield, RefreshCw, Tag, MessageCircle, Wrench, LayoutDashboard, Moon, Sun, FileText, ShoppingBag, ChevronDown, Menu, PackageX, Calculator, Settings, ShoppingCart, FolderKanban, Store, MoreHorizontal, Eye, ShieldCheck, Warehouse, Image, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminUsers from '@/components/admin/AdminUsers';
import ProductSync from '@/components/admin/ProductSync';
import AdminPromotions from '@/components/admin/AdminPromotions';
import AdminContacts from '@/components/admin/AdminContacts';
import AdminServices from '@/components/admin/AdminServices';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminBlog from '@/components/admin/AdminBlog';
import AdminSpecialOrders from '@/components/admin/AdminSpecialOrders';
import AdminPorSurtir from '@/components/admin/AdminPorSurtir';
import AdminQuotations from '@/components/admin/AdminQuotations';
import AdminComponentSpecs from '@/components/admin/AdminComponentSpecs';
import AdminWebOrders from '@/components/admin/AdminWebOrders';
import AdminProjects from '@/components/admin/AdminProjects';
import AdminWarranties from '@/components/admin/AdminWarranties';
import AdminBodega from '@/components/admin/AdminBodega';
import AdminLandingPage from '@/components/admin/AdminLandingPage';
import AdminSoftwareESD from '@/components/admin/AdminSoftwareESD';
import { Badge } from '@/components/ui/badge';

// Tab label mapping
const TAB_LABELS: Record<string, string> = {
  'dashboard': 'Resumen',
  'sync': 'Sincronizar',
  'products': 'Productos',
  'por-surtir': 'Por Surtir',
  'promotions': 'Promociones',
  'software-esd': 'Software ESD',
  'users': 'Usuarios',
  'contacts': 'Contacto',
  'services': 'Servicios',
  'quotations': 'Cotizaciones',
  'component-specs': 'Componentes PC',
  'blog': 'Blog',
  'projects': 'Proyectos',
  'special-orders': 'Pedidos Especiales',
  'web-orders': 'Pedidos Web',
  'warranties': 'Garantías',
  'bodega': 'Bodega',
  'landing-page': 'Landing Page',
};

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading, signOut, hasAccess } = useAuth();
  const { isPageVisible } = usePageVisibility();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastViewedContactsTime, setLastViewedContactsTime] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-dark-mode') === 'true';
    }
    return false;
  });
  const previousContactsCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Role checks
  const isSupervisor = userRole === 'supervisor';
  const isVentas = userRole === 'ventas';
  const isTecnico = userRole === 'tecnico';
  const isAdmin = userRole === 'admin';

  // Role-based access configuration
  const canAccessSync = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessProducts = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessPromotions = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessSoftwareESD = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessUsers = hasAccess(['admin']);
  const canAccessContacts = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessServices = hasAccess(['admin', 'tecnico', 'supervisor', 'ventas']);
  const canAccessBlog = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessSpecialOrders = hasAccess(['admin', 'ventas', 'tecnico', 'supervisor']);
  const canAccessPorSurtir = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessQuotations = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessComponentSpecs = hasAccess(['admin']);
  const canAccessWebOrders = hasAccess(['admin', 'ventas', 'supervisor']);
  const canAccessProjects = hasAccess(['admin', 'ventas', 'tecnico', 'supervisor']);
  const canAccessWarranties = hasAccess(['admin', 'supervisor', 'tecnico', 'ventas']);
  const canAccessBodega = hasAccess(['admin', 'supervisor', 'tecnico', 'ventas']);
  const canAccessLandingPage = hasAccess(['admin', 'supervisor', 'ventas']);
  const isServicesReadOnly = isVentas;
  const isWarrantiesReadOnly = !hasAccess(['admin', 'supervisor']);

  // Initialize dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  // Create notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = audioContext.currentTime;
      playBeep(currentTime, 880, 0.2);
      playBeep(currentTime + 0.25, 988, 0.2);
      playBeep(currentTime + 0.5, 1047, 0.3);
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  // Track new contacts since last viewed (only for roles with access)
  const { data: pendingContactsCount = 0 } = useQuery({
    queryKey: ['pending-contacts-count', lastViewedContactsTime],
    queryFn: async () => {
      if (!canAccessContacts) return 0;
      
      let query = supabase
        .from('contact_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (lastViewedContactsTime) {
        query = query.gt('created_at', lastViewedContactsTime.toISOString());
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
    enabled: canAccessContacts,
  });

  // Play sound when new contacts arrive
  useEffect(() => {
    if (pendingContactsCount > previousContactsCount.current && previousContactsCount.current >= 0) {
      playNotificationSound();
    }
    previousContactsCount.current = pendingContactsCount;
  }, [pendingContactsCount, playNotificationSound]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Reset to dashboard if current tab is not accessible
  useEffect(() => {
    if (!isLoading && userRole) {
      if (activeTab === 'sync' && !canAccessSync) setActiveTab('dashboard');
      if (activeTab === 'products' && !canAccessProducts) setActiveTab('dashboard');
      if (activeTab === 'promotions' && !canAccessPromotions) setActiveTab('dashboard');
      if (activeTab === 'software-esd' && !canAccessSoftwareESD) setActiveTab('dashboard');
      if (activeTab === 'users' && !canAccessUsers) setActiveTab('dashboard');
      if (activeTab === 'contacts' && !canAccessContacts) setActiveTab('dashboard');
      if (activeTab === 'services' && !canAccessServices) setActiveTab('dashboard');
      if (activeTab === 'blog' && !canAccessBlog) setActiveTab('dashboard');
      if (activeTab === 'special-orders' && !canAccessSpecialOrders) setActiveTab('dashboard');
      if (activeTab === 'por-surtir' && !canAccessPorSurtir) setActiveTab('dashboard');
      if (activeTab === 'quotations' && !canAccessQuotations) setActiveTab('dashboard');
      if (activeTab === 'component-specs' && !canAccessComponentSpecs) setActiveTab('dashboard');
      if (activeTab === 'web-orders' && !canAccessWebOrders) setActiveTab('dashboard');
      if (activeTab === 'projects' && !canAccessProjects) setActiveTab('dashboard');
      if (activeTab === 'warranties' && !canAccessWarranties) setActiveTab('dashboard');
      if (activeTab === 'bodega' && !canAccessBodega) setActiveTab('dashboard');
      if (activeTab === 'landing-page' && !canAccessLandingPage) setActiveTab('dashboard');
    }
  }, [isLoading, userRole, activeTab, canAccessSync, canAccessProducts, canAccessPromotions, canAccessSoftwareESD, canAccessUsers, canAccessContacts, canAccessServices, canAccessBlog, canAccessSpecialOrders, canAccessPorSurtir, canAccessQuotations, canAccessComponentSpecs, canAccessWebOrders, canAccessProjects, canAccessWarranties, canAccessBodega, canAccessLandingPage]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleContactsViewed = () => {
    setLastViewedContactsTime(new Date());
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            <Shield size={12} />
            Admin
          </span>
        );
      case 'supervisor':
        return (
          <span className="flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-600 px-2 py-1 rounded-full">
            <Eye size={12} />
            Supervisor
          </span>
        );
      case 'tecnico':
        return (
          <span className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full">
            <Wrench size={12} />
            Técnico
          </span>
        );
      case 'ventas':
        return (
          <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
            <Package size={12} />
            Ventas
          </span>
        );
      default:
        return null;
    }
  };

  // Define secondary tabs per role (hidden behind dropdown)
  const getSupervisorSecondaryTabs = () => [
    { value: 'sync', icon: RefreshCw, label: 'Sincronizar' },
    { value: 'promotions', icon: Tag, label: 'Promociones' },
    { value: 'software-esd', icon: Download, label: 'Software ESD' },
    { value: 'products', icon: Package, label: 'Productos' },
    { value: 'contacts', icon: MessageCircle, label: 'Contacto', badge: pendingContactsCount },
    { value: 'blog', icon: FileText, label: 'Blog' },
    { value: 'quotations', icon: Calculator, label: 'Cotizaciones' },
  ];

  const getVentasSecondaryTabs = () => [
    { value: 'sync', icon: RefreshCw, label: 'Sincronizar' },
    { value: 'services', icon: Wrench, label: 'Servicios' },
    { value: 'products', icon: Package, label: 'Productos' },
    { value: 'software-esd', icon: Download, label: 'Software ESD' },
    { value: 'blog', icon: FileText, label: 'Blog' },
  ];

  const isSecondaryTab = (tab: string) => {
    if (isSupervisor) {
      return getSupervisorSecondaryTabs().some(t => t.value === tab);
    }
    if (isVentas) {
      return getVentasSecondaryTabs().some(t => t.value === tab);
    }
    return false;
  };

  // Contact badge component
  const ContactBadge = ({ count }: { count: number }) => {
    if (count <= 0) return null;
    return (
      <span className="ml-auto h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
        {count > 9 ? '9+' : count}
      </span>
    );
  };

  // Render mobile dropdown items based on role
  const renderMobileItems = () => {
    if (isSupervisor) {
      return (
        <>
          <DropdownMenuItem onClick={() => setActiveTab('dashboard')} className="gap-2">
            <LayoutDashboard size={16} /> Resumen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('special-orders')} className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('por-surtir')} className="gap-2">
            <PackageX size={16} /> Por Surtir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('projects')} className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('services')} className="gap-2">
            <Wrench size={16} /> Servicios
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs text-muted-foreground font-semibold pointer-events-none pt-3">
            Tienda en línea
          </DropdownMenuItem>
          {getSupervisorSecondaryTabs().map(tab => (
            <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)} className="gap-2 pl-6">
              <tab.icon size={16} /> {tab.label}
              {tab.badge ? <ContactBadge count={tab.badge} /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setActiveTab('web-orders')} className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('warranties')} className="gap-2">
            <ShieldCheck size={16} /> Garantías
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('bodega')} className="gap-2">
            <Warehouse size={16} /> Bodega
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('landing-page')} className="gap-2">
            <Image size={16} /> Landing Page
          </DropdownMenuItem>
        </>
      );
    }

    if (isVentas) {
      return (
        <>
          <DropdownMenuItem onClick={() => setActiveTab('dashboard')} className="gap-2">
            <LayoutDashboard size={16} /> Inicio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('projects')} className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('web-orders')} className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('contacts')} className="gap-2 relative">
            <MessageCircle size={16} /> Contacto
            <ContactBadge count={pendingContactsCount} />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('special-orders')} className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('por-surtir')} className="gap-2">
            <PackageX size={16} /> Por Surtir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('quotations')} className="gap-2">
            <Calculator size={16} /> Cotizaciones
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('promotions')} className="gap-2">
            <Tag size={16} /> Promociones
          </DropdownMenuItem>
          {canAccessSoftwareESD && (
            <DropdownMenuItem onClick={() => setActiveTab('software-esd')} className="gap-2">
              <Download size={16} /> Software ESD
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setActiveTab('warranties')} className="gap-2">
            <ShieldCheck size={16} /> Garantías
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab('bodega')} className="gap-2">
            <Warehouse size={16} /> Bodega
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs text-muted-foreground font-semibold pointer-events-none pt-3">
            Otras opciones
          </DropdownMenuItem>
          {getVentasSecondaryTabs().map(tab => (
            <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)} className="gap-2 pl-6">
              <tab.icon size={16} /> {tab.label}
            </DropdownMenuItem>
          ))}
        </>
      );
    }

    if (isTecnico) {
      return (
        <>
          <DropdownMenuItem onClick={() => setActiveTab('dashboard')} className="gap-2">
            <LayoutDashboard size={16} /> Resumen
          </DropdownMenuItem>
          {canAccessServices && (
            <DropdownMenuItem onClick={() => setActiveTab('services')} className="gap-2">
              <Wrench size={16} /> Servicios
            </DropdownMenuItem>
          )}
          {canAccessSpecialOrders && (
            <DropdownMenuItem onClick={() => setActiveTab('special-orders')} className="gap-2">
              <ShoppingBag size={16} /> Pedidos Especiales
            </DropdownMenuItem>
          )}
          {canAccessProjects && (
            <DropdownMenuItem onClick={() => setActiveTab('projects')} className="gap-2">
              <FolderKanban size={16} /> Proyectos
            </DropdownMenuItem>
          )}
          {canAccessWarranties && (
            <DropdownMenuItem onClick={() => setActiveTab('warranties')} className="gap-2">
              <ShieldCheck size={16} /> Garantías
            </DropdownMenuItem>
          )}
          {canAccessBodega && (
            <DropdownMenuItem onClick={() => setActiveTab('bodega')} className="gap-2">
              <Warehouse size={16} /> Bodega
            </DropdownMenuItem>
          )}
        </>
      );
    }

    // Admin - all tabs
    return (
      <>
        <DropdownMenuItem onClick={() => setActiveTab('dashboard')} className="gap-2">
          <LayoutDashboard size={16} /> Resumen
        </DropdownMenuItem>
        {canAccessSync && (
          <DropdownMenuItem onClick={() => setActiveTab('sync')} className="gap-2">
            <RefreshCw size={16} /> Sincronizar
          </DropdownMenuItem>
        )}
        {canAccessProducts && (
          <DropdownMenuItem onClick={() => setActiveTab('products')} className="gap-2">
            <Package size={16} /> Productos
          </DropdownMenuItem>
        )}
        {canAccessPromotions && (
          <DropdownMenuItem onClick={() => setActiveTab('promotions')} className="gap-2">
            <Tag size={16} /> Promociones
          </DropdownMenuItem>
        )}
        {canAccessSoftwareESD && (
          <DropdownMenuItem onClick={() => setActiveTab('software-esd')} className="gap-2">
            <Download size={16} /> Software ESD
          </DropdownMenuItem>
        )}
        {canAccessUsers && (
          <DropdownMenuItem onClick={() => setActiveTab('users')} className="gap-2">
            <Users size={16} /> Usuarios
          </DropdownMenuItem>
        )}
        {canAccessContacts && (
          <DropdownMenuItem onClick={() => setActiveTab('contacts')} className="gap-2 relative">
            <MessageCircle size={16} /> Contacto
            <ContactBadge count={pendingContactsCount} />
          </DropdownMenuItem>
        )}
        {canAccessServices && (
          <DropdownMenuItem onClick={() => setActiveTab('services')} className="gap-2">
            <Wrench size={16} /> Servicios
          </DropdownMenuItem>
        )}
        {canAccessBlog && (
          <DropdownMenuItem onClick={() => setActiveTab('blog')} className="gap-2">
            <FileText size={16} /> Blog
          </DropdownMenuItem>
        )}
        {canAccessSpecialOrders && (
          <DropdownMenuItem onClick={() => setActiveTab('special-orders')} className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </DropdownMenuItem>
        )}
        {canAccessPorSurtir && (
          <DropdownMenuItem onClick={() => setActiveTab('por-surtir')} className="gap-2">
            <PackageX size={16} /> Por Surtir
          </DropdownMenuItem>
        )}
        {canAccessQuotations && (
          <DropdownMenuItem onClick={() => setActiveTab('quotations')} className="gap-2">
            <Calculator size={16} /> Cotizaciones
          </DropdownMenuItem>
        )}
        {canAccessComponentSpecs && (
          <DropdownMenuItem onClick={() => setActiveTab('component-specs')} className="gap-2">
            <Settings size={16} /> Componentes PC
          </DropdownMenuItem>
        )}
        {canAccessWebOrders && (
          <DropdownMenuItem onClick={() => setActiveTab('web-orders')} className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </DropdownMenuItem>
        )}
        {canAccessProjects && (
          <DropdownMenuItem onClick={() => setActiveTab('projects')} className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </DropdownMenuItem>
        )}
        {canAccessWarranties && (
          <DropdownMenuItem onClick={() => setActiveTab('warranties')} className="gap-2">
            <ShieldCheck size={16} /> Garantías
          </DropdownMenuItem>
        )}
        {canAccessBodega && (
          <DropdownMenuItem onClick={() => setActiveTab('bodega')} className="gap-2">
            <Warehouse size={16} /> Bodega
          </DropdownMenuItem>
        )}
        {canAccessLandingPage && (
          <DropdownMenuItem onClick={() => setActiveTab('landing-page')} className="gap-2">
            <Image size={16} /> Landing Page
          </DropdownMenuItem>
        )}
      </>
    );
  };

  // Render desktop tabs based on role
  const renderDesktopTabs = () => {
    if (isSupervisor) {
      const secondaryTabs = getSupervisorSecondaryTabs();
      const isSecondaryActive = secondaryTabs.some(t => t.value === activeTab);

      return (
        <TabsList className="mb-6 flex-wrap bg-muted/50 hidden md:flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard size={16} /> Resumen
          </TabsTrigger>
          <TabsTrigger value="special-orders" className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </TabsTrigger>
          <TabsTrigger value="por-surtir" className="gap-2">
            <PackageX size={16} /> Por Surtir
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Wrench size={16} /> Servicios
          </TabsTrigger>
          <TabsTrigger value="web-orders" className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </TabsTrigger>
          <TabsTrigger value="warranties" className="gap-2">
            <ShieldCheck size={16} /> Garantías
          </TabsTrigger>
          <TabsTrigger value="bodega" className="gap-2">
            <Warehouse size={16} /> Bodega
          </TabsTrigger>

          {/* Tienda en línea dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 h-9 px-3 text-sm font-medium rounded-md ${isSecondaryActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Store size={16} />
                Tienda en línea
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {secondaryTabs.map(tab => (
                <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)} className="gap-2">
                  <tab.icon size={16} /> {tab.label}
                  {tab.badge ? <ContactBadge count={tab.badge} /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>
      );
    }

    if (isVentas) {
      const secondaryTabs = getVentasSecondaryTabs();
      const isSecondaryActive = secondaryTabs.some(t => t.value === activeTab);

      return (
        <TabsList className="mb-6 flex-wrap bg-muted/50 hidden md:flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard size={16} /> Inicio
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </TabsTrigger>
          <TabsTrigger value="web-orders" className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2 relative">
            <MessageCircle size={16} /> Contacto
            {pendingContactsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-notification-bounce">
                {pendingContactsCount > 9 ? '9+' : pendingContactsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="special-orders" className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </TabsTrigger>
          <TabsTrigger value="por-surtir" className="gap-2">
            <PackageX size={16} /> Por Surtir
          </TabsTrigger>
          <TabsTrigger value="quotations" className="gap-2">
            <Calculator size={16} /> Cotizaciones
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-2">
            <Tag size={16} /> Promociones
          </TabsTrigger>
          {canAccessSoftwareESD && (
            <TabsTrigger value="software-esd" className="gap-2">
              <Download size={16} /> Software ESD
            </TabsTrigger>
          )}

          {/* Otras opciones dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 h-9 px-3 text-sm font-medium rounded-md ${isSecondaryActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MoreHorizontal size={16} />
                Otras opciones
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {secondaryTabs.map(tab => (
                <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)} className="gap-2">
                  <tab.icon size={16} /> {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>
      );
    }

    if (isTecnico) {
      return (
        <TabsList className="mb-6 flex-wrap bg-muted/50 hidden md:flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard size={16} /> Resumen
          </TabsTrigger>
          {canAccessServices && (
            <TabsTrigger value="services" className="gap-2">
              <Wrench size={16} /> Servicios
            </TabsTrigger>
          )}
          {canAccessSpecialOrders && (
            <TabsTrigger value="special-orders" className="gap-2">
              <ShoppingBag size={16} /> Pedidos Especiales
            </TabsTrigger>
          )}
          {canAccessProjects && (
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban size={16} /> Proyectos
            </TabsTrigger>
          )}
          {canAccessWarranties && (
            <TabsTrigger value="warranties" className="gap-2">
              <ShieldCheck size={16} /> Garantías
            </TabsTrigger>
          )}
          {canAccessBodega && (
            <TabsTrigger value="bodega" className="gap-2">
              <Warehouse size={16} /> Bodega
            </TabsTrigger>
          )}
        </TabsList>
      );
    }

    // Admin - all tabs
    return (
      <TabsList className="mb-6 flex-wrap bg-muted/50 hidden md:flex">
        <TabsTrigger value="dashboard" className="gap-2">
          <LayoutDashboard size={16} /> Resumen
        </TabsTrigger>
        {canAccessSync && (
          <TabsTrigger value="sync" className="gap-2">
            <RefreshCw size={16} /> Sincronizar
          </TabsTrigger>
        )}
        {canAccessProducts && (
          <TabsTrigger value="products" className="gap-2">
            <Package size={16} /> Productos
          </TabsTrigger>
        )}
        {canAccessPromotions && (
          <TabsTrigger value="promotions" className="gap-2">
            <Tag size={16} /> Promociones
          </TabsTrigger>
        )}
        {canAccessSoftwareESD && (
          <TabsTrigger value="software-esd" className="gap-2">
            <Download size={16} /> Software ESD
          </TabsTrigger>
        )}
        {canAccessUsers && (
          <TabsTrigger value="users" className="gap-2">
            <Users size={16} /> Usuarios
          </TabsTrigger>
        )}
        {canAccessContacts && (
          <TabsTrigger value="contacts" className="gap-2 relative">
            <MessageCircle size={16} /> Contacto
            {pendingContactsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-notification-bounce">
                {pendingContactsCount > 9 ? '9+' : pendingContactsCount}
              </span>
            )}
          </TabsTrigger>
        )}
        {canAccessServices && (
          <TabsTrigger value="services" className="gap-2">
            <Wrench size={16} /> Servicios
          </TabsTrigger>
        )}
        {canAccessBlog && (
          <TabsTrigger value="blog" className="gap-2">
            <FileText size={16} /> Blog
          </TabsTrigger>
        )}
        {canAccessSpecialOrders && (
          <TabsTrigger value="special-orders" className="gap-2">
            <ShoppingBag size={16} /> Pedidos Especiales
          </TabsTrigger>
        )}
        {canAccessPorSurtir && (
          <TabsTrigger value="por-surtir" className="gap-2">
            <PackageX size={16} /> Por Surtir
          </TabsTrigger>
        )}
        {canAccessQuotations && (
          <TabsTrigger value="quotations" className="gap-2">
            <Calculator size={16} /> Cotizaciones
          </TabsTrigger>
        )}
        {canAccessComponentSpecs && (
          <TabsTrigger value="component-specs" className="gap-2">
            <Settings size={16} /> Componentes PC
          </TabsTrigger>
        )}
        {canAccessWebOrders && (
          <TabsTrigger value="web-orders" className="gap-2">
            <ShoppingCart size={16} /> Pedidos Web
          </TabsTrigger>
        )}
        {canAccessProjects && (
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban size={16} /> Proyectos
          </TabsTrigger>
        )}
        {canAccessWarranties && (
          <TabsTrigger value="warranties" className="gap-2">
            <ShieldCheck size={16} /> Garantías
          </TabsTrigger>
        )}
        {canAccessBodega && (
          <TabsTrigger value="bodega" className="gap-2">
            <Warehouse size={16} /> Bodega
          </TabsTrigger>
        )}
        {canAccessLandingPage && (
          <TabsTrigger value="landing-page" className="gap-2">
            <Image size={16} /> Landing Page
          </TabsTrigger>
        )}
      </TabsList>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }



  if (!user) {
    return null;
  }

  // If admin page is hidden and user is NOT admin, show restriction message
  if (!isPageVisible('admin') && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-16 max-w-md">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Función no disponible en el plan actual</h2>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidad no está disponible en este momento. Contacta al administrador para más información.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has any valid role (not just 'user')
  const hasAnyRole = userRole && ['admin', 'tecnico', 'ventas', 'supervisor'].includes(userRole);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gradient">Compuchiapas Admin</h1>
            {getRoleBadge()}
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
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
        {hasAnyRole ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile dropdown menu */}
            <div className="md:hidden mb-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Menu size={16} />
                      {TAB_LABELS[activeTab] || activeTab}
                    </span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)] bg-background border border-border">
                  {renderMobileItems()}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop tabs */}
            {renderDesktopTabs()}
            
            <TabsContent value="dashboard">
              <AdminDashboard 
                onNavigateToTab={setActiveTab}
                pendingContactsCount={pendingContactsCount}
                onContactsViewed={handleContactsViewed}
                isTecnico={isTecnico}
              />
            </TabsContent>
            
            {canAccessSync && (
              <TabsContent value="sync">
                <ProductSync userRole={userRole} />
              </TabsContent>
            )}
            
            {canAccessProducts && (
              <TabsContent value="products">
                <AdminProducts userRole={userRole} />
              </TabsContent>
            )}
            
            {canAccessPromotions && (
              <TabsContent value="promotions">
                <AdminPromotions />
              </TabsContent>
            )}
            
            {canAccessSoftwareESD && (
              <TabsContent value="software-esd">
                <AdminSoftwareESD />
              </TabsContent>
            )}
            
            {canAccessUsers && (
              <TabsContent value="users">
                <AdminUsers />
              </TabsContent>
            )}

            {canAccessContacts && (
              <TabsContent value="contacts">
                <AdminContacts />
              </TabsContent>
            )}

            {canAccessServices && (
              <TabsContent value="services">
                <AdminServices readOnly={isServicesReadOnly} />
              </TabsContent>
            )}

            {canAccessBlog && (
              <TabsContent value="blog">
                <AdminBlog />
              </TabsContent>
            )}

            {canAccessSpecialOrders && (
              <TabsContent value="special-orders">
                <AdminSpecialOrders />
              </TabsContent>
            )}

            {canAccessPorSurtir && (
              <TabsContent value="por-surtir">
                <AdminPorSurtir />
              </TabsContent>
            )}

            {canAccessQuotations && (
              <TabsContent value="quotations">
                <AdminQuotations />
              </TabsContent>
            )}

            {canAccessComponentSpecs && (
              <TabsContent value="component-specs">
                <AdminComponentSpecs />
              </TabsContent>
            )}

            {canAccessWebOrders && (
              <TabsContent value="web-orders">
                <AdminWebOrders />
              </TabsContent>
            )}

            {canAccessProjects && (
              <TabsContent value="projects">
                <AdminProjects />
              </TabsContent>
            )}

            {canAccessWarranties && (
              <TabsContent value="warranties">
                <AdminWarranties />
              </TabsContent>
            )}

            {canAccessBodega && (
              <TabsContent value="bodega">
                <AdminBodega />
              </TabsContent>
            )}

            {canAccessLandingPage && (
              <TabsContent value="landing-page">
                <AdminLandingPage />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">
              No tienes permisos asignados. Contacta al administrador para obtener acceso.
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
