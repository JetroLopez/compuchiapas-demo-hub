import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Wrench, ShoppingBag } from 'lucide-react';

// Floating geometric shapes for dynamic background
const FloatingShape: React.FC<{
  className?: string;
  delay?: number;
  duration?: number;
}> = ({ className, delay = 0, duration = 20 }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const Hero: React.FC = () => {
  const scrollToServices = () => {
    const servicesSection = document.getElementById('servicios-destacados');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 dark"
      style={{ colorScheme: 'dark' }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 -z-20" />
      
      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30 -z-10"
        style={{
          background: 'radial-gradient(circle at 20% 50%, hsl(210 100% 50% / 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(200 100% 60% / 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 80%, hsl(220 100% 40% / 0.2) 0%, transparent 50%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating geometric shapes */}
      <FloatingShape
        className="absolute top-20 left-[10%] w-32 h-32 border border-blue-500/20 rounded-full"
        delay={0}
        duration={15}
      />
      <FloatingShape
        className="absolute top-40 right-[15%] w-24 h-24 border border-cyan-400/20 rotate-45"
        delay={2}
        duration={18}
      />
      <FloatingShape
        className="absolute bottom-32 left-[20%] w-16 h-16 bg-blue-500/10 rounded-lg"
        delay={1}
        duration={12}
      />
      <FloatingShape
        className="absolute top-1/3 right-[10%] w-40 h-40 border-2 border-blue-400/10 rounded-full"
        delay={3}
        duration={20}
      />
      <FloatingShape
        className="absolute bottom-40 right-[25%] w-20 h-20 border border-cyan-500/15 rotate-12"
        delay={4}
        duration={16}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="container-padding max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center mb-12 md:mb-16">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="block mb-3">Expertos en tecnología</span>
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent pb-2">
              Para tu negocio y hogar
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-blue-100/80 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Servicios técnicos profesionales y equipos de calidad con garantía de satisfacción
          </motion.p>
        </motion.div>
      </div>

      {/* Split Banner CTA */}
      <motion.div
        className="w-full mt-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 w-full">
          {/* Services Banner */}
          <a
            href="/servicios"
            className="group relative overflow-hidden bg-gradient-to-br from-tech-blue to-blue-700 py-12 md:py-16 px-8 flex flex-col items-center justify-center cursor-pointer"
          >
            {/* Hover overlay effect */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Wrench className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 origin-center">
                Nuestros Servicios
              </h3>
              <p className="text-blue-100/80 text-sm md:text-base max-w-xs mx-auto">
                Reparación, mantenimiento y soporte técnico especializado
              </p>
              <span
                className="inline-block mt-4 text-white font-medium group-hover:translate-x-2 transition-transform duration-300"
              >
                Explorar →
              </span>
            </div>
          </a>

          {/* Products Banner */}
          <a
            href="/productos"
            className="group relative overflow-hidden bg-gradient-to-br from-tech-orange to-orange-600 py-12 md:py-16 px-8 flex flex-col items-center justify-center cursor-pointer"
          >
            {/* Hover overlay effect */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
              />
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <ShoppingBag className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 origin-center">
                Catálogo de Productos
              </h3>
              <p className="text-orange-100/80 text-sm md:text-base max-w-xs mx-auto">
                Equipos, componentes y accesorios de las mejores marcas
              </p>
              <span
                className="inline-block mt-4 text-white font-medium group-hover:translate-x-2 transition-transform duration-300"
              >
                Ver productos →
              </span>
            </div>
          </a>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToServices}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden"
        aria-label="Desplazarse hacia abajo"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="h-8 w-8 text-white/60" />
      </motion.button>
    </div>
  );
};

export default Hero;
