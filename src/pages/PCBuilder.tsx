import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Cpu, HardDrive, Monitor, Package, Power, 
  CircuitBoard, MemoryStick, Fan, MessageCircle, Sparkles, Zap, Briefcase,
  Gamepad2, Home, X
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComponentProducts, usePCBuilderCompatibility } from '@/hooks/useCompatibility';
import { PCBuild, ProductWithSpec, COMPONENT_LABELS } from '@/lib/compatibility-rules';
import { cn } from '@/lib/utils';
import { calculateSuggestedPrice } from '@/lib/quotation-pricing';

// Usage types for filtering
type UsageType = 'basic' | 'professional' | 'gaming' | null;
type CpuBrand = 'AMD' | 'Intel' | null;

interface FilterState {
  usageType: UsageType;
  cpuBrand: CpuBrand;
  needsGpu: boolean | null;
  compactCase: boolean | null;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const STEPS = [
  { key: 'cpu', label: 'Procesador', icon: Cpu },
  { key: 'motherboard', label: 'Motherboard', icon: CircuitBoard },
  { key: 'ram', label: 'Memoria RAM', icon: MemoryStick },
  { key: 'gpu', label: 'Tarjeta de Video', icon: Monitor },
  { key: 'storage', label: 'Almacenamiento', icon: HardDrive },
  { key: 'psu', label: 'Fuente de Poder', icon: Power },
  { key: 'case', label: 'Gabinete', icon: Package },
  { key: 'cooling', label: 'Enfriamiento', icon: Fan },
] as const;

type StepKey = typeof STEPS[number]['key'];

const PCBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [build, setBuild] = useState<PCBuild>({});
  const [ramQuantity, setRamQuantity] = useState(1);
  const [showQuestion, setShowQuestion] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    usageType: null,
    cpuBrand: null,
    needsGpu: null,
    compactCase: null,
  });
  
  const currentStepData = STEPS[currentStep];
  const { data: products = [], isLoading } = useComponentProducts(currentStepData.key as any);
  const compatibility = usePCBuilderCompatibility(build);

  // Check if CPU has integrated graphics
  const cpuHasIGPU = build.cpu?.spec?.cpu_has_igpu === true;

  // Calculate max RAM quantity based on motherboard slots and RAM modules
  const maxRamQuantity = useMemo(() => {
    const moboSlots = build.motherboard?.spec?.ram_slots || 4;
    const ramModules = build.ram?.spec?.ram_modules || 1;
    const ramStock = build.ram?.existencias || 99;
    return Math.min(Math.floor(moboSlots / ramModules), ramStock);
  }, [build.motherboard, build.ram]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const spec = product.spec;
      const name = product.name.toLowerCase();
      
      // CPU filtering
      if (currentStepData.key === 'cpu') {
        // Brand filter
        if (filters.cpuBrand === 'AMD' && !name.includes('amd') && !name.includes('ryzen')) {
          return false;
        }
        if (filters.cpuBrand === 'Intel' && !name.includes('intel') && !name.includes('core')) {
          return false;
        }
        // Usage filter - gamer products for gaming, non-gamer for basic
        if (filters.usageType === 'gaming' && spec?.is_gamer === false) {
          return false;
        }
        if (filters.usageType === 'basic' && spec?.is_gamer === true) {
          return false;
        }
      }
      
      // GPU filtering based on is_gamer for performance
      if (currentStepData.key === 'gpu' && filters.usageType) {
        if (filters.usageType === 'gaming' && spec?.is_gamer === false) {
          return false;
        }
      }
      
      // Case filtering for compact
      if (currentStepData.key === 'case' && filters.compactCase === true) {
        const formFactors = spec?.case_form_factors || [];
        // Only show mATX and ITX cases
        const hasCompactFactor = formFactors.some((f: string) => 
          f.toLowerCase().includes('matx') || 
          f.toLowerCase().includes('itx') ||
          f.toLowerCase().includes('micro')
        );
        if (!hasCompactFactor && formFactors.length > 0) {
          return false;
        }
      }
      
      return true;
    });
  }, [products, filters, currentStepData.key]);

  // Determine if current step should show a question
  const currentQuestion = useMemo((): Question | null => {
    if (!showQuestion) return null;
    
    switch (currentStepData.key) {
      case 'cpu':
        if (filters.usageType === null) {
          return {
            id: 'usage',
            title: '¿Para qué usarás tu PC?',
            subtitle: 'Esto nos ayudará a recomendarte los mejores componentes',
            options: [
              {
                value: 'basic',
                label: 'Uso Básico',
                description: 'Escolar, administrativo, hogar',
                icon: <Home className="w-8 h-8" />,
              },
              {
                value: 'professional',
                label: 'Profesional',
                description: 'Trabajo demandante, servidor',
                icon: <Briefcase className="w-8 h-8" />,
              },
              {
                value: 'gaming',
                label: 'Gaming',
                description: 'Juegos y alto rendimiento',
                icon: <Gamepad2 className="w-8 h-8" />,
              },
            ],
          };
        }
        if (filters.cpuBrand === null) {
          return {
            id: 'brand',
            title: 'Elige tu procesador',
            subtitle: '¿Prefieres AMD o Intel?',
            options: [
              {
                value: 'AMD',
                label: 'AMD',
                description: 'Ryzen - Excelente rendimiento multicore',
                icon: <Zap className="w-8 h-8" />,
              },
              {
                value: 'Intel',
                label: 'Intel',
                description: 'Core - Gran rendimiento single-core',
                icon: <Cpu className="w-8 h-8" />,
              },
            ],
          };
        }
        break;
        
      case 'gpu':
        // Only show question if CPU has integrated graphics and user hasn't answered
        if (cpuHasIGPU && filters.needsGpu === null) {
          return {
            id: 'gpu_needed',
            title: '¿Requieres una tarjeta de video dedicada?',
            subtitle: 'Tu procesador tiene gráficos integrados',
            options: [
              {
                value: 'yes',
                label: 'Sí, necesito más potencia',
                description: 'Para gaming, diseño o trabajo con video',
                icon: <Sparkles className="w-8 h-8" />,
              },
              {
                value: 'no',
                label: 'No, los gráficos integrados son suficientes',
                description: 'Para uso básico y oficina',
                icon: <Monitor className="w-8 h-8" />,
              },
            ],
          };
        }
        break;
        
      case 'case':
        if (filters.compactCase === null) {
          return {
            id: 'compact',
            title: '¿Tienes poco espacio?',
            subtitle: '¿Buscas un gabinete compacto?',
            options: [
              {
                value: 'yes',
                label: 'Sí, necesito algo compacto',
                description: 'Gabinetes Micro ATX e ITX',
                icon: <Package className="w-8 h-8" />,
              },
              {
                value: 'no',
                label: 'No, el tamaño no importa',
                description: 'Todas las opciones disponibles',
                icon: <Package className="w-8 h-8" />,
              },
            ],
          };
        }
        break;
    }
    
    return null;
  }, [currentStepData.key, filters, showQuestion, cpuHasIGPU]);

  const handleQuestionAnswer = (questionId: string, value: string) => {
    switch (questionId) {
      case 'usage':
        setFilters(prev => ({ ...prev, usageType: value as UsageType }));
        break;
      case 'brand':
        setFilters(prev => ({ ...prev, cpuBrand: value as CpuBrand }));
        setShowQuestion(false);
        break;
      case 'gpu_needed':
        if (value === 'no') {
          // Skip GPU step entirely
          setFilters(prev => ({ ...prev, needsGpu: false }));
          handleNext();
        } else {
          setFilters(prev => ({ ...prev, needsGpu: true }));
          setShowQuestion(false);
        }
        break;
      case 'compact':
        setFilters(prev => ({ ...prev, compactCase: value === 'yes' }));
        setShowQuestion(false);
        break;
    }
  };

  const handleSelectComponent = (product: ProductWithSpec) => {
    const stepKey = currentStepData.key as keyof PCBuild;
    setBuild(prev => ({ ...prev, [stepKey]: product }));
    
    if (stepKey === 'ram') {
      setRamQuantity(1);
    }
  };

  const handleClearComponent = () => {
    const stepKey = currentStepData.key as keyof PCBuild;
    setBuild(prev => ({ ...prev, [stepKey]: null }));
    if (stepKey === 'ram') {
      setRamQuantity(1);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      let nextStep = currentStep + 1;
      
      // Skip GPU if not needed
      if (STEPS[nextStep].key === 'gpu' && cpuHasIGPU && filters.needsGpu === false) {
        nextStep++;
      }
      
      setCurrentStep(nextStep);
      setShowQuestion(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      
      // Skip GPU going back if it was skipped
      if (STEPS[prevStep].key === 'gpu' && cpuHasIGPU && filters.needsGpu === false) {
        prevStep--;
      }
      
      setCurrentStep(prevStep);
      setShowQuestion(true);
    }
  };

  const handleGoToStep = (index: number) => {
    // Don't allow going to GPU step if it should be skipped
    if (STEPS[index].key === 'gpu' && cpuHasIGPU && filters.needsGpu === false) {
      return;
    }
    setCurrentStep(index);
    setShowQuestion(true);
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    Object.entries(build).forEach(([key, product]) => {
      if (product?.costo) {
        const qty = key === 'ram' ? ramQuantity : 1;
        const price = calculateSuggestedPrice(product.costo, product.clave || '');
        total += price * qty;
      }
    });
    return total;
  }, [build, ramQuantity]);

  const selectedCount = Object.values(build).filter(Boolean).length;
  const currentSelection = build[currentStepData.key as keyof PCBuild];

  const generateWhatsAppMessage = () => {
    let message = "¡Hola! Me interesa cotizar esta PC:\n\n";
    
    STEPS.forEach(step => {
      const component = build[step.key as keyof PCBuild];
      if (component) {
        const qty = step.key === 'ram' ? ramQuantity : 1;
        message += `• ${step.label}: ${component.name}${qty > 1 ? ` (x${qty})` : ''}\n`;
      }
    });

    message += `\n💰 Total estimado: $${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    message += "\n\n¿Me pueden dar más información?";
    
    return encodeURIComponent(message);
  };

  const shouldSkipGPU = cpuHasIGPU && filters.needsGpu === false;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b"
        >
          <div className="container-padding max-w-7xl mx-auto py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/productos')}
                className="gap-2"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              
              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-bold">Arma tu PC</h1>
                <p className="text-xs text-muted-foreground">
                  {filters.usageType 
                    ? `${filters.usageType === 'basic' ? '🏠 Básico' : filters.usageType === 'professional' ? '💼 Profesional' : '🎮 Gaming'}`
                    : 'Paso ' + (currentStep + 1) + ' de ' + STEPS.length
                  }
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="text-lg font-bold text-primary">
                  ${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="container-padding max-w-7xl mx-auto py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Step Indicator - Mobile */}
              <div className="lg:hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isSelected = !!build[step.key as keyof PCBuild];
                    const isCurrent = index === currentStep;
                    const isSkipped = step.key === 'gpu' && shouldSkipGPU;
                    
                    if (isSkipped) return null;
                    
                    return (
                      <button
                        key={step.key}
                        onClick={() => handleGoToStep(index)}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all",
                          isCurrent 
                            ? "bg-primary text-primary-foreground" 
                            : isSelected 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon size={16} />
                        {isCurrent && <span>{step.label}</span>}
                        {isSelected && !isCurrent && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Step Card */}
              <motion.div
                key={currentStepData.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-2xl border shadow-lg overflow-hidden relative"
              >
                <div className="p-6 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <currentStepData.icon size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{currentStepData.label}</h2>
                        <p className="text-sm text-muted-foreground">
                          {currentStepData.key === 'cooling' ? 'Opcional' : 'Selecciona un componente'}
                        </p>
                      </div>
                    </div>
                    
                    {currentSelection && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleClearComponent}
                      >
                        Cambiar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Question Overlay */}
                <AnimatePresence>
                  {currentQuestion && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-lg text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: 'spring' }}
                          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
                        >
                          <Sparkles className="w-8 h-8 text-primary" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold mb-2">{currentQuestion.title}</h3>
                        {currentQuestion.subtitle && (
                          <p className="text-muted-foreground mb-8">{currentQuestion.subtitle}</p>
                        )}
                        
                        <div className={cn(
                          "grid gap-4",
                          currentQuestion.options.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
                        )}>
                          {currentQuestion.options.map((option, index) => (
                            <motion.button
                              key={option.value}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + index * 0.1 }}
                              onClick={() => handleQuestionAnswer(currentQuestion.id, option.value)}
                              className="group p-6 rounded-2xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all text-center"
                            >
                              <div className="mb-4 mx-auto w-16 h-16 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                {option.icon}
                              </div>
                              <p className="font-semibold mb-1">{option.label}</p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </motion.button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setShowQuestion(false)}
                          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Omitir y ver todos los productos
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Product Grid */}
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  <div className="p-4">
                    {isLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <currentStepData.icon size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay productos disponibles con los filtros seleccionados</p>
                        <Button
                          variant="link"
                          onClick={() => setShowQuestion(true)}
                          className="mt-2"
                        >
                          Cambiar filtros
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {filteredProducts.map((product, index) => {
                            const isSelected = currentSelection?.id === product.id;
                            const price = product.costo ? calculateSuggestedPrice(product.costo, product.clave || '') : 0;
                            const isGamer = product.spec?.is_gamer;
                            
                            return (
                              <motion.button
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => handleSelectComponent(product)}
                                className={cn(
                                  "relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-md",
                                  isSelected 
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                                  >
                                    <Check size={14} className="text-primary-foreground" />
                                  </motion.div>
                                )}
                                
                                {isGamer && (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium">
                                    🎮 Gamer
                                  </div>
                                )}
                                
                                <div className="flex gap-3 mt-4">
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.name}
                                      className="w-16 h-16 object-contain rounded-lg bg-white"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                      <currentStepData.icon size={24} className="text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Stock: {product.existencias || 0}
                                    </p>
                                    <p className="text-primary font-bold">
                                      ${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* RAM Quantity Selector */}
                {currentStepData.key === 'ram' && currentSelection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border-t bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Cantidad de kits</p>
                        <p className="text-xs text-muted-foreground">
                          Máximo {maxRamQuantity} (basado en slots del motherboard)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRamQuantity(prev => Math.max(1, prev - 1))}
                          disabled={ramQuantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-bold">{ramQuantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRamQuantity(prev => Math.min(maxRamQuantity, prev + 1))}
                          disabled={ramQuantity >= maxRamQuantity}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft size={16} />
                    Anterior
                  </Button>
                  
                  {currentStep === STEPS.length - 1 ? (
                    <a
                      href={`https://wa.me/529622148546?text=${generateWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all",
                        selectedCount >= 5
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      onClick={e => selectedCount < 5 && e.preventDefault()}
                    >
                      <MessageCircle size={18} />
                      Cotizar por WhatsApp
                    </a>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="gap-2"
                    >
                      Siguiente
                      <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Compatibility Warnings */}
              {(compatibility.errors.length > 0 || compatibility.warnings.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {compatibility.errors.map((error, i) => (
                    <div key={i} className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                      ⚠️ {error}
                    </div>
                  ))}
                  {compatibility.warnings.map((warning, i) => (
                    <div key={i} className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                      ℹ️ {warning}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sidebar Summary - Desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-36">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border shadow-lg overflow-hidden"
                >
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-bold">Tu Configuración</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedCount} de {STEPS.length - (shouldSkipGPU ? 1 : 0)} componentes
                    </p>
                  </div>

                  <div className="p-2">
                    {STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const component = build[step.key as keyof PCBuild];
                      const isCurrent = index === currentStep;
                      const isSkipped = step.key === 'gpu' && shouldSkipGPU;
                      const qty = step.key === 'ram' && component ? ramQuantity : 1;
                      const price = component?.costo 
                        ? calculateSuggestedPrice(component.costo, component.clave || '') * qty 
                        : 0;
                      
                      if (isSkipped) return null;
                      
                      return (
                        <motion.button
                          key={step.key}
                          onClick={() => handleGoToStep(index)}
                          whileHover={{ x: 4 }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            isCurrent && "bg-primary/10",
                            !isCurrent && "hover:bg-muted"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg transition-all",
                            component 
                              ? "bg-primary/20 text-primary" 
                              : isCurrent 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground"
                          )}>
                            <Icon size={18} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-medium",
                              isCurrent && "text-primary"
                            )}>
                              {step.label}
                            </p>
                            {component ? (
                              <p className="text-xs text-muted-foreground truncate">
                                {component.name}
                                {qty > 1 && ` (x${qty})`}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground/50">
                                {step.key === 'cooling' ? 'Opcional' : 'Sin seleccionar'}
                              </p>
                            )}
                          </div>
                          
                          {component && (
                            <div className="text-right">
                              <Check size={14} className="text-primary ml-auto mb-1" />
                              <p className="text-xs font-medium text-primary">
                                ${price.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                              </p>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="p-4 border-t bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Total estimado</span>
                      <span className="text-2xl font-bold text-primary">
                        ${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <a
                      href={`https://wa.me/529622148546?text=${generateWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                        selectedCount >= 5
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      onClick={e => selectedCount < 5 && e.preventDefault()}
                    >
                      <MessageCircle size={18} />
                      Cotizar por WhatsApp
                    </a>
                    
                    {selectedCount < 5 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Selecciona al menos 5 componentes
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Summary */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-2xl p-4 safe-area-pb"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{selectedCount} componentes</p>
              <p className="text-xl font-bold text-primary">
                ${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <a
              href={`https://wa.me/529622148546?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                selectedCount >= 5
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={e => selectedCount < 5 && e.preventDefault()}
            >
              <MessageCircle size={18} />
              <span>Cotizar</span>
            </a>
          </div>
        </motion.div>

        {/* Spacer for mobile bottom bar */}
        <div className="lg:hidden h-24" />
      </div>
    </Layout>
  );
};

export default PCBuilder;
