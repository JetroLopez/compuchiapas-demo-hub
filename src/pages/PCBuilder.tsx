import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Cpu, HardDrive, Monitor, Package, Power, 
  CircuitBoard, MemoryStick, Fan, MessageCircle, Sparkles, Zap, Briefcase,
  Gamepad2, Home, Plus, Minus, X, ShoppingCart
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComponentProducts } from '@/hooks/useCompatibility';
import { PCBuild, ProductWithSpec, COMPONENT_LABELS, COMPONENT_CATEGORIES } from '@/lib/compatibility-rules';
import { cn } from '@/lib/utils';
import { calculateSuggestedPrice } from '@/lib/quotation-pricing';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Step definitions
type BuildStep = 
  | 'usage' 
  | 'cpu_brand' 
  | 'cpu' 
  | 'motherboard' 
  | 'ram' 
  | 'storage' 
  | 'case_question'
  | 'case' 
  | 'gpu' 
  | 'psu' 
  | 'cooling_question'
  | 'cooling_type'
  | 'cooling' 
  | 'summary';

type UsageType = 'basic' | 'professional' | 'gaming';
type CpuBrand = 'AMD' | 'Intel';
type CoolingType = 'air' | 'liquid';

interface BuildFilters {
  usageType: UsageType | null;
  cpuBrand: CpuBrand | null;
  wantsCompactCase: boolean | null;
  needsCooling: boolean | null;
  coolingType: CoolingType | null;
}

interface StorageSelection {
  product: ProductWithSpec;
  quantity: number;
}

// Hook to fetch all PC components with specs
function useAllPCComponents() {
  return useQuery({
    queryKey: ['all-pc-components'],
    queryFn: async () => {
      const allCategoryIds = Object.values(COMPONENT_CATEGORIES).flat();
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, clave, category_id, existencias, image_url, costo')
        .in('category_id', allCategoryIds)
        .eq('is_active', true)
        .gt('existencias', 0)
        .order('name');

      if (productsError) throw productsError;
      if (!products || products.length === 0) return { products: [], specsMap: new Map() };

      const productIds = products.map(p => p.id);
      const { data: specs, error: specsError } = await supabase
        .from('component_specs')
        .select('*')
        .in('product_id', productIds);

      if (specsError) throw specsError;

      const specsMap = new Map(specs?.map(s => [s.product_id, s]) || []);
      
      const productsWithSpecs = products.map(product => ({
        ...product,
        spec: specsMap.get(product.id) || null,
      })) as ProductWithSpec[];

      return { products: productsWithSpecs, specsMap };
    },
    staleTime: 5 * 60 * 1000,
  });
}

const PCBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<BuildStep>('usage');
  const [filters, setFilters] = useState<BuildFilters>({
    usageType: null,
    cpuBrand: null,
    wantsCompactCase: null,
    needsCooling: null,
    coolingType: null,
  });
  
  // Selected components
  const [selectedCpu, setSelectedCpu] = useState<ProductWithSpec | null>(null);
  const [selectedMotherboard, setSelectedMotherboard] = useState<ProductWithSpec | null>(null);
  const [selectedRam, setSelectedRam] = useState<ProductWithSpec | null>(null);
  const [ramQuantity, setRamQuantity] = useState(1);
  const [storageSelections, setStorageSelections] = useState<StorageSelection[]>([]);
  const [selectedCase, setSelectedCase] = useState<ProductWithSpec | null>(null);
  const [selectedGpu, setSelectedGpu] = useState<ProductWithSpec | null>(null);
  const [selectedPsu, setSelectedPsu] = useState<ProductWithSpec | null>(null);
  const [selectedCooling, setSelectedCooling] = useState<ProductWithSpec | null>(null);

  const { data: componentsData, isLoading } = useAllPCComponents();
  const allProducts = componentsData?.products || [];

  // Get products by category
  const getProductsByCategory = (categoryKey: string) => {
    const categoryIds = COMPONENT_CATEGORIES[categoryKey] || [];
    return allProducts.filter(p => p.category_id && categoryIds.includes(p.category_id));
  };

  // Filter CPUs based on brand and usage
  const filteredCpus = useMemo(() => {
    return getProductsByCategory('cpu').filter(p => {
      if (!p.spec) return false;
      const socket = p.spec.socket?.toUpperCase() || '';
      
      // Brand filter
      if (filters.cpuBrand === 'AMD') {
        if (!socket.includes('AM4') && !socket.includes('AM5')) return false;
      }
      if (filters.cpuBrand === 'Intel') {
        if (!socket.includes('1200') && !socket.includes('1700')) return false;
      }
      
      // Usage filter
      if (filters.usageType === 'gaming' && p.spec.is_gamer === false) return false;
      if (filters.usageType === 'basic' && p.spec.is_gamer === true) return false;
      
      return true;
    });
  }, [allProducts, filters.cpuBrand, filters.usageType]);

  // Filter motherboards by CPU socket
  const filteredMotherboards = useMemo(() => {
    if (!selectedCpu?.spec?.socket) return [];
    return getProductsByCategory('motherboard').filter(p => {
      if (!p.spec) return false;
      return p.spec.socket === selectedCpu.spec?.socket;
    });
  }, [allProducts, selectedCpu]);

  // Filter RAM by motherboard RAM type and speed
  const filteredRam = useMemo(() => {
    if (!selectedMotherboard?.spec?.ram_type) return [];
    return getProductsByCategory('ram').filter(p => {
      if (!p.spec) return false;
      if (p.spec.ram_type !== selectedMotherboard.spec?.ram_type) return false;
      // Speed within range
      if (p.spec.ram_speed && selectedMotherboard.spec?.max_ram_speed) {
        if (p.spec.ram_speed > selectedMotherboard.spec.max_ram_speed) return false;
      }
      return true;
    });
  }, [allProducts, selectedMotherboard]);

  // Calculate max RAM quantity
  const maxRamQuantity = useMemo(() => {
    if (!selectedMotherboard || !selectedRam) return 1;
    const moboSlots = selectedMotherboard.spec?.ram_slots || 4;
    const ramModules = selectedRam.spec?.ram_modules || 1;
    const ramStock = selectedRam.existencias || 99;
    return Math.min(Math.floor(moboSlots / ramModules), ramStock);
  }, [selectedMotherboard, selectedRam]);

  // Filter storage - SATA max 4, NVMe by M.2 slots and size
  const filteredStorage = useMemo(() => {
    const m2Slots = selectedMotherboard?.spec?.m2_slots || 0;
    const maxM2Size = selectedMotherboard?.spec?.storage_m2_size || '22110';
    
    // Parse M.2 size to compare
    const parseM2Size = (size: string) => parseInt(size) || 0;
    const maxM2SizeNum = parseM2Size(maxM2Size);
    
    return getProductsByCategory('storage').filter(p => {
      if (!p.spec) return false;
      
      // NVMe needs M.2 slots and size check
      if (p.spec.storage_interface === 'M2' && p.spec.storage_subtype === 'NVMe') {
        if (m2Slots <= 0) return false;
        const diskSize = parseM2Size(p.spec.storage_m2_size || '2280');
        if (diskSize > maxM2SizeNum) return false;
      }
      
      return true;
    });
  }, [allProducts, selectedMotherboard]);

  // Calculate storage limits
  const getStorageLimits = () => {
    const m2Slots = selectedMotherboard?.spec?.m2_slots || 0;
    const usedM2 = storageSelections.filter(s => 
      s.product.spec?.storage_interface === 'M2' && s.product.spec?.storage_subtype === 'NVMe'
    ).reduce((sum, s) => sum + s.quantity, 0);
    const usedSata = storageSelections.filter(s => 
      s.product.spec?.storage_interface === 'SATA'
    ).reduce((sum, s) => sum + s.quantity, 0);
    
    return {
      m2Available: m2Slots - usedM2,
      sataAvailable: 4 - usedSata,
    };
  };

  // Filter cases by compact option and motherboard form factor
  const filteredCases = useMemo(() => {
    return getProductsByCategory('case').filter(p => {
      if (!p.spec) return false;
      
      // Compact filter
      if (filters.wantsCompactCase === true && p.spec.case_is_compact !== true) return false;
      
      // Form factor compatibility
      if (selectedMotherboard?.spec?.form_factor && p.spec.case_form_factors) {
        if (!p.spec.case_form_factors.includes(selectedMotherboard.spec.form_factor)) return false;
      }
      
      return true;
    });
  }, [allProducts, filters.wantsCompactCase, selectedMotherboard]);

  // Filter GPUs by case max length
  const filteredGpus = useMemo(() => {
    return getProductsByCategory('gpu').filter(p => {
      if (!p.spec) return false;
      
      // GPU length check against case
      if (selectedCase?.spec?.case_max_gpu_length && p.spec.gpu_length) {
        if (p.spec.gpu_length > selectedCase.spec.case_max_gpu_length) return false;
      }
      
      return true;
    });
  }, [allProducts, selectedCase]);

  // Check if case includes PSU
  const caseIncludesPsu = selectedCase?.spec?.case_includes_500w_psu === true;

  // Filter PSUs by form factor and wattage requirement
  const filteredPsus = useMemo(() => {
    const cpuTdp = selectedCpu?.spec?.cpu_tdp || 0;
    const gpuTdp = selectedGpu?.spec?.gpu_tdp || 0;
    const minWattage = cpuTdp + gpuTdp + 100; // Base system consumption
    
    return getProductsByCategory('psu').filter(p => {
      if (!p.spec) return false;
      
      // Wattage check
      if (p.spec.psu_wattage && p.spec.psu_wattage < minWattage) return false;
      
      // Form factor check (if case has PSU position info)
      // For now, show all that meet wattage
      return true;
    });
  }, [allProducts, selectedCpu, selectedGpu]);

  // Filter cooling by type (air/liquid) and case compatibility
  const filteredCooling = useMemo(() => {
    return getProductsByCategory('cooling').filter(p => {
      if (!p.spec) return false;
      
      // Type filter
      if (filters.coolingType === 'air' && p.spec.cooling_type !== 'Aire') return false;
      if (filters.coolingType === 'liquid') {
        if (p.spec.cooling_type !== 'Líquido') return false;
        // Check if case supports liquid cooling
        if (selectedCase?.spec?.case_supports_liquid_cooling === false) return false;
      }
      
      return true;
    });
  }, [allProducts, filters.coolingType, selectedCase]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    
    if (selectedCpu?.costo) {
      total += calculateSuggestedPrice(selectedCpu.costo, selectedCpu.clave || '');
    }
    if (selectedMotherboard?.costo) {
      total += calculateSuggestedPrice(selectedMotherboard.costo, selectedMotherboard.clave || '');
    }
    if (selectedRam?.costo) {
      total += calculateSuggestedPrice(selectedRam.costo, selectedRam.clave || '') * ramQuantity;
    }
    storageSelections.forEach(s => {
      if (s.product.costo) {
        total += calculateSuggestedPrice(s.product.costo, s.product.clave || '') * s.quantity;
      }
    });
    if (selectedCase?.costo) {
      total += calculateSuggestedPrice(selectedCase.costo, selectedCase.clave || '');
    }
    if (selectedGpu?.costo) {
      total += calculateSuggestedPrice(selectedGpu.costo, selectedGpu.clave || '');
    }
    if (selectedPsu?.costo && !caseIncludesPsu) {
      total += calculateSuggestedPrice(selectedPsu.costo, selectedPsu.clave || '');
    }
    if (selectedCooling?.costo) {
      total += calculateSuggestedPrice(selectedCooling.costo, selectedCooling.clave || '');
    }
    
    return total;
  }, [selectedCpu, selectedMotherboard, selectedRam, ramQuantity, storageSelections, selectedCase, selectedGpu, selectedPsu, selectedCooling, caseIncludesPsu]);

  // Count selected components
  const selectedCount = useMemo(() => {
    let count = 0;
    if (selectedCpu) count++;
    if (selectedMotherboard) count++;
    if (selectedRam) count++;
    if (storageSelections.length > 0) count++;
    if (selectedCase) count++;
    if (selectedGpu) count++;
    if (selectedPsu || caseIncludesPsu) count++;
    if (selectedCooling) count++;
    return count;
  }, [selectedCpu, selectedMotherboard, selectedRam, storageSelections, selectedCase, selectedGpu, selectedPsu, selectedCooling, caseIncludesPsu]);

  // Navigation handlers
  const goToStep = (step: BuildStep) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    const stepOrder: BuildStep[] = [
      'usage', 'cpu_brand', 'cpu', 'motherboard', 'ram', 'storage', 
      'case_question', 'case', 'gpu', 'psu', 'cooling_question', 'cooling_type', 'cooling', 'summary'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    let nextIndex = currentIndex + 1;
    
    // Skip PSU if case includes it
    if (stepOrder[nextIndex] === 'psu' && caseIncludesPsu) {
      nextIndex++;
    }
    
    // Skip cooling_type if not needing cooling
    if (stepOrder[nextIndex] === 'cooling_type' && filters.needsCooling === false) {
      nextIndex = stepOrder.indexOf('summary');
    }
    if (stepOrder[nextIndex] === 'cooling' && filters.needsCooling === false) {
      nextIndex = stepOrder.indexOf('summary');
    }
    
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const handlePrev = () => {
    const stepOrder: BuildStep[] = [
      'usage', 'cpu_brand', 'cpu', 'motherboard', 'ram', 'storage', 
      'case_question', 'case', 'gpu', 'psu', 'cooling_question', 'cooling_type', 'cooling', 'summary'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    let prevIndex = currentIndex - 1;
    
    // Skip PSU if case includes it
    if (stepOrder[prevIndex] === 'psu' && caseIncludesPsu) {
      prevIndex--;
    }
    
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    let message = "¡Hola! Me interesa cotizar esta PC:\n\n";
    
    if (selectedCpu) message += `• Procesador: ${selectedCpu.name}\n`;
    if (selectedMotherboard) message += `• Motherboard: ${selectedMotherboard.name}\n`;
    if (selectedRam) message += `• RAM: ${selectedRam.name}${ramQuantity > 1 ? ` (x${ramQuantity})` : ''}\n`;
    storageSelections.forEach(s => {
      message += `• Almacenamiento: ${s.product.name}${s.quantity > 1 ? ` (x${s.quantity})` : ''}\n`;
    });
    if (selectedCase) message += `• Gabinete: ${selectedCase.name}\n`;
    if (selectedGpu) message += `• Tarjeta de Video: ${selectedGpu.name}\n`;
    if (caseIncludesPsu) {
      message += `• Fuente: Incluida en gabinete (500W)\n`;
    } else if (selectedPsu) {
      message += `• Fuente: ${selectedPsu.name}\n`;
    }
    if (selectedCooling) message += `• Enfriamiento: ${selectedCooling.name}\n`;

    message += `\n💰 Total estimado: $${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    message += "\n\n¿Me pueden dar más información?";
    
    return encodeURIComponent(message);
  };

  // Add storage selection
  const addStorage = (product: ProductWithSpec) => {
    const existing = storageSelections.find(s => s.product.id === product.id);
    const limits = getStorageLimits();
    const isNvme = product.spec?.storage_interface === 'M2' && product.spec?.storage_subtype === 'NVMe';
    const isSata = product.spec?.storage_interface === 'SATA';
    
    if (existing) {
      const maxQty = isNvme ? limits.m2Available + existing.quantity : 
                     isSata ? limits.sataAvailable + existing.quantity : 
                     Math.min(product.existencias || 1, 4);
      if (existing.quantity < maxQty) {
        setStorageSelections(prev => prev.map(s => 
          s.product.id === product.id ? { ...s, quantity: s.quantity + 1 } : s
        ));
      }
    } else {
      const canAdd = isNvme ? limits.m2Available > 0 : isSata ? limits.sataAvailable > 0 : true;
      if (canAdd) {
        setStorageSelections(prev => [...prev, { product, quantity: 1 }]);
      }
    }
  };

  const removeStorage = (productId: string) => {
    setStorageSelections(prev => {
      const existing = prev.find(s => s.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(s => s.product.id === productId ? { ...s, quantity: s.quantity - 1 } : s);
      }
      return prev.filter(s => s.product.id !== productId);
    });
  };

  // Render question step
  const renderQuestionStep = (
    title: string,
    subtitle: string,
    options: { value: string; label: string; description: string; icon: React.ReactNode }[],
    onSelect: (value: string) => void
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>
      
      <h3 className="text-2xl font-bold mb-2 text-center">{title}</h3>
      <p className="text-muted-foreground mb-8 text-center">{subtitle}</p>
      
      <div className={cn(
        "grid gap-4 w-full max-w-2xl",
        options.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
      )}>
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            onClick={() => onSelect(option.value)}
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
    </motion.div>
  );

  // Render product selection step
  const renderProductStep = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    products: ProductWithSpec[],
    selectedProduct: ProductWithSpec | null,
    onSelect: (product: ProductWithSpec) => void,
    onClear?: () => void
  ) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-2xl border shadow-lg overflow-hidden"
    >
      <div className="p-6 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          
          {selectedProduct && onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Cambiar
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px] sm:h-[450px]">
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>No hay productos disponibles con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product, index) => {
                const isSelected = selectedProduct?.id === product.id;
                const price = product.costo ? calculateSuggestedPrice(product.costo, product.clave || '') : 0;
                const spec = product.spec;
                
                const specsDisplay: string[] = [];
                if (spec?.socket) specsDisplay.push(spec.socket);
                if (spec?.ram_type) specsDisplay.push(spec.ram_type);
                if (spec?.form_factor) specsDisplay.push(spec.form_factor);
                if (spec?.cpu_tdp) specsDisplay.push(`${spec.cpu_tdp}W`);
                if (spec?.gpu_tdp) specsDisplay.push(`${spec.gpu_tdp}W TDP`);
                if (spec?.gpu_length) specsDisplay.push(`${spec.gpu_length}mm`);
                if (spec?.gpu_memory_capacity) specsDisplay.push(`${spec.gpu_memory_capacity}GB`);
                if (spec?.gpu_memory_type) specsDisplay.push(spec.gpu_memory_type);
                if (spec?.psu_wattage) specsDisplay.push(`${spec.psu_wattage}W`);
                if (spec?.psu_efficiency) specsDisplay.push(spec.psu_efficiency);
                if (spec?.ram_capacity) specsDisplay.push(`${spec.ram_capacity}GB`);
                if (spec?.ram_speed) specsDisplay.push(`${spec.ram_speed}MHz`);
                if (spec?.storage_capacity) specsDisplay.push(`${spec.storage_capacity}GB`);
                if (spec?.storage_type) specsDisplay.push(spec.storage_type);
                if (spec?.case_form_factors?.length) specsDisplay.push(spec.case_form_factors.join('/'));
                
                return (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onSelect(product)}
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
                    
                    {spec?.is_gamer && (
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
                          <Package size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                        {specsDisplay.length > 0 && (
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                            {specsDisplay.slice(0, 4).join(' • ')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mb-2">
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
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );

  // Render storage step (multi-select)
  const renderStorageStep = () => {
    const limits = getStorageLimits();
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-2xl border shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <HardDrive size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Almacenamiento</h2>
              <p className="text-sm text-muted-foreground">
                Puedes seleccionar múltiples discos (SATA: {limits.sataAvailable}/4 disponibles, M.2: {limits.m2Available}/{selectedMotherboard?.spec?.m2_slots || 0} disponibles)
              </p>
            </div>
          </div>
          
          {/* Selected storage */}
          {storageSelections.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {storageSelections.map(s => (
                <div key={s.product.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">{s.product.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeStorage(s.product.id)}
                    >
                      <Minus size={12} />
                    </Button>
                    <span className="text-sm font-bold">{s.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => addStorage(s.product)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px] sm:h-[400px]">
          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredStorage.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HardDrive size={48} className="mx-auto mb-4 opacity-30" />
                <p>No hay productos de almacenamiento disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStorage.map((product, index) => {
                  const selected = storageSelections.find(s => s.product.id === product.id);
                  const price = product.costo ? calculateSuggestedPrice(product.costo, product.clave || '') : 0;
                  const spec = product.spec;
                  
                  const isNvme = spec?.storage_interface === 'M2' && spec?.storage_subtype === 'NVMe';
                  const isSata = spec?.storage_interface === 'SATA';
                  const canAdd = isNvme ? limits.m2Available > 0 : isSata ? limits.sataAvailable > 0 : true;
                  
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all",
                        selected 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <div className="flex gap-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-16 h-16 object-contain rounded-lg bg-white"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <HardDrive size={24} className="text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {spec?.storage_interface} {spec?.storage_subtype} {spec?.storage_capacity}GB
                          </p>
                          <p className="text-primary font-bold">
                            ${price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        
                        <Button
                          variant={selected ? "secondary" : "outline"}
                          size="icon"
                          onClick={() => selected ? removeStorage(product.id) : addStorage(product)}
                          disabled={!selected && !canAdd}
                        >
                          {selected ? <Minus size={16} /> : <Plus size={16} />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    );
  };

  // Render final summary
  const renderSummary = () => {
    const components = [
      { label: 'Procesador', product: selectedCpu, icon: <Cpu size={20} /> },
      { label: 'Motherboard', product: selectedMotherboard, icon: <CircuitBoard size={20} /> },
      { label: 'RAM', product: selectedRam, qty: ramQuantity, icon: <MemoryStick size={20} /> },
      ...storageSelections.map(s => ({ 
        label: 'Almacenamiento', 
        product: s.product, 
        qty: s.quantity, 
        icon: <HardDrive size={20} /> 
      })),
      { label: 'Gabinete', product: selectedCase, icon: <Package size={20} /> },
      { label: 'Tarjeta de Video', product: selectedGpu, icon: <Monitor size={20} /> },
      caseIncludesPsu 
        ? { label: 'Fuente', product: { name: 'Incluida en gabinete (500W)', costo: 0 } as any, icon: <Power size={20} /> }
        : { label: 'Fuente', product: selectedPsu, icon: <Power size={20} /> },
      { label: 'Enfriamiento', product: selectedCooling, icon: <Fan size={20} /> },
    ].filter(c => c.product);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border shadow-xl overflow-hidden max-w-3xl mx-auto"
      >
        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Tu PC Personalizada</h2>
          </div>
          <p className="text-center text-muted-foreground">Revisa tu configuración</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {components.map((comp, index) => (
              <motion.div
                key={`${comp.label}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center p-4 bg-muted/50 rounded-xl"
              >
                {comp.product?.image_url ? (
                  <img 
                    src={comp.product.image_url} 
                    alt={comp.label}
                    className="w-16 h-16 object-contain mx-auto mb-2 rounded-lg bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                    {comp.icon}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-1">{comp.label}</p>
                <p className="text-xs font-medium line-clamp-2">
                  {comp.product?.name}
                  {(comp as any).qty && (comp as any).qty > 1 && ` (x${(comp as any).qty})`}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total Estimado</span>
              <span className="text-3xl font-bold text-primary">
                ${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este precio es aproximado, contáctanos para verificar el precio o para ofrecerte algún descuento en tu ensamble.
            </p>
          </div>

          <a
            href={`https://wa.me/529622148546?text=${generateWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg bg-green-600 hover:bg-green-700 text-white transition-all"
          >
            <MessageCircle size={24} />
            Cotizar Ahora por WhatsApp
          </a>
        </div>
      </motion.div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'usage':
        return renderQuestionStep(
          '¿Para qué usarás tu PC?',
          'Esto nos ayudará a recomendarte los mejores componentes',
          [
            { value: 'basic', label: 'Uso Básico', description: 'Escolar, administrativo, hogar', icon: <Home className="w-8 h-8" /> },
            { value: 'professional', label: 'Profesional', description: 'Trabajo demandante, servidor', icon: <Briefcase className="w-8 h-8" /> },
            { value: 'gaming', label: 'Gaming', description: 'Juegos y alto rendimiento', icon: <Gamepad2 className="w-8 h-8" /> },
          ],
          (value) => {
            setFilters(prev => ({ ...prev, usageType: value as UsageType }));
            setCurrentStep('cpu_brand');
          }
        );

      case 'cpu_brand':
        return renderQuestionStep(
          'Elige tu procesador',
          '¿Prefieres AMD o Intel?',
          [
            { 
              value: 'AMD', 
              label: 'AMD', 
              description: 'Ryzen - Excelente rendimiento', 
              icon: <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg" alt="AMD" className="w-12 h-12 object-contain" />
            },
            { 
              value: 'Intel', 
              label: 'Intel', 
              description: 'Core - Gran rendimiento', 
              icon: <img src="https://upload.wikimedia.org/wikipedia/commons/c/c9/Intel-logo.svg" alt="Intel" className="w-12 h-12 object-contain" />
            },
          ],
          (value) => {
            setFilters(prev => ({ ...prev, cpuBrand: value as CpuBrand }));
            setCurrentStep('cpu');
          }
        );

      case 'cpu':
        return renderProductStep(
          'Procesador',
          `Selecciona tu procesador ${filters.cpuBrand}`,
          <Cpu size={28} />,
          filteredCpus,
          selectedCpu,
          (p) => { setSelectedCpu(p); handleNext(); },
          () => setSelectedCpu(null)
        );

      case 'motherboard':
        return renderProductStep(
          'Motherboard',
          `Compatible con socket ${selectedCpu?.spec?.socket}`,
          <CircuitBoard size={28} />,
          filteredMotherboards,
          selectedMotherboard,
          (p) => { setSelectedMotherboard(p); setSelectedRam(null); setStorageSelections([]); handleNext(); },
          () => setSelectedMotherboard(null)
        );

      case 'ram':
        return (
          <>
            {renderProductStep(
              'Memoria RAM',
              `Tipo ${selectedMotherboard?.spec?.ram_type} - Máx ${selectedMotherboard?.spec?.max_ram_speed}MHz`,
              <MemoryStick size={28} />,
              filteredRam,
              selectedRam,
              (p) => { setSelectedRam(p); setRamQuantity(1); },
              () => { setSelectedRam(null); setRamQuantity(1); }
            )}
            {selectedRam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-card rounded-xl border flex items-center justify-between"
              >
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
                    <Minus size={16} />
                  </Button>
                  <span className="w-8 text-center font-bold">{ramQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRamQuantity(prev => Math.min(maxRamQuantity, prev + 1))}
                    disabled={ramQuantity >= maxRamQuantity}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        );

      case 'storage':
        return renderStorageStep();

      case 'case_question':
        return renderQuestionStep(
          '¿Tienes poco espacio?',
          '¿Buscas un gabinete compacto?',
          [
            { value: 'yes', label: 'Sí, necesito algo compacto', description: 'Gabinetes compactos', icon: <Package className="w-8 h-8" /> },
            { value: 'no', label: 'No, el tamaño no importa', description: 'Todas las opciones', icon: <Package className="w-8 h-8" /> },
          ],
          (value) => {
            setFilters(prev => ({ ...prev, wantsCompactCase: value === 'yes' }));
            setCurrentStep('case');
          }
        );

      case 'case':
        return renderProductStep(
          'Gabinete',
          filters.wantsCompactCase ? 'Gabinetes compactos' : `Compatible con ${selectedMotherboard?.spec?.form_factor}`,
          <Package size={28} />,
          filteredCases,
          selectedCase,
          (p) => { setSelectedCase(p); setSelectedPsu(null); handleNext(); },
          () => setSelectedCase(null)
        );

      case 'gpu':
        return renderProductStep(
          'Tarjeta de Video',
          selectedCase?.spec?.case_max_gpu_length 
            ? `Máximo ${selectedCase.spec.case_max_gpu_length}mm` 
            : 'Selecciona tu GPU',
          <Monitor size={28} />,
          filteredGpus,
          selectedGpu,
          (p) => { setSelectedGpu(p); handleNext(); },
          () => setSelectedGpu(null)
        );

      case 'psu':
        const minWattage = (selectedCpu?.spec?.cpu_tdp || 0) + (selectedGpu?.spec?.gpu_tdp || 0) + 100;
        return renderProductStep(
          'Fuente de Poder',
          `Mínimo recomendado: ${minWattage}W`,
          <Power size={28} />,
          filteredPsus,
          selectedPsu,
          (p) => { setSelectedPsu(p); handleNext(); },
          () => setSelectedPsu(null)
        );

      case 'cooling_question':
        return renderQuestionStep(
          '¿Requieres enfriamiento adicional?',
          'Los procesadores incluyen un disipador básico',
          [
            { value: 'yes', label: 'Sí, quiero mejor enfriamiento', description: 'Mayor rendimiento y silencio', icon: <Fan className="w-8 h-8" /> },
            { value: 'no', label: 'No, el incluido es suficiente', description: 'Usar disipador de fábrica', icon: <Check className="w-8 h-8" /> },
          ],
          (value) => {
            setFilters(prev => ({ ...prev, needsCooling: value === 'yes' }));
            if (value === 'yes') {
              setCurrentStep('cooling_type');
            } else {
              setCurrentStep('summary');
            }
          }
        );

      case 'cooling_type':
        return renderQuestionStep(
          '¿Enfriamiento líquido o por aire?',
          'Elige el tipo de enfriamiento',
          [
            { value: 'air', label: 'Por Aire', description: 'Confiable y económico', icon: <Fan className="w-8 h-8" /> },
            { 
              value: 'liquid', 
              label: 'Líquido', 
              description: selectedCase?.spec?.case_supports_liquid_cooling === false 
                ? 'No compatible con tu gabinete' 
                : 'Mejor rendimiento térmico', 
              icon: <Zap className="w-8 h-8" /> 
            },
          ],
          (value) => {
            setFilters(prev => ({ ...prev, coolingType: value as CoolingType }));
            setCurrentStep('cooling');
          }
        );

      case 'cooling':
        return renderProductStep(
          'Enfriamiento',
          filters.coolingType === 'liquid' ? 'Enfriamiento líquido' : 'Enfriamiento por aire',
          <Fan size={28} />,
          filteredCooling,
          selectedCooling,
          (p) => { setSelectedCooling(p); setCurrentStep('summary'); },
          () => setSelectedCooling(null)
        );

      case 'summary':
        return renderSummary();

      default:
        return null;
    }
  };

  // Step indicator
  const stepIndicatorItems = [
    { key: 'cpu', label: 'CPU', done: !!selectedCpu },
    { key: 'motherboard', label: 'Motherboard', done: !!selectedMotherboard },
    { key: 'ram', label: 'RAM', done: !!selectedRam },
    { key: 'storage', label: 'Almacenamiento', done: storageSelections.length > 0 },
    { key: 'case', label: 'Gabinete', done: !!selectedCase },
    { key: 'gpu', label: 'GPU', done: !!selectedGpu },
    { key: 'psu', label: 'Fuente', done: !!selectedPsu || caseIncludesPsu },
    { key: 'cooling', label: 'Enfriamiento', done: !!selectedCooling || filters.needsCooling === false },
  ];

  const isQuestionStep = ['usage', 'cpu_brand', 'case_question', 'cooling_question', 'cooling_type', 'summary'].includes(currentStep);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-6">
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
                    : 'Configura tu equipo ideal'
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
            <div className="lg:col-span-3 space-y-4">
              {/* Step indicator - mobile */}
              {currentStep !== 'summary' && (
                <div className="lg:hidden overflow-x-auto pb-2">
                  <div className="flex items-center gap-2">
                    {stepIndicatorItems.map((item, index) => (
                      <div
                        key={item.key}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs",
                          item.done 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.done && <Check size={12} />}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current step content */}
              <AnimatePresence mode="wait">
                <div key={currentStep}>
                  {renderStepContent()}
                </div>
              </AnimatePresence>

              {/* Navigation */}
              {!isQuestionStep && currentStep !== 'summary' && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" onClick={handlePrev} className="gap-2">
                    <ArrowLeft size={16} />
                    Anterior
                  </Button>
                  <Button onClick={handleNext} className="gap-2">
                    Siguiente
                    <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-36">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card rounded-2xl border shadow-lg overflow-hidden"
                >
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-bold">Tu Configuración</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedCount} componentes seleccionados
                    </p>
                  </div>

                  <div className="p-2">
                    {stepIndicatorItems.map((item) => (
                      <div
                        key={item.key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          item.done && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          item.done 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {item.done ? <Check size={14} /> : ''}
                        </div>
                        <span className={cn(
                          "text-sm",
                          item.done ? "font-medium" : "text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-xl font-bold text-primary">
                        ${totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {selectedCount >= 5 && (
                      <Button
                        onClick={() => setCurrentStep('summary')}
                        className="w-full mt-2"
                      >
                        Ver Resumen
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom bar */}
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
            
            {selectedCount >= 5 && currentStep !== 'summary' && (
              <Button onClick={() => setCurrentStep('summary')} className="gap-2">
                <ShoppingCart size={18} />
                Ver Resumen
              </Button>
            )}
          </div>
        </motion.div>

        <div className="lg:hidden h-24" />
      </div>
    </Layout>
  );
};

export default PCBuilder;
