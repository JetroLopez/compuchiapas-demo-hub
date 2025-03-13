
export interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  specs: string[];
}

export const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'laptops', name: 'Laptops' },
  { id: 'desktops', name: 'Computadoras' },
  { id: 'components', name: 'Componentes' },
  { id: 'accessories', name: 'Accesorios' },
  { id: 'printers', name: 'Impresoras' },
  { id: 'network', name: 'Redes' },
  { id: 'consumables', name: 'Consumibles' }
];

export const products: Product[] = [
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
