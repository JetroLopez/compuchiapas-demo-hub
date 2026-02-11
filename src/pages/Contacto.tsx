import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight, Gift, X, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Función para normalizar números de teléfono (quitar todo excepto dígitos)
const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

const Contacto: React.FC = () => {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    // Para el SEO
    document.title = "Contacto | Compuchiapas";
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      id,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    // Usar la función de base de datos que tiene permisos elevados
    const { data, error } = await (supabase as any).rpc('check_phone_exists', {
      phone_to_check: phone
    });
    
    if (error) {
      console.error('Error checking phone:', error);
      return false;
    }
    
    return data === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Verificar si el teléfono ya existe ANTES de insertar
      const phoneExists = await checkPhoneExists(formData.phone);
      
      // Usar función RPC que hace insert y devuelve el ID
      const { data: newId, error } = await (supabase as any).rpc('submit_contact', {
        p_name: formData.name,
        p_email: formData.email,
        p_phone: formData.phone,
        p_subject: formData.subject,
        p_message: formData.message
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo lo antes posible.",
        variant: "default"
      });

      // Si es primera vez con este teléfono, mostrar popup de descuento
      if (!phoneExists && newId) {
        setDiscountCode(newId);
        setShowDiscountPopup(true);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
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
  return <Layout>
      {/* Hero Section */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 bg-gradient-to-b from-background to-muted">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">Contáctanos</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Estamos aquí para ayudarte con todas tus necesidades tecnológicas
          </p>
        </div>
      </section>
      
      {/* Contact Info Cards */}
      <section className="py-8 md:py-12">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* WhatsApp */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-card">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">WhatsApp</h3>
              <p className="text-muted-foreground mb-6">Respuesta inmediata a tus consultas</p>
              <a href="https://wa.me/529622148546" target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2 py-3 px-6">
                <MessageCircle size={18} />
                Enviar mensaje
              </a>
            </div>
            
            {/* Teléfono */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-card">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-tech-blue/10 text-tech-blue">
                <Phone size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Teléfono</h3>
              <p className="text-muted-foreground mb-6">Llámanos para atención personalizada</p>
              <a href="tel:+529622148546" className="bg-tech-blue hover:bg-tech-blue/90 text-white rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2 py-3 px-6">
                <Phone size={18} />
                Llamar
              </a>
            </div>
            
            {/* Email */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-card">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">Correo Electrónico</h3>
              <p className="text-muted-foreground mb-6">Escríbenos para consultas detalladas</p>
              <a href="mailto:contacto@compuchiapas.com.mx" className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2">
                <Mail size={18} />
                Email
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map & Contact Form */}
      <section id="contact-form" className="py-16 md:py-24 bg-muted">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map */}
            <a 
              href="https://maps.app.goo.gl/jp9mgSQvwcNeHM1U9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass-card rounded-2xl overflow-hidden h-[400px] lg:h-auto block cursor-pointer hover:shadow-xl transition-shadow bg-card"
            >
              {/* Mapa interactivo clickeable */}
              <div className="relative w-full h-full bg-muted pointer-events-none">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3794.5!2d-92.2636!3d14.9047!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x858e87b2c6f9e8ab%3A0x1234567890abcdef!2s6a%20Avenida%20Sur%2C%20Centro%2C%2030700%20Tapachula%20de%20C%C3%B3rdova%20y%20Ord%C3%B3%C3%B1ez%2C%20Chis.!5e0!3m2!1ses!2smx!4v1693443012345!5m2!1ses!2smx" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade" 
                  title="Ubicación de Compusistemas de Chiapas"
                ></iframe>
                <div className="absolute top-0 left-0 w-full h-full bg-black/5 flex items-center justify-center">
                  <div className="bg-card p-4 rounded-lg shadow-lg max-w-xs">
                    <h3 className="font-semibold mb-2 text-card-foreground">Compusistemas de Chiapas</h3>
                    <div className="flex items-start text-muted-foreground mb-2">
                      <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm">6a. Avenida Sur, Centro, 30700 Tapachula de Córdova y Ordóñez, Chis.</p>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock size={16} className="mr-2" />
                      <p className="text-sm">Lun-Sáb: 9am a 7pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </a>
            
            {/* Contact Form */}
            <div className="glass-card rounded-2xl p-8 md:p-12 bg-card">
              <h2 className="text-3xl font-bold mb-6 text-card-foreground">Requieres información o necesitas una cotización, envíanos un mensaje</h2>
              <p className="text-muted-foreground mb-8">
                Completa el formulario y nos pondremos en contacto contigo lo antes posible.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                      Nombre completo
                    </label>
                    <input type="text" id="name" className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu nombre" required value={formData.name} onChange={handleChange} maxLength={100} />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                      Correo electrónico
                    </label>
                    <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu email" required value={formData.email} onChange={handleChange} maxLength={255} />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    Teléfono
                  </label>
                  <input type="tel" id="phone" className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu teléfono" required value={formData.phone} onChange={handleChange} maxLength={20} />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                    Asunto
                  </label>
                  <input type="text" id="subject" className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Asunto de tu mensaje" required value={formData.subject} onChange={handleChange} maxLength={200} />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                    Mensaje
                  </label>
                  <textarea id="message" rows={5} className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Escribe tu mensaje aquí..." required value={formData.message} onChange={handleChange} maxLength={5000}></textarea>
                </div>
                
                <button type="submit" className="w-full bg-tech-blue hover:bg-tech-blue/90 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? 'Espere un momento' : 'Enviar mensaje'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Business Hours */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Horario de atención</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Estamos disponibles para ayudarte en los siguientes horarios
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-8 md:p-12 max-w-4xl mx-auto bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-tech-blue">Días laborables</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Lunes</span>
                    <span className="text-muted-foreground">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Martes</span>
                    <span className="text-muted-foreground">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Miércoles</span>
                    <span className="text-muted-foreground">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Jueves</span>
                    <span className="text-muted-foreground">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Viernes</span>
                    <span className="text-muted-foreground">9:00 AM - 7:00 PM</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6 text-tech-blue">Fin de semana</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Sábado</span>
                    <span className="text-muted-foreground">9:00 AM - 2:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-medium text-card-foreground">Domingo</span>
                    <span className="text-muted-foreground">Cerrado</span>
                  </li>
                </ul>
                
                <div className="mt-8 p-4 bg-tech-blue/10 rounded-lg">
                  <h4 className="font-medium mb-2 text-tech-blue">¿Necesitas seguimiento de algún pedido o servicio?</h4>
                  <div className="flex flex-col sm:flex-row gap-3 mt-3">
                    <Link
                      to="/servicios"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-tech-blue text-white rounded-lg font-medium text-sm hover:bg-tech-blue/90 transition-colors"
                    >
                      <Clock size={16} />
                      Seguimiento de servicio
                    </Link>
                    <Link
                      to="/productos?pedido=true"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-tech-blue text-tech-blue rounded-lg font-medium text-sm hover:bg-tech-blue/10 transition-colors"
                    >
                      <Package size={16} />
                      Buscar mi pedido
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-tech-blue text-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Prefieres una respuesta inmediata?</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            Contáctanos por WhatsApp y recibe atención personalizada en minutos
          </p>
          <a href="https://wa.me/529622148546" target="_blank" rel="noopener noreferrer" className="bg-white text-tech-blue hover:bg-gray-100 py-4 px-10 rounded-lg font-medium text-lg transition-all duration-300 inline-flex items-center justify-center gap-2">
            <MessageCircle size={24} />
            Contáctanos por WhatsApp
          </a>
        </div>
      </section>

      {/* Discount Popup */}
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
    </Layout>;
};
export default Contacto;