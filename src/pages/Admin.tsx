import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut, Package, Users, Shield, RefreshCw, Tag, MessageCircle, Wrench, LayoutDashboard, Moon, Sun } from 'lucide-react';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminUsers from '@/components/admin/AdminUsers';
import ProductSync from '@/components/admin/ProductSync';
import AdminPromotions from '@/components/admin/AdminPromotions';
import AdminContacts from '@/components/admin/AdminContacts';
import AdminServices from '@/components/admin/AdminServices';
import AdminDashboard from '@/components/admin/AdminDashboard';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
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
      // Create audio context for louder notification
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play three beeps for urgency
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
      playBeep(currentTime, 880, 0.2);       // A5
      playBeep(currentTime + 0.25, 988, 0.2); // B5
      playBeep(currentTime + 0.5, 1047, 0.3); // C6
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  // Track new contacts since last viewed
  const { data: pendingContactsCount = 0 } = useQuery({
    queryKey: ['pending-contacts-count', lastViewedContactsTime],
    queryFn: async () => {
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

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 transition-colors duration-300">
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
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 flex-wrap bg-muted/50">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard size={16} />
                Compusistemas de Chiapas
              </TabsTrigger>
              <TabsTrigger value="sync" className="gap-2">
                <RefreshCw size={16} />
                Sincronizar
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} />
                Productos
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-2">
                <Tag size={16} />
                Promociones
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users size={16} />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2 relative">
                <MessageCircle size={16} />
                Contacto
                {pendingContactsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-notification-bounce">
                    {pendingContactsCount > 9 ? '9+' : pendingContactsCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Wrench size={16} />
                Servicios
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <AdminDashboard 
                onNavigateToTab={setActiveTab}
                pendingContactsCount={pendingContactsCount}
                onContactsViewed={handleContactsViewed}
              />
            </TabsContent>
            
            <TabsContent value="sync">
              <ProductSync />
            </TabsContent>
            
            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>
            
            <TabsContent value="promotions">
              <AdminPromotions />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="contacts">
              <AdminContacts />
            </TabsContent>

            <TabsContent value="services">
              <AdminServices />
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