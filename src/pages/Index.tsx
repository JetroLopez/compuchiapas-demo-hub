import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import FeaturedServices from '../components/FeaturedServices';
import ProductCategories from '../components/ProductCategories';
import OfferPopup from '../components/OfferPopup';
import PromotionsCarousel from '../components/PromotionsCarousel';
import { ArrowRight, Phone, Mail, MapPin, Calendar, User, Search, Loader2, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Index: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    device: '',
    message: '',
    privacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  
  const [folio, setFolio] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    clave?: string;
    fecha_elaboracion?: string;
    estatus_interno?: string;
    comentarios?: string;
  } | null>(null);

  useEffect(() => {
    // Para el SEO
    document.title = "Compuchiapas | Servicios Técnicos y Venta de Equipo de Cómputo";
  }, []);

  const scrollToContact = () => {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchFolio = async () => {
    if (!folio.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('clave, fecha_elaboracion, estatus_interno, comentarios')
        .eq('clave', folio.trim())
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSearchResult({
          found: true,
          clave: data.clave,
          fecha_elaboracion: data.fecha_elaboracion,
          estatus_interno: data.estatus_interno,
          comentarios: data.comentarios
        });
      } else {
        setSearchResult({ found: false });
      }
    } catch (error) {
      console.error('Error searching folio:', error);
      setSearchResult({ found: false });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusMessage = (estatusInterno: string) => {
    switch (estatusInterno) {
      case 'En tienda':
        return 'por revisar';
      case 'En proceso':
        return 'en proceso';
      case 'Listo y avisado a cliente':
        return 'listo y puede pasar a recogerlo';
      default:
        return estatusInterno;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [id]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    const { data, error } = await (supabase as any).rpc('check_phone_exists', {
      phone_to_check: phone
    });

    if (error) {
      console.error('Error checking phone:', error);
      // Fallback seguro: si no podemos validar, tratamos como NO existente
      // para no bloquear al cliente; el descuento se valida luego por WhatsApp.
      return false;
    }

    return data === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.privacy) {
      toast({
        title: "Error",
        description: "Debes aceptar la política de privacidad.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Validar si el teléfono ya existe
      const phoneExists = await checkPhoneExists(formData.phone);

      // 2) Enviar el mensaje
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            email: '', // No hay campo de email en este formulario
            phone: formData.phone,
            subject: `Solicitud desde landing - ${formData.device}`,
            message: formData.message
          }
        ])
        .select('id')
        .maybeSingle();

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo lo antes posible.",
        variant: "default"
      });

      // 3) Si es teléfono nuevo, mostrar el descuento con el ID como código
      if (!phoneExists && data?.id) {
        setDiscountCode(data.id);
        setShowDiscountPopup(true);
      }

      setFormData({ name: '', phone: '', device: '', message: '', privacy: false });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error al enviar mensaje",
        description: "Por favor, intenta nuevamente más tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Hero />
      
      <PromotionsCarousel />
      
      {/* Status Lookup Box - Antes de Servicios */}
      <section className="section-padding bg-background">
        <div className="container-padding max-w-3xl mx-auto">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-tech-blue/20 dark:border-blue-500/30">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-2 text-tech-blue dark:text-blue-400 text-center">
                ¿Tienes en servicio un equipo con nosotros?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                Consulta el estado de tu servicio ingresando tu número de folio
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Ingresa tu número de folio"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchFolio()}
                  className="flex-1"
                />
                <Button onClick={handleSearchFolio} disabled={isSearching || !folio.trim()}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {searchResult && (
                <div className={cn(
                  "mt-4 p-4 rounded-lg text-left max-w-md mx-auto",
                  searchResult.found 
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                )}>
                  {searchResult.found ? (
                    <div>
                      <p className="text-green-800 dark:text-green-300">
                        Tu equipo con folio <strong>#{searchResult.clave}</strong> recepcionado el día{' '}
                        <strong>
                          {searchResult.fecha_elaboracion && format(new Date(searchResult.fecha_elaboracion + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </strong>{' '}
                        se encuentra en tienda y está <strong>{getStatusMessage(searchResult.estatus_interno || 'En tienda')}</strong>.
                      </p>
                      {searchResult.comentarios && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <strong>Comentarios:</strong> {searchResult.comentarios}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-800 dark:text-red-300">
                      No se encontró ningún servicio pendiente con el folio <strong>#{folio}</strong>. 
                      Verifica el número e intenta de nuevo o{' '}
                      <a 
                        href="https://wa.me/529622148546?text=Tengo%20dudas%20respecto%20a%20un%20servicio."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium hover:text-red-600 dark:hover:text-red-200"
                      >
                        comunícate con nosotros
                      </a>.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      
      <FeaturedServices />
      
      {/* Special Feature Section */}
      <section className="section-padding">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card dark:bg-card/80 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative h-64 lg:h-auto">
                <img 
                  src="https://tse2.mm.bing.net/th/id/OIP.0xOqxUXfsj6kSa2FffpRbgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3" 
                  alt="PC personalizada" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  ¿Necesitas un equipo personalizado?
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  ¡Ensamblamos tu PC ideal! Ya sea para gaming, diseño gráfico, 
                  arquitectura o uso general, construimos la computadora perfecta 
                  que se adapte a tus necesidades y presupuesto.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="bg-tech-blue/10 dark:bg-primary/20 px-4 py-2 rounded-full text-tech-blue dark:text-primary font-medium">
                    Gaming
                  </div>
                  <div className="bg-tech-blue/10 dark:bg-primary/20 px-4 py-2 rounded-full text-tech-blue dark:text-primary font-medium">
                    Diseño Gráfico
                  </div>
                  <div className="bg-tech-blue/10 dark:bg-primary/20 px-4 py-2 rounded-full text-tech-blue dark:text-primary font-medium">
                    Workstations
                  </div>
                  <div className="bg-tech-blue/10 dark:bg-primary/20 px-4 py-2 rounded-full text-tech-blue dark:text-primary font-medium">
                    Oficina
                  </div>
                </div>
                <a 
                  href="/productos" 
                  className="btn-secondary inline-flex items-center self-start"
                >
                  Cotiza tu PC <ArrowRight size={18} className="ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <ProductCategories />
      
      {/* Blog Preview Section */}
      <section className="section-padding bg-background">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Últimas del Blog
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Consejos, tutoriales y novedades del mundo tecnológico
            </p>
          </div>
          
          <div className="glass-card dark:bg-card/80 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Featured Blog Image */}
              <div className="relative h-64 lg:h-auto min-h-[300px]">
                <img 
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Artículo destacado del blog" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block bg-tech-blue text-white text-xs font-medium px-3 py-1 rounded-full mb-2">
                    Destacado
                  </span>
                </div>
              </div>
              
              {/* Blog Content Preview */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    15 de Enero, 2026
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    Equipo Compuchiapas
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  5 señales de que tu computadora necesita mantenimiento
                </h3>
                
                <p className="text-muted-foreground mb-6 line-clamp-3">
                  ¿Tu computadora está más lenta de lo normal? ¿Escuchas ruidos extraños o se calienta demasiado? 
                  Descubre las señales más comunes que indican que es hora de dar mantenimiento a tu equipo 
                  y cómo prevenir problemas mayores.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/blog" 
                    className="btn-primary inline-flex items-center justify-center"
                  >
                    Ver blog completo <ArrowRight size={18} className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contacto" className="section-padding bg-tech-lightGray dark:bg-muted/30">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card dark:bg-card/80 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Contáctanos</h2>
                <p className="text-muted-foreground mb-8">
                  ¿Tienes preguntas o necesitas ayuda? No dudes en contactarnos. 
                  Nuestro equipo de expertos estará encantado de asistirte.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 dark:bg-primary/20 p-3 rounded-full text-tech-blue dark:text-primary mr-4">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Teléfono</h3>
                      <p className="text-muted-foreground">+52 (962) 214-8546</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 dark:bg-primary/20 p-3 rounded-full text-tech-blue dark:text-primary mr-4">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Email</h3>
                      <p className="text-muted-foreground">info@compuchiapas.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 dark:bg-primary/20 p-3 rounded-full text-tech-blue dark:text-primary mr-4">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Ubicación</h3>
                      <p className="text-muted-foreground">
                        <a href="https://maps.app.goo.gl/jp9mgSQvwcNeHM1U9" target="_blank" rel="noopener noreferrer" className="hover:text-tech-blue dark:hover:text-primary">
                          6a. Avenida Sur, Centro, 30700 Tapachula de Córdova y Ordóñez, Chis.
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu nombre"
                        required
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu teléfono"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="device" className="block text-sm font-medium text-foreground mb-1">
                      Tipo de dispositivo
                    </label>
                    <select
                      id="device"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={formData.device}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Computadora de Escritorio</option>
                      <option value="printer">Impresora</option>
                      <option value="network">Dispositivo de Red</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                      Describe tu problema
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Detalla el problema que estás experimentando..."
                      required
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="privacy"
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      required
                      checked={formData.privacy}
                      onChange={handleChange}
                    />
                    <label htmlFor="privacy" className="ml-2 block text-sm text-muted-foreground">
                      Acepto la política de privacidad
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Espere un momento
                      </span>
                    ) : (
                      'Enviar mensaje'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popup de descuento (solo si el teléfono es único) */}
      <Dialog open={showDiscountPopup} onOpenChange={setShowDiscountPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-center justify-center">
              <Gift className="text-green-500" size={32} />
              ¡Felicidades!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6">
              <p className="text-lg font-semibold mb-2">Ganaste</p>
              <p className="text-4xl font-bold">10% de descuento</p>
              <p className="text-sm mt-2 opacity-90">en tu próximo servicio</p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Presenta el siguiente código en mostrador:
              </p>
              <p className="font-mono text-lg font-bold text-foreground bg-background border border-border rounded px-4 py-2 inline-block select-all">
                {discountCode}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Este código tendrá validez verificando el número de teléfono por WhatsApp.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup offer with close button that minimizes to bottom */}
      <OfferPopup
        title="¡Oferta especial!"
        description="10% de descuento en tu primer servicio técnico. Menciona esta promoción al contactarnos."
        ctaText="¡Aprovecha ahora!"
        onCtaClick={scrollToContact}
      />
    </Layout>
  );
};

export default Index;
