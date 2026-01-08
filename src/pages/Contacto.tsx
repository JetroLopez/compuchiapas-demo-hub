import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('contact_submissions').insert([{
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message
      }]);
      if (error) {
        throw error;
      }
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo lo antes posible.",
        variant: "default"
      });

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
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-tech-lightGray to-white mx-[35px] my-[72px] py-[9px]">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contáctanos</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para ayudarte con todas tus necesidades tecnológicas
          </p>
        </div>
      </section>
      
      {/* Contact Info Cards */}
      <section className="py-16 px-[6px] mx-[22px] my-[5px] md:py-0">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* WhatsApp */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">WhatsApp</h3>
              <p className="text-gray-600 mb-6">Respuesta inmediata a tus consultas</p>
              <a href="https://wa.me/529622148546" target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2 py-3 px-6">
                <MessageCircle size={18} />
                Enviar mensaje
              </a>
            </div>
            
            {/* Teléfono */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-tech-blue/10 text-tech-blue">
                <Phone size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Teléfono</h3>
              <p className="text-gray-600 mb-6">Llámanos para atención personalizada</p>
              <a href="tel:+529622148546" className="bg-tech-blue hover:bg-tech-blue/90 text-white rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2 py-3 px-6">
                <Phone size={18} />
                Llamar
              </a>
            </div>
            
            {/* Email */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Correo Electrónico</h3>
              <p className="text-gray-600 mb-6">Escríbenos para consultas detalladas</p>
              <a href="mailto:contacto@compuchiapas.com" className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2">
                <Mail size={18} />
                Email
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map & Contact Form */}
      <section id="contact-form" className="py-16 md:py-24 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map */}
            <a 
              href="https://maps.app.goo.gl/jp9mgSQvwcNeHM1U9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass-card rounded-2xl overflow-hidden h-[400px] lg:h-auto block cursor-pointer hover:shadow-xl transition-shadow"
            >
              {/* Mapa interactivo clickeable */}
              <div className="relative w-full h-full bg-gray-200 pointer-events-none">
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
                  <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
                    <h3 className="font-semibold mb-2">Compusistemas de Chiapas</h3>
                    <div className="flex items-start text-gray-700 mb-2">
                      <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm">6a. Avenida Sur, Centro, 30700 Tapachula de Córdova y Ordóñez, Chis.</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock size={16} className="mr-2" />
                      <p className="text-sm">Lun-Sáb: 9am a 7pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </a>
            
            {/* Contact Form */}
            <div className="glass-card rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6">Envíanos un mensaje</h2>
              <p className="text-gray-600 mb-8">
                Completa el formulario y nos pondremos en contacto contigo lo antes posible.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <input type="text" id="name" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu nombre" required value={formData.name} onChange={handleChange} />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu email" required value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input type="tel" id="phone" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu teléfono" required value={formData.phone} onChange={handleChange} />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <input type="text" id="subject" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Asunto de tu mensaje" required value={formData.subject} onChange={handleChange} />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea id="message" rows={5} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Escribe tu mensaje aquí..." required value={formData.message} onChange={handleChange}></textarea>
                </div>
                
                <button type="submit" className="w-full bg-tech-blue hover:bg-tech-blue/90 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Business Hours */}
      <section className="py-16 md:py-24">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Horario de atención</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estamos disponibles para ayudarte en los siguientes horarios
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-tech-blue">Días laborables</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Lunes</span>
                    <span className="text-gray-600">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Martes</span>
                    <span className="text-gray-600">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Miércoles</span>
                    <span className="text-gray-600">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Jueves</span>
                    <span className="text-gray-600">9:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Viernes</span>
                    <span className="text-gray-600">9:00 AM - 7:00 PM</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6 text-tech-blue">Fin de semana</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Sábado</span>
                    <span className="text-gray-600">9:00 AM - 2:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="font-medium">Domingo</span>
                    <span className="text-gray-600">Cerrado</span>
                  </li>
                </ul>
                
                <div className="mt-8 p-4 bg-tech-blue/10 rounded-lg">
                  <h4 className="font-medium mb-2 text-tech-blue">Soporte técnico de emergencia</h4>
                  <p className="text-sm text-gray-600">
                    Para emergencias técnicas fuera de horario, contacta a nuestro equipo de soporte al:
                  </p>
                  <a href="tel:+529624142417" className="mt-2 text-tech-blue font-medium hover:underline flex items-center">
                    <Phone size={16} className="mr-2" />
                    +52 (962) 414-2417
                  </a>
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
    </Layout>;
};
export default Contacto;