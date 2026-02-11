import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ServiceCard from '../components/ServiceCard';
import { Laptop, Printer, Database, Monitor, Settings, Shield, Clock, Download, Cpu, MessageCircle, Camera, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
const Servicios: React.FC = () => {
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
    document.title = "Servicios Técnicos | Compuchiapas";
  }, []);
  const handleSearchFolio = async () => {
    if (!folio.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const {
        data,
        error
      } = await supabase.from('services').select('clave, fecha_elaboracion, estatus_interno, comentarios').eq('clave', folio.trim()).maybeSingle();
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
        setSearchResult({
          found: false
        });
      }
    } catch (error) {
      console.error('Error searching folio:', error);
      setSearchResult({
        found: false
      });
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
  const services = [{
    title: 'Reparación de Laptops',
    description: 'Solucionamos problemas de hardware y software en todas las marcas con diagnóstico el mismo día.',
    icon: <Laptop size={32} />
  }, {
    title: 'Reparación de Impresoras',
    description: 'Mantenimiento preventivo y correctivo para todos los modelos de impresoras.',
    icon: <Printer size={32} />
  }, {
    title: 'Recuperación de Datos',
    description: 'Recuperamos información de discos duros dañados y dispositivos de almacenamiento.',
    icon: <Database size={32} />
  }, {
    title: 'Ensamble de PCs',
    description: 'Creamos computadoras a medida según tus necesidades y presupuesto.',
    icon: <Monitor size={32} />
  }, {
    title: 'Instalación de Cámaras CCTV',
    description: 'Sistemas de vigilancia y seguridad para hogares y negocios con monitoreo remoto.',
    icon: <Camera size={32} />
  }, {
    title: 'Instalación de Puntos de Venta',
    description: 'Configuración completa de sistemas POS para comercios y restaurantes.',
    icon: <Monitor size={32} />
  }, {
    title: 'Actualización de Componentes',
    description: 'Mejoramos el rendimiento de tu equipo con hardware de última generación.',
    icon: <Settings size={32} />
  }, {
    title: 'Instalación de Programas',
    description: 'Configuración de software especializado y sistemas operativos con licencias originales.',
    icon: <Download size={32} />
  }, {
    title: 'Mantenimiento Preventivo',
    description: 'Limpieza, actualización y optimización para prevenir problemas futuros.',
    icon: <Settings size={32} />
  }, {
    title: 'Seguridad Informática',
    description: 'Protegemos tus equipos contra virus, malware y amenazas digitales.',
    icon: <Shield size={32} />
  }, {
    title: 'Soporte Técnico Express',
    description: 'Asistencia rápida para problemas urgentes en tu hogar o negocio.',
    icon: <Clock size={32} />
  }, {
    title: 'Diagnóstico Especializado',
    description: 'Análisis detallado para identificar problemas complejos en tus equipos.',
    icon: <Cpu size={32} />
  }];
  return <Layout>
      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-28 md:pb-16 bg-gradient-to-b from-tech-lightGray to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container-padding max-w-7xl mx-auto text-center py-0">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 dark:text-white">Servicios Técnicos Profesionales</h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Soluciones confiables para todos tus problemas tecnológicos</p>
          
          {/* Status Lookup Box */}
          <div className="mt-8 max-w-xl mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-tech-blue/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-tech-blue dark:text-blue-400">
                  ¿Tienes en servicio un equipo con nosotros?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Consulta su estado aquí
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Ingresa tu número de folio" value={folio} onChange={e => setFolio(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchFolio()} className="flex-1" />
                  <Button onClick={handleSearchFolio} disabled={isSearching || !folio.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                
                {searchResult && <div className={cn("mt-4 p-4 rounded-lg text-left", searchResult.found ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800")}>
                    {searchResult.found ? <div>
                        <p className="text-green-800 dark:text-green-300">
                          Tu equipo con folio <strong>#{searchResult.clave}</strong> recepcionado el día{' '}
                          <strong>
                            {searchResult.fecha_elaboracion && format(new Date(searchResult.fecha_elaboracion + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", {
                        locale: es
                      })}
                          </strong>{' '}
                          se encuentra en tienda y está <strong>{getStatusMessage(searchResult.estatus_interno || 'En tienda')}</strong>.
                        </p>
                        {searchResult.comentarios && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <strong>Comentarios:</strong> {searchResult.comentarios}
                          </p>}
                      </div> : <p className="text-red-800 dark:text-red-300">
                        No se encontró ningún servicio pendiente con el folio <strong>#{folio}</strong>. 
                        Verifica el número e intenta de nuevo o{' '}
                        <a href="https://wa.me/529622148546?text=Tengo%20dudas%20respecto%20a%20un%20servicio." target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-red-600 dark:hover:text-red-200">
                          comunícate con nosotros
                        </a>.
                      </p>}
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Services Grid */}
      <section className="py-10 mx-0 px-0 my-0 bg-white dark:bg-slate-900 md:py-[30px]">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => <ServiceCard key={index} title={service.title} description={service.description} icon={service.icon} className={cn("animate-fade-up h-full")} style={{
            animationDelay: `${index * 50}ms`
          }} />)}
          </div>
        </div>
      </section>
      
      {/* Process Section */}
      <section className="py-16 md:py-24 bg-tech-lightGray dark:bg-slate-800">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">Nuestro Proceso</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Trabajamos de manera sistemática para ofrecer la mejor solución
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
            number: "01",
            title: "Diagnóstico",
            description: "Evaluamos tu equipo para identificar el problema con precisión."
          }, {
            number: "02",
            title: "Cotización",
            description: "Te presentamos una cotización clara sin costos ocultos."
          }, {
            number: "03",
            title: "Reparación",
            description: "Nuestros técnicos certificados solucionan el problema."
          }, {
            number: "04",
            title: "Garantía",
            description: "Entregamos tu equipo funcionando y con garantía por escrito."
          }].map((step, index) => <div key={index} className="glass-card dark:bg-slate-700/50 dark:border-slate-600 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-tech-blue text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>)}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 md:py-[31px] bg-white dark:bg-slate-900">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">Preguntas Frecuentes</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Respuestas a las consultas más comunes sobre nuestros servicios
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[{
              question: "¿Cuánto tiempo tarda la reparación de una laptop?",
              answer: "La mayoría de las reparaciones de laptops se completan en 24-48 horas. Sin embargo, para casos más complejos o que requieran pedido de piezas, el tiempo puede extenderse. Siempre te mantendremos informado sobre el estado de tu reparación."
            }, {
              question: "¿Ofrecen garantía en sus servicios?",
              answer: "Sí, todos nuestros servicios técnicos cuentan con garantía. Dependiendo del tipo de servicio, la garantía puede variar de 30 días a 1 año. Te proporcionamos un certificado de garantía detallado al entregar tu equipo."
            }, {
              question: "¿Realizan visitas a domicilio?",
              answer: "Ofrecemos servicio de recolección a domicilio y una vez hecha la reparación, entrega de vuelta al domicilio. El costo adicional depende de la ubicación y tipo de servicio. Contáctanos para más detalles y para programar una recolección."
            }, {
              question: "¿Qué pasa si no pueden reparar mi equipo?",
              answer: "Si después del diagnóstico determinamos que el equipo no tiene reparación viable, solo se cobra la tarifa de diagnóstico (que en muchos casos es gratuita). Además, te ofrecemos opciones y asesoría para reemplazar tu equipo si es necesario."
            }, {
              question: "¿Trabajan con todas las marcas de computadoras?",
              answer: "Sí, nuestros técnicos están capacitados para trabajar con todas las marcas principales como HP, Dell, Lenovo, Apple, Asus, Acer, entre otras, tanto en laptops como en computadoras de escritorio."
            }].map((faq, index) => <div key={index} className="glass-card dark:bg-slate-800/50 dark:border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3 text-tech-blue dark:text-blue-400">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </div>)}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-tech-blue text-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para solucionar tus problemas técnicos?</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            Nuestro equipo de expertos está preparado para ayudarte con cualquier necesidad tecnológica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contacto" className="bg-white text-tech-blue hover:bg-gray-100 py-3 px-8 rounded-lg font-medium transition-all duration-300">
              Contáctanos hoy
            </a>
            <a href="https://wa.me/529612345678" target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2">
              <MessageCircle size={20} />
              WhatsApp directo
            </a>
          </div>
        </div>
      </section>
      
      {/* Contact Form Section */}
      <section id="contacto" className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card dark:bg-slate-800/50 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6 dark:text-white">Solicita tu servicio</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Completa el formulario para solicitar una cotización o diagnóstico. 
                  Nos comunicaremos contigo a la brevedad posible.
                </p>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre completo
                      </label>
                      <input type="text" id="name" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu nombre" required />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <input type="tel" id="phone" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Tu teléfono" required />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de servicio
                    </label>
                    <select id="service" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" required>
                      <option value="">Selecciona un servicio</option>
                      <option value="repair">Reparación de equipo</option>
                      <option value="maintenance">Mantenimiento preventivo</option>
                      <option value="recovery">Recuperación de datos</option>
                      <option value="assembly">Ensamble de PC</option>
                      <option value="cctv">Instalación de cámaras CCTV</option>
                      <option value="pos">Instalación de punto de venta</option>
                      <option value="update">Actualización de componentes</option>
                      <option value="software">Instalación de programas</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="device-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de dispositivo
                    </label>
                    <select id="device-type" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" required>
                      <option value="">Selecciona un dispositivo</option>
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Computadora de escritorio</option>
                      <option value="printer">Impresora</option>
                      <option value="server">Servidor</option>
                      <option value="cctv">Cámaras CCTV</option>
                      <option value="pos">Punto de venta</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="issue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Describe el problema
                    </label>
                    <textarea id="issue" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent" placeholder="Detalla el problema que estás experimentando..." required></textarea>
                  </div>
                  
                  <button type="submit" className="w-full btn-primary">
                    Solicitar servicio
                  </button>
                </form>
              </div>
              
              <div className="relative hidden lg:block">
                <img src="https://images.unsplash.com/photo-1562408590-e32931084e23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Servicio técnico" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-tech-blue/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>;
};
export default Servicios;