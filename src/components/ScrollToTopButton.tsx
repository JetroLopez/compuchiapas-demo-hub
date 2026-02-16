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
        "fixed z-50 p-3 rounded-full shadow-lg transition-all duration-300",
        "bg-primary text-primary-foreground hover:scale-110 active:scale-95",
        // Desktop: bottom-right corner offset from WhatsApp
        "md:bottom-8 md:right-20",
        // Mobile: bubble style, positioned left of WhatsApp button area
        "bottom-8 right-[4.5rem]",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp size={24} />
    </button>
  );
};

export default ScrollToTopButton;
