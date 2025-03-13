
import React from 'react';
import { Laptop, Printer, Database, Wifi, Monitor } from 'lucide-react';
import ServiceCard from './ServiceCard';

const FeaturedServices: React.FC = () => {
  const services = [
    {
      title: 'Reparación de Laptops',
      description: 'Solucionamos problemas de hardware y software en todas las marcas con diagnóstico gratuito.',
      icon: <Laptop size={32} />
    },
    {
      title: 'Reparación de Impresoras',
      description: 'Mantenimiento preventivo y correctivo para todos los modelos de impresoras.',
      icon: <Printer size={32} />
    },
    {
      title: 'Recuperación de Datos',
      description: 'Recuperamos información de discos duros dañados y dispositivos de almacenamiento.',
      icon: <Database size={32} />
    },
    {
      title: 'Configuración de Redes',
      description: 'Instalación y optimización de redes WiFi para hogares y negocios.',
      icon: <Wifi size={32} />
    },
    {
      title: 'Ensamble de PCs',
      description: 'Creamos computadoras a medida según tus necesidades y presupuesto.',
      icon: <Monitor size={32} />
    }
  ];

  return (
    <section id="servicios-destacados" className="section-padding">
      <div className="container-padding max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Servicios</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos soluciones tecnológicas profesionales para particulares y empresas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a href="/servicios" className="btn-outline">
            Ver todos los servicios
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
