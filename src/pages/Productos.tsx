import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { Search, Filter, MessageCircle } from 'lucide-react';

const Productos: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Para el SEO
    document.title = "Productos | Compuchiapas";
  }, []);

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'laptops', name: 'Laptops' },
    { id: 'desktops', name: 'Computadoras' },
    { id: 'components', name: 'Componentes' },
    { id: 'accessories', name: 'Accesorios' },
    { id: 'printers', name: 'Impresoras' },
    { id: 'network', name: 'Redes' },
    { id: 'consumables', name: 'Consumibles' }
  ];

  const products = [
    {
      id: 1,
      name: 'Laptop HP Pavilion 15',
      price: '$12,999 MXN',
      category: 'laptops',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Procesador Intel Core i5',
        'RAM 8GB DDR4',
        'SSD 512GB',
        'Pantalla 15.6" Full HD'
      ]
    },
    {
      id: 2,
      name: 'PC Gamer Compuchiapas Pro',
      price: '$24,999 MXN',
      category: 'desktops',
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Procesador Intel Core i7',
        'RAM 16GB DDR4',
        'SSD 1TB',
        'GPU NVIDIA RTX 3060 8GB'
      ]
    },
    {
      id: 3,
      name: 'Monitor LG 27" UltraGear',
      price: '$6,799 MXN',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1527219525722-f9767a7f2884?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Resolución 2560x1440',
        'Panel IPS',
        'Tiempo de respuesta 1ms',
        'Frecuencia 144Hz'
      ]
    },
    {
      id: 4,
      name: 'Impresora HP LaserJet Pro',
      price: '$4,599 MXN',
      category: 'printers',
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Impresión láser B/N',
        'Velocidad 22 ppm',
        'Conectividad WiFi',
        'Impresión a doble cara'
      ]
    },
    {
      id: 5,
      name: 'Router TP-Link Archer C6',
      price: '$999 MXN',
      category: 'network',
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'WiFi AC1200',
        '4 antenas',
        '4 puertos LAN',
        'Doble banda 2.4GHz y 5GHz'
      ]
    },
    {
      id: 6,
      name: 'Teclado Mecánico Logitech G413',
      price: '$1,699 MXN',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1567923185973-2c6088a6610f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Switches táctiles',
        'Retroiluminación RGB',
        'Construcción metálica',
        'USB pass-through'
      ]
    },
    {
      id: 7,
      name: 'Laptop Dell Inspiron 14',
      price: '$14,499 MXN',
      category: 'laptops',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Procesador Intel Core i7',
        'RAM 16GB DDR4',
        'SSD 512GB',
        'Pantalla 14" Full HD'
      ]
    },
    {
      id: 8,
      name: 'PC All-in-One HP 24',
      price: '$16,999 MXN',
      category: 'desktops',
      image: 'https://images.unsplash.com/photo-1527443060795-0402a18106c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Procesador Intel Core i5',
        'RAM 8GB DDR4',
        'SSD 256GB + HDD 1TB',
        'Pantalla 23.8" Full HD'
      ]
    },
    {
      id: 9,
      name: 'Tarjeta Gráfica NVIDIA RTX 3070',
      price: '$12,999 MXN',
      category: 'components',
      image: 'https://images.unsplash.com/photo-1555618568-bdf5a8e19bca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'VRAM 8GB GDDR6',
        'Puertos: HDMI, 3x DisplayPort',
        'Ray Tracing',
        'DLSS 2.0'
      ]
    },
    {
      id: 10,
      name: 'Cartucho de Tinta HP 664 Negro',
      price: '$349 MXN',
      category: 'consumables',
      image: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Original HP',
        'Compatible con DeskJet 1000, 2000',
        'Rendimiento 120 páginas',
        'Color Negro'
      ]
    },
    {
      id: 11,
      name: 'Tóner Brother TN-450',
      price: '$1,199 MXN',
      category: 'consumables',
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      specs: [
        'Original Brother',
        'Compatible con HL-2240/2270',
        'Rendimiento 2,600 páginas',
        'Color Negro'
      ]
    }
  ];

  // Filtro de productos por categoría y búsqueda
  const filteredProducts = products.filter(product => {
    // Filtrar por categoría
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    
    // Filtrar por término de búsqueda
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       product.specs.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-tech-lightGray to-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Catálogo de Productos</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Equipos y accesorios de calidad con garantía y soporte técnico incluido
          </p>
        </div>
      </section>
      
      {/* Special Banner */}
      <section className="py-12">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-tech-blue to-blue-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="col-span-2 p-8 md:p-12 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  ¿Necesitas un equipo personalizado?
                </h2>
                <p className="text-white/90 text-lg mb-6">
                  Ensamblamos tu PC ideal según tus necesidades específicas y presupuesto. 
                  Desde equipos para gaming hasta estaciones de trabajo profesionales.
                </p>
                <a 
                  href="https://wa.me/529612345678?text=Hola,%20me%20interesa%20ensamblar%20una%20PC%20personalizada.%20¿Me%20pueden%20asesorar?" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-tech-blue hover:bg-gray-100 py-3 px-6 rounded-lg font-medium inline-flex items-center transition-all duration-300"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Cotiza tu PC ahora
                </a>
              </div>
              <div className="hidden lg:block relative">
                <img 
                  src="https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="PC Personalizada" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Product Catalog */}
      <section className="py-16">
        <div className="container-padding max-w-7xl mx-auto">
          {/* Search and Filter */}
          <div className="mb-12 space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-1 overflow-x-auto pb-2">
              <div className="p-2 bg-tech-gray/10 rounded-lg mr-2">
                <Filter size={18} className="text-tech-gray" />
              </div>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-tech-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  specs={product.specs}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">
                No se encontraron productos que coincidan con tu búsqueda.
              </p>
              <button
                className="mt-4 text-tech-blue hover:underline"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* Custom Builds CTA */}
      <section className="py-16 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Armamos tu PC ideal</h2>
                <p className="text-gray-600 mb-6">
                  Si no encuentras el equipo que necesitas en nuestro catálogo, podemos armar una computadora personalizada según tus especificaciones y presupuesto.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <p>Componentes de las mejores marcas con garantía</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <p>Asesoría técnica para elegir las mejores opciones</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <p>Ensamblaje profesional y pruebas de rendimiento</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-tech-blue flex items-center justify-center mt-1 mr-3">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <p>Soporte técnico post-venta sin costo adicional</p>
                  </div>
                </div>
                
                <a 
                  href="https://wa.me/529612345678?text=Hola,%20me%20interesa%20cotizar%20una%20PC%20personalizada." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center"
                >
                  Solicitar cotización
                </a>
              </div>
              
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1624705002806-5d72df19c3dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Ensamble de PC" 
                  className="rounded-xl w-full h-auto shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Componente CheckIcon
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default Productos;
