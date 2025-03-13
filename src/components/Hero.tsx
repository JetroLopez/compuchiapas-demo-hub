
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

    if (title) title.classList.add('animate-fade-up');
    
    setTimeout(() => {
      if (subtitle) subtitle.classList.add('animate-fade-up');
    }, 200);
    
    setTimeout(() => {
      if (cta) cta.classList.add('animate-fade-up');
    }, 400);
  }, []);

  const scrollToServices = () => {
    const servicesSection = document.getElementById('servicios-destacados');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tech-lightGray to-white -z-10"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
      
      <div className="container-padding max-w-6xl mx-auto text-center">
        <div className="space-y-8">
          <h1 
            ref={titleRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold opacity-0 text-tech-gray"
          >
            <span className="block">Expertos en tecnología</span>
            <span className="text-gradient mt-2 block">Para tu negocio o hogar</span>
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-tech-gray/80 max-w-3xl mx-auto opacity-0"
          >
            Servicios técnicos profesionales y equipos de calidad con garantía de satisfacción
          </p>
          
          <div ref={ctaRef} className="flex flex-col sm:flex-row justify-center gap-4 pt-6 opacity-0">
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
