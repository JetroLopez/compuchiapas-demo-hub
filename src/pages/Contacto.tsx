
import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight } from 'lucide-react';

const Contacto: React.FC = () => {
  useEffect(() => {
    // Para el SEO
    document.title = "Contacto | Compuchiapas";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para manejar el envío del formulario
    // Por ahora, solo mostraremos un mensaje en la consola
    console.log('Formulario enviado');
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-tech-lightGray to-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contáctanos</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para ayudarte con todas tus necesidades tecnológicas
          </p>
        </div>
      </section>
      
      {/* Contact Info Cards */}
      <section className="py-16 md:py-24">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* WhatsApp */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">WhatsApp</h3>
              <p className="text-gray-600 mb-6">Respuesta inmediata a tus consultas</p>
              <a 
                href="https://wa.me/529612345678" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Contáctanos por WhatsApp
              </a>
            </div>
            
            {/* Teléfono */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-tech-blue/10 text-tech-blue">
                <Phone size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Teléfono</h3>
              <p className="text-gray-600 mb-6">Llámanos para atención personalizada</p>
              <a 
                href="tel:+529612345678" 
                className="bg-tech-blue hover:bg-tech-blue/90 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                +52 (961) 234-5678
              </a>
            </div>
            
            {/* Email */}
            <div className="glass-card rounded-2xl p-8 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Correo Electrónico</h3>
              <p className="text-gray-600 mb-6">Escríbenos para consultas detalladas</p>
              <a 
                href="mailto:contacto@compuchiapas.com" 
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                contacto@compuchiapas.com
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map & Contact Form */}
      <section className="py-16 md:py-24 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map */}
            <div className="glass-card rounded-2xl overflow-hidden h-[400px] lg:h-auto">
              {/* En un proyecto real, aquí iría un mapa interactivo como Google Maps */}
              <div className="relative w-full h-full bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Ubicación de Compuchiapas" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-black/10 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
                    <h3 className="font-semibold mb-2">Compuchiapas</h3>
                    <div className="flex items-start text-gray-700 mb-2">
                      <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm">Av. Central #123, Col. Centro, Tuxtla Gutiérrez, Chiapas, México</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock size={16} className="mr-2" />
                      <p className="text-sm">Lun-Sáb: 9am a 7pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
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
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                      placeholder="Tu email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                    placeholder="Tu teléfono"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                    placeholder="Asunto de tu mensaje"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                    placeholder="Escribe tu mensaje aquí..."
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-tech-blue hover:bg-tech-blue/90 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Enviar mensaje
                  <ArrowRight size={18} />
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
                    <span className="text-gray-600">10:00 AM - 4:00 PM</span>
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
                  <a 
                    href="tel:+529612345678" 
                    className="mt-2 text-tech-blue font-medium hover:underline flex items-center"
                  >
                    <Phone size={16} className="mr-2" />
                    +52 (961) 234-5678
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
          <a 
            href="https://wa.me/529612345678" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-tech-blue hover:bg-gray-100 py-4 px-10 rounded-lg font-medium text-lg transition-all duration-300 inline-flex items-center justify-center gap-2"
          >
            <MessageCircle size={24} />
            Contáctanos por WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Contacto;
