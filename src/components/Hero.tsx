
import React, { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cta = ctaRef.current;

    // Pre-show the elements to prevent flash
    if (title) {
      title.style.opacity = '1';
      title.classList.add('animate-fade-up');
    }
    
    setTimeout(() => {
      if (subtitle) {
        subtitle.style.opacity = '1';
        subtitle.classList.add('animate-fade-up');
      }
    }, 200);
    
    setTimeout(() => {
      if (cta) {
        cta.style.opacity = '1';
        cta.classList.add('animate-fade-up');
      }
    }, 400);
  }, []);

  const scrollToServices = () => {
    const servicesSection = document.getElementById('servicios-destacados');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tech-lightGray to-white -z-10"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
      
      <div className="container-padding max-w-6xl mx-auto text-center">
        <div className="space-y-12 mt-24">
          <h1 
            ref={titleRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-tech-gray opacity-100"
          >
            <span className="block mb-2">Expertos en tecnología</span>
            <span className="text-gradient block">Para tu negocio y hogar</span>
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-tech-gray/80 max-w-3xl mx-auto mt-6 opacity-100"
          >
            Servicios técnicos profesionales y equipos de calidad con garantía de satisfacción
          </p>
          
          <div ref={ctaRef} className="flex flex-col sm:flex-row justify-center gap-4 pt-6 opacity-100">
            <a href="/servicios" className="btn-primary">
              Ver servicios
            </a>
            <a href="/productos" className="btn-outline">
              Explorar productos
            </a>
          </div>
        </div>
        
        <button 
          onClick={scrollToServices}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
          aria-label="Desplazarse hacia abajo"
        >
          <ArrowDown className="h-10 w-10 text-tech-blue" />
        </button>
      </div>
    </div>
  );
};

export default Hero;
