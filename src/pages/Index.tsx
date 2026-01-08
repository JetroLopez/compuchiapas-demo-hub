
import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import FeaturedServices from '../components/FeaturedServices';
import ProductCategories from '../components/ProductCategories';
import TestimonialCard from '../components/TestimonialCard';
import OfferPopup from '../components/OfferPopup';
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';

const Index: React.FC = () => {
  useEffect(() => {
    // Para el SEO
    document.title = "Compuchiapas | Servicios Técnicos y Venta de Equipo de Cómputo";
  }, []);

  const scrollToContact = () => {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const testimonials = [
    {
      name: "Carlos Martínez",
      testimonial: "Repararon mi laptop en 24 horas cuando otros técnicos me decían que tardaría una semana. El servicio fue excelente y profesional.",
      rating: 5
    },
    {
      name: "María González",
      testimonial: "Me asesoraron perfectamente para elegir una computadora según mis necesidades. El precio fue justo y la instalación impecable.",
      rating: 5
    },
    {
      name: "Roberto Sánchez",
      testimonial: "Llevé mi impresora que otros no pudieron reparar y la dejaron funcionando como nueva. Muy recomendados.",
      rating: 4
    }
  ];

  return (
    <Layout>
      <Hero />
      
      <FeaturedServices />
      
      {/* Special Feature Section */}
      <section className="section-padding">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative h-64 lg:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="PC personalizada" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  ¿Necesitas un equipo personalizado?
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  ¡Ensamblamos tu PC ideal! Ya sea para gaming, diseño gráfico, 
                  arquitectura o uso general, construimos la computadora perfecta 
                  que se adapte a tus necesidades y presupuesto.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="bg-tech-blue/10 px-4 py-2 rounded-full text-tech-blue font-medium">
                    Gaming
                  </div>
                  <div className="bg-tech-blue/10 px-4 py-2 rounded-full text-tech-blue font-medium">
                    Diseño Gráfico
                  </div>
                  <div className="bg-tech-blue/10 px-4 py-2 rounded-full text-tech-blue font-medium">
                    Workstations
                  </div>
                  <div className="bg-tech-blue/10 px-4 py-2 rounded-full text-tech-blue font-medium">
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
      
      {/* Testimonials */}
      <section className="section-padding">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La satisfacción de nuestros clientes es nuestra mejor referencia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                testimonial={testimonial.testimonial}
                rating={testimonial.rating}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <a 
              href="#contacto" 
              className="btn-primary inline-flex items-center"
            >
              Contáctanos hoy <ArrowRight size={18} className="ml-2" />
            </a>
          </div>
        </div>
      </section>
      
      {/* Contact Form */}
      <section id="contacto" className="section-padding bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">Contáctanos</h2>
                <p className="text-gray-600 mb-8">
                  ¿Tienes preguntas o necesitas ayuda? No dudes en contactarnos. 
                  Nuestro equipo de expertos estará encantado de asistirte.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 p-3 rounded-full text-tech-blue mr-4">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Teléfono</h3>
                      <p className="text-gray-600">+52 (962) 214-8546</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 p-3 rounded-full text-tech-blue mr-4">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Email</h3>
                      <p className="text-gray-600">info@compuchiapas.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-tech-blue/10 p-3 rounded-full text-tech-blue mr-4">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Ubicación</h3>
                      <p className="text-gray-600">
                        <a href="https://maps.app.goo.gl/compusistemas-tapachula" target="_blank" rel="noopener noreferrer" className="hover:text-tech-blue">
                          6a. Avenida Sur, Centro, 30700 Tapachula de Córdova y Ordóñez, Chis.
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
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
                  </div>
                  
                  <div>
                    <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de dispositivo
                    </label>
                    <select
                      id="device"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                      required
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
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Describe tu problema
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                      placeholder="Detalla el problema que estás experimentando..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="privacy"
                      className="h-4 w-4 text-tech-blue focus:ring-tech-blue border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                      Acepto la política de privacidad
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full btn-primary"
                  >
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
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
