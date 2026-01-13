
import React, { useState } from 'react';
import { Search, Monitor, Cpu, HardDrive, Laptop, Printer, Network, Headphones, Package, ChevronDown, ChevronUp } from 'lucide-react';
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

// Agrupación visual de categorías (no afecta la base de datos)
const categoryGroups = [
  {
    name: "Equipos",
    icon: Monitor,
    keywords: ["computadora", "laptop", "desktop", "all-in-one", "workstation", "pc"]
  },
  {
    name: "Componentes",
    icon: Cpu,
    keywords: ["procesador", "memoria", "ram", "tarjeta", "mother", "board", "fuente", "gabinete", "ventilador", "cooler"]
  },
  {
    name: "Almacenamiento",
    icon: HardDrive,
    keywords: ["disco", "ssd", "hdd", "usb", "memoria", "flash", "almacenamiento", "storage"]
  },
  {
    name: "Portátiles",
    icon: Laptop,
    keywords: ["laptop", "notebook", "portatil", "chromebook"]
  },
  {
    name: "Impresión",
    icon: Printer,
    keywords: ["impresora", "toner", "cartucho", "tinta", "scanner", "multifuncional"]
  },
  {
    name: "Redes",
    icon: Network,
    keywords: ["router", "switch", "cable", "red", "modem", "access point", "wifi", "ethernet"]
  },
  {
    name: "Periféricos",
    icon: Headphones,
    keywords: ["mouse", "teclado", "monitor", "pantalla", "audifonos", "bocinas", "webcam", "camara"]
  }
];

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Función para determinar a qué grupo pertenece una categoría
  const getCategoryGroup = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    for (const group of categoryGroups) {
      if (group.keywords.some(keyword => lowerName.includes(keyword))) {
        return group.name;
      }
    }
    return null;
  };

  // Agrupar categorías
  const groupedCategories = categoryGroups.map(group => ({
    ...group,
    categories: categories.filter(cat => getCategoryGroup(cat.name) === group.name)
  })).filter(group => group.categories.length > 0);

  // Categorías sin grupo
  const ungroupedCategories = categories.filter(cat => !getCategoryGroup(cat.name));

  const handleGroupClick = (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupName);
    }
  };

  const isGroupActive = (group: typeof groupedCategories[0]) => {
    return group.categories.some(cat => cat.id === activeCategory);
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
          placeholder="Buscar productos..."
          className="w-full pl-12 pr-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Grid de categorías agrupadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Botón "Todos" */}
        <button
          onClick={() => {
            setActiveCategory('all');
            setExpandedGroup(null);
          }}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-h-[100px] ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
              : 'bg-card hover:bg-accent border border-border hover:shadow-md'
          }`}
        >
          <Package size={28} className="mb-2" />
          <span className="text-sm font-medium text-center">Todos</span>
        </button>

        {/* Grupos de categorías */}
        {groupedCategories.map((group) => {
          const IconComponent = group.icon;
          const isActive = isGroupActive(group);
          const isExpanded = expandedGroup === group.name;
          
          return (
            <div key={group.name} className="relative">
              <button
                onClick={() => handleGroupClick(group.name)}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-h-[100px] ${
                  isActive
                    ? 'bg-primary/90 text-primary-foreground shadow-lg'
                    : isExpanded
                    ? 'bg-accent border-2 border-primary shadow-md'
                    : 'bg-card hover:bg-accent border border-border hover:shadow-md'
                }`}
              >
                <IconComponent size={28} className="mb-2" />
                <span className="text-sm font-medium text-center leading-tight">{group.name}</span>
                <span className="text-xs opacity-70 mt-1">({group.categories.length})</span>
                {isExpanded ? (
                  <ChevronUp size={16} className="absolute top-2 right-2 opacity-60" />
                ) : (
                  <ChevronDown size={16} className="absolute top-2 right-2 opacity-60" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Subcategorías expandidas */}
      <AnimatePresence>
        {expandedGroup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                Subcategorías de {expandedGroup}:
              </p>
              <div className="flex flex-wrap gap-2">
                {groupedCategories
                  .find(g => g.name === expandedGroup)
                  ?.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeCategory === category.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background hover:bg-accent border border-border'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categorías sin agrupar */}
      {ungroupedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-sm text-muted-foreground mr-2 self-center">Otras:</span>
          {ungroupedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setExpandedGroup(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
