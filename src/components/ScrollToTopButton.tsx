import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={cn(
        "fixed z-50 shadow-lg transition-all duration-300",
        "bg-primary text-primary-foreground hover:scale-110 active:scale-95",
        // Desktop: bottom center, pill with text
        "md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:rounded-full md:px-6 md:py-3.5",
        // Mobile: bottom left, circular icon only
        "bottom-8 left-5 rounded-full p-3 md:p-0",
        visible ?
        "opacity-100 translate-y-0 pointer-events-auto" :
        "opacity-0 translate-y-4 pointer-events-none"
      )}>

      {/* Desktop: text + icon */}
      <span className="hidden md:inline-flex items-center gap-2 font-semibold text-sm py-[2px]">
        <ArrowUp size={18} />
        Regresar al inicio
      </span>
      {/* Mobile: icon only */}
      <ArrowUp size={24} className="md:hidden" />
    </button>);

};

export default ScrollToTopButton;