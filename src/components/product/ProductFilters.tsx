
import React, { useState, useMemo } from 'react';
import { Search, Monitor, Laptop, Cpu, HardDrive, Printer, Droplets, Network, Zap, Volume2, Mouse, Shield, ShoppingCart, FileCode, Armchair, Wrench, Tag, Building2, ChevronDown, ChevronRight, Package, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// Nueva estructura jerárquica de categorías (solo para visualización)
const catalogStructure = [
  {
    id: 'computadoras',
    name: 'Computadoras',
    icon: Monitor,
    color: 'from-blue-500 to-blue-600',
    subcategories: [
      { name: 'PCs de Escritorio', codes: ['COMPU'] }
    ]
  },
  {
    id: 'laptops',
    name: 'Laptops',
    icon: Laptop,
    color: 'from-indigo-500 to-indigo-600',
    subcategories: [
      { name: 'Laptops', codes: ['LAPTO'] }
    ]
  },
  {
    id: 'componentes',
    name: 'Componentes',
    icon: Cpu,
    color: 'from-purple-500 to-purple-600',
    subcategories: [
      { name: 'Tarjetas Madre', codes: ['MOTHE'] },
      { name: 'Procesadores', codes: ['MICRO'] },
      { name: 'Fuentes de Poder', codes: ['FUENT'] },
      { name: 'Gabinetes', codes: ['GABIN'] },
      { name: 'Tarjetas Gráficas', codes: ['VIDEO'] },
      { name: 'Sistemas de Enfriamiento', codes: ['ENFRI'] }
    ]
  },
  {
    id: 'almacenamiento',
    name: 'Almacenamiento',
    icon: HardDrive,
    color: 'from-cyan-500 to-cyan-600',
    subcategories: [
      { name: 'Discos Duros Internos', codes: ['DDURI'] },
      { name: 'Discos Duros Externos', codes: ['DDURE'] },
      { name: 'Memorias USB', codes: ['MEUSB'] },
      { name: 'Memorias Flash', codes: ['MEFLA'] },
      { name: 'Memorias RAM DIMM/UDIMM', codes: ['MEDIM'] },
      { name: 'Memorias RAM SODIMM', codes: ['MESOD'] },
      { name: 'Marca SanDisk', codes: ['SDISK'] }
    ]
  },
  {
    id: 'impresion',
    name: 'Impresión',
    icon: Printer,
    color: 'from-orange-500 to-orange-600',
    subcategories: [
      { name: 'Impresoras Brother', codes: ['IMPBR'] },
      { name: 'Impresoras Epson', codes: ['IMPEP'] },
      { name: 'Impresoras HP', codes: ['IMPHP'] },
      { name: 'Impresoras Otras Marcas', codes: ['IMPOT'] }
    ]
  },
  {
    id: 'consumibles',
    name: 'Consumibles',
    icon: Droplets,
    color: 'from-pink-500 to-pink-600',
    subcategories: [
      { name: 'Consumibles Brother', codes: ['CONBR'] },
      { name: 'Consumibles Epson', codes: ['CONEP'] },
      { name: 'Consumibles HP', codes: ['CONHP'] },
      { name: 'Consumibles Otras Marcas', codes: ['CONOT'] }
    ]
  },
  {
    id: 'redes',
    name: 'Redes',
    icon: Network,
    color: 'from-teal-500 to-teal-600',
    subcategories: [
      { name: 'TP-Link', codes: ['RTPLK'] },
      { name: 'Tenda', codes: ['TENDA'] },
      { name: 'Linksys', codes: ['LINKS'] },
      { name: 'MikroTik', codes: ['MIKRO'] },
      { name: 'Ubiquiti', codes: ['RUBIQ'] },
      { name: 'Redes Otras Marcas', codes: ['REDOT'] },
      { name: 'Cableado de Red', codes: ['CARED'] }
    ]
  },
  {
    id: 'energia',
    name: 'Energía',
    icon: Zap,
    color: 'from-yellow-500 to-yellow-600',
    subcategories: [
      { name: 'NoBreaks', codes: ['ENNOB'] },
      { name: 'Reguladores de Voltaje', codes: ['ENREG'] },
      { name: 'Power Banks', codes: ['ENOTS'] },
      { name: 'Energía CDP', codes: ['CDP'] },
      { name: 'Energía Otras Marcas', codes: ['ENERG'] }
    ]
  },
  {
    id: 'audio-video',
    name: 'Audio y Video',
    icon: Volume2,
    color: 'from-red-500 to-red-600',
    subcategories: [
      { name: 'Bocinas', codes: ['BOCIN'] },
      { name: 'Diademas y Audífonos', codes: ['DIADE'] },
      { name: 'Proyectores, Tablets y Escáneres', codes: ['DIGIT'] }
    ]
  },
  {
    id: 'perifericos',
    name: 'Periféricos',
    icon: Mouse,
    color: 'from-emerald-500 to-emerald-600',
    subcategories: [
      { name: 'Teclados', codes: ['TECLA'] },
      { name: 'Mouses', codes: ['MOUSE'] },
      { name: 'Monitores', codes: ['MONIT'] },
      { name: 'Accesorios de Cómputo', codes: ['ACCES'] },
      { name: 'Cables y Adaptadores', codes: ['CABOT'] }
    ]
  },
  {
    id: 'seguridad',
    name: 'Seguridad',
    icon: Shield,
    color: 'from-slate-500 to-slate-600',
    subcategories: [
      { name: 'Cámaras y Videovigilancia', codes: ['CCTV', 'SEGUR'] }
    ]
  },
  {
    id: 'punto-venta',
    name: 'Punto de Venta',
    icon: ShoppingCart,
    color: 'from-lime-500 to-lime-600',
    subcategories: [
      { name: 'Equipos y Accesorios POS', codes: ['PUNTO', 'PTVTA'] }
    ]
  },
  {
    id: 'software',
    name: 'Software',
    icon: FileCode,
    color: 'from-violet-500 to-violet-600',
    subcategories: [
      { name: 'Software Comercial', codes: ['SOFTW'] }
    ]
  },
  {
    id: 'mobiliario',
    name: 'Mobiliario',
    icon: Armchair,
    color: 'from-amber-500 to-amber-600',
    subcategories: [
      { name: 'Mobiliario de Oficina', codes: ['MOBIL'] }
    ]
  },
  {
    id: 'refacciones',
    name: 'Refacciones',
    icon: Wrench,
    color: 'from-gray-500 to-gray-600',
    subcategories: [
      { name: 'Refacciones Generales', codes: ['REFAC'] },
      { name: 'Refacciones de Cargadores', codes: ['REFCA'] },
      { name: 'Refacciones de Pantallas', codes: ['REFPA'] },
      { name: 'Refacciones de Teclados', codes: ['REFTE'] },
      { name: 'Refacciones Varias', codes: ['REFOT'] }
    ]
  },
  {
    id: 'promociones',
    name: 'Promociones',
    icon: Tag,
    color: 'from-rose-500 to-rose-600',
    subcategories: [
      { name: 'Artículos en Promoción', codes: ['PROMO'] }
    ]
  },
  {
    id: 'marcas',
    name: 'Marcas',
    icon: Building2,
    color: 'from-sky-500 to-sky-600',
    subcategories: [
      { name: 'Acer', codes: ['ACER'] },
      { name: 'Lenovo', codes: ['LENOV'] },
      { name: 'Logitech', codes: ['LOGIT'] },
      { name: 'Koblenz', codes: ['KOBLE'] },
      { name: 'Xerox', codes: ['XEROX'] },
      { name: 'Adata', codes: ['ADATA'] }
    ]
  }
];

// Primeras 5 categorías que siempre se muestran
const VISIBLE_CATEGORIES_COUNT = 5;

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Mapear códigos de categoría a IDs de la base de datos
  const getMatchingCategoryIds = (codes: string[]): string[] => {
    return categories
      .filter(cat => codes.some(code => cat.id.toUpperCase().includes(code) || cat.name.toUpperCase().includes(code)))
      .map(cat => cat.id);
  };

  // Obtener todos los IDs de categoría para un padre
  const getAllCategoryIdsForParent = (parentId: string): string[] => {
    const parent = catalogStructure.find(p => p.id === parentId);
    if (!parent) return [];
    
    const allIds: string[] = [];
    parent.subcategories.forEach(sub => {
      const matchingIds = getMatchingCategoryIds(sub.codes);
      allIds.push(...matchingIds);
    });
    return allIds;
  };

  // Verificar si una categoría padre tiene categorías activas
  const isParentActive = (parentId: string) => {
    const parent = catalogStructure.find(p => p.id === parentId);
    if (!parent) return false;
    return parent.subcategories.some(sub => {
      const matchingIds = getMatchingCategoryIds(sub.codes);
      return matchingIds.includes(activeCategory);
    });
  };

  // Verificar si hay categorías que coinciden con los códigos
  const hasMatchingCategories = (codes: string[]): boolean => {
    return getMatchingCategoryIds(codes).length > 0;
  };

  // Filtrar categorías padre que tienen al menos una subcategoría visible
  const visibleCatalogStructure = useMemo(() => {
    return catalogStructure.filter(parent => 
      parent.subcategories.some(sub => hasMatchingCategories(sub.codes))
    );
  }, [categories]);

  // Categorías a mostrar según el estado
  const categoriesToShow = showAllCategories 
    ? visibleCatalogStructure 
    : visibleCatalogStructure.slice(0, VISIBLE_CATEGORIES_COUNT);

  const hasMoreCategories = visibleCatalogStructure.length > VISIBLE_CATEGORIES_COUNT;

  // Manejar clic en categoría padre - selecciona automáticamente todos los productos de esa categoría
  const handleParentClick = (parentId: string) => {
    const parent = catalogStructure.find(p => p.id === parentId);
    if (!parent) return;

    // Si ya está expandida, la colapsamos
    if (expandedCategory === parentId) {
      setExpandedCategory(null);
      return;
    }

    // Expandir y seleccionar automáticamente la primera subcategoría con productos
    setExpandedCategory(parentId);
    
    // Obtener todas las IDs de categoría para este padre
    const allCategoryIds = getAllCategoryIdsForParent(parentId);
    if (allCategoryIds.length > 0) {
      // Si hay múltiples, usamos una selección especial con el prefijo del padre
      // Por ahora seleccionamos la primera
      setActiveCategory(allCategoryIds[0]);
    }
  };

  // Manejar clic en subcategoría
  const handleSubcategoryClick = (codes: string[]) => {
    const matchingIds = getMatchingCategoryIds(codes);
    if (matchingIds.length > 0) {
      setActiveCategory(matchingIds[0]);
    }
  };

  // Verificar si una subcategoría está activa
  const isSubcategoryActive = (codes: string[]): boolean => {
    const matchingIds = getMatchingCategoryIds(codes);
    return matchingIds.includes(activeCategory);
  };

  // Filtrar subcategorías visibles (solo las que tienen productos)
  const getVisibleSubcategories = (parentId: string) => {
    const parent = catalogStructure.find(p => p.id === parentId);
    if (!parent) return [];
    return parent.subcategories.filter(sub => hasMatchingCategories(sub.codes));
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Buscar productos por nombre o clave..."
          className="w-full pl-12 pr-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Botón "Ver Todos" */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            setActiveCategory('all');
            setExpandedCategory(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-105'
              : 'bg-card hover:bg-accent border-2 border-border hover:border-primary/50 hover:shadow-md'
          }`}
        >
          <Package size={20} />
          Ver Todo el Catálogo
        </button>
      </div>
      
      {/* Grid de categorías padre */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categoriesToShow.map((parent) => {
          const IconComponent = parent.icon;
          const isActive = isParentActive(parent.id);
          const isExpanded = expandedCategory === parent.id;
          
          return (
            <button
              key={parent.id}
              onClick={() => handleParentClick(parent.id)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-h-[100px] group ${
                isActive || isExpanded
                  ? `bg-gradient-to-br ${parent.color} text-white shadow-lg`
                  : 'bg-card hover:bg-accent border border-border hover:shadow-md hover:border-primary/30'
              }`}
            >
              <div className={`p-2 rounded-lg mb-2 ${
                isActive || isExpanded ? 'bg-white/20' : 'bg-muted group-hover:bg-primary/10'
              }`}>
                <IconComponent size={24} className={isActive || isExpanded ? 'text-white' : 'text-foreground'} />
              </div>
              <span className={`text-xs font-semibold text-center leading-tight ${
                isActive || isExpanded ? 'text-white' : 'text-foreground'
              }`}>
                {parent.name}
              </span>
              <div className={`absolute top-2 right-2 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}>
                <ChevronRight size={14} className={isActive || isExpanded ? 'text-white/70' : 'text-muted-foreground'} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Botón "Ver más categorías" */}
      {hasMoreCategories && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 bg-muted hover:bg-accent border border-border hover:border-primary/30 text-foreground"
          >
            {showAllCategories ? (
              <>
                <ChevronUp size={18} />
                Ver menos categorías
              </>
            ) : (
              <>
                <ChevronDown size={18} />
                Ver más categorías ({visibleCatalogStructure.length - VISIBLE_CATEGORIES_COUNT} más)
              </>
            )}
          </button>
        </div>
      )}

      {/* Panel de subcategorías expandido */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {catalogStructure
              .filter(p => p.id === expandedCategory)
              .map((parent) => {
                const IconComponent = parent.icon;
                const visibleSubs = getVisibleSubcategories(parent.id);
                
                // Si solo hay una subcategoría, no mostrar el panel
                if (visibleSubs.length <= 1) return null;
                
                return (
                  <div
                    key={parent.id}
                    className={`bg-gradient-to-r ${parent.color} rounded-xl p-5 shadow-lg`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <IconComponent size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{parent.name}</h3>
                        <p className="text-white/70 text-sm">Selecciona una subcategoría</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {visibleSubs.map((sub, idx) => {
                        const isActive = isSubcategoryActive(sub.codes);
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSubcategoryClick(sub.codes)}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                              isActive
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{sub.name}</span>
                              <ChevronRight size={16} className={isActive ? 'text-gray-600' : 'text-white/60'} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de categoría activa */}
      {activeCategory !== 'all' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            {categories.find(c => c.id === activeCategory)?.name || activeCategory}
          </span>
          <button
            onClick={() => {
              setActiveCategory('all');
              setExpandedCategory(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Limpiar
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProductFilters;
