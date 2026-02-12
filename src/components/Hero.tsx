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
      <section className="w-full bg-background pt-20 md:pt-24 pb-4 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="w-full aspect-[16/7] md:aspect-[21/8] rounded-xl md:rounded-2xl bg-muted flex items-center justify-center shadow-lg">
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-2 text-foreground">Compuchiapas</h1>
              <p className="text-lg text-muted-foreground">Expertos en tecnología</p>
            </div>
          </div>
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
    <section className="w-full bg-background pt-20 md:pt-24 pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Carousel container - delimited block with rounded corners */}
        <div className="relative w-full aspect-[16/7] md:aspect-[21/8] overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
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
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 md:p-2.5 transition-colors backdrop-blur-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 md:p-2.5 transition-colors backdrop-blur-sm"
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
                      ? 'bg-white scale-110 shadow-md'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA Buttons - inside the same container */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <a
            href="/servicios"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-tech-blue to-blue-700 py-3 md:py-5 px-4 md:px-6 flex items-center gap-3 text-white transition-shadow hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <div className="relative z-10 flex items-center gap-3 w-full">
              <div className="shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center">
                <Wrench className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm md:text-lg font-bold block leading-tight">Nuestros Servicios</span>
                <span className="text-[10px] md:text-xs text-blue-100/70 hidden md:block">Reparación y soporte técnico</span>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a
            href="/productos"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-tech-orange to-orange-600 py-3 md:py-5 px-4 md:px-6 flex items-center gap-3 text-white transition-shadow hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <div className="relative z-10 flex items-center gap-3 w-full">
              <div className="shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm md:text-lg font-bold block leading-tight">Catálogo de Productos</span>
                <span className="text-[10px] md:text-xs text-orange-100/70 hidden md:block">Equipos y accesorios de calidad</span>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 shrink-0 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
