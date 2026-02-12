import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Wrench, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const { data: slides = [] } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async (): Promise<HeroSlide[]> => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Fallback when no slides
  if (slides.length === 0) {
    return (
      <section className="relative w-full aspect-[12/5] md:aspect-[12/4] bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Compuchiapas</h1>
          <p className="text-lg text-white/70">Expertos en tecnología</p>
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const SlideContent = ({ slide }: { slide: HeroSlide }) => {
    const inner = (
      <div className="relative w-full h-full">
        <img
          src={slide.image_url}
          alt={slide.title || 'Banner'}
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        
        {/* Text overlay */}
        {(slide.title || slide.subtitle) && (
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 max-w-lg">
            {slide.title && (
              <h2 className="text-xl md:text-4xl font-bold text-white drop-shadow-lg leading-tight">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="text-sm md:text-lg text-white/90 mt-1 md:mt-2 drop-shadow">
                {slide.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    );

    return slide.link_url ? (
      <a href={slide.link_url} className="block w-full h-full">{inner}</a>
    ) : inner;
  };

  return (
    <section className="relative w-full">
      {/* Carousel */}
      <div className="relative w-full aspect-[16/7] md:aspect-[12/4] overflow-hidden bg-slate-900">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <SlideContent slide={currentSlide} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 md:p-2 transition-colors backdrop-blur-sm"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 md:p-2 transition-colors backdrop-blur-sm"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white scale-110'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      {/* Mobile: stacked compact */}
      <div className="flex flex-col w-full md:hidden">
        <a
          href="/servicios"
          className="flex items-center gap-3 bg-gradient-to-r from-tech-blue to-blue-700 py-4 px-6 text-white"
        >
          <Wrench className="w-6 h-6 shrink-0" />
          <span className="text-lg font-bold">Nuestros Servicios</span>
          <span className="ml-auto">→</span>
        </a>
        <a
          href="/productos"
          className="flex items-center gap-3 bg-gradient-to-r from-tech-orange to-orange-600 py-4 px-6 text-white"
        >
          <ShoppingBag className="w-6 h-6 shrink-0" />
          <span className="text-lg font-bold">Catálogo de Productos</span>
          <span className="ml-auto">→</span>
        </a>
      </div>

      {/* Desktop: full banners */}
      <div className="hidden md:grid grid-cols-2 w-full">
        <a
          href="/servicios"
          className="group relative overflow-hidden bg-gradient-to-br from-tech-blue to-blue-700 py-12 px-8 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 text-center">
            <motion.div
              className="mb-3 inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Wrench className="w-7 h-7 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">
              Nuestros Servicios
            </h3>
            <p className="text-blue-100/80 text-sm max-w-xs mx-auto">
              Reparación, mantenimiento y soporte técnico especializado
            </p>
            <span className="inline-block mt-3 text-white font-medium group-hover:translate-x-2 transition-transform duration-300">
              Explorar →
            </span>
          </div>
        </a>

        <a
          href="/productos"
          className="group relative overflow-hidden bg-gradient-to-br from-tech-orange to-orange-600 py-12 px-8 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 text-center">
            <motion.div
              className="mb-3 inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <ShoppingBag className="w-7 h-7 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">
              Catálogo de Productos
            </h3>
            <p className="text-orange-100/80 text-sm max-w-xs mx-auto">
              Equipos, componentes y accesorios de las mejores marcas
            </p>
            <span className="inline-block mt-3 text-white font-medium group-hover:translate-x-2 transition-transform duration-300">
              Ver productos →
            </span>
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
