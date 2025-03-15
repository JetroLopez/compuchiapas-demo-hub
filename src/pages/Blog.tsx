import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  useEffect(() => {
    // Para el SEO
    document.title = "Blog Tecnológico | Compuchiapas";
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: '5 señales de que tu computadora necesita mantenimiento preventivo',
      excerpt: 'Descubre las señales que indican que es momento de realizar un mantenimiento a tu equipo para evitar problemas mayores.',
      date: '15 de mayo, 2024',
      author: 'Equipo Técnico',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      slug: 'mantenimiento-preventivo'
    },
    {
      id: 2,
      title: 'Cómo elegir la laptop ideal para tus necesidades',
      excerpt: 'Guía completa para seleccionar el equipo que mejor se adapte a tus requerimientos, ya sea para trabajo, estudio o gaming.',
      date: '2 de mayo, 2024',
      author: 'Departamento de Ventas',
      image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      slug: 'elegir-laptop-ideal'
    },
    {
      id: 3,
      title: 'Lo que debes saber antes de instalar un sistema de videovigilancia',
      excerpt: 'Factores importantes a considerar para implementar un sistema de cámaras CCTV efectivo en tu hogar o negocio.',
      date: '20 de abril, 2024',
      author: 'Especialista en Seguridad',
      image: 'https://images.unsplash.com/photo-1595252129124-513b6e93c71f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      slug: 'sistemas-videovigilancia'
    },
    {
      id: 4,
      title: 'Ventajas de los puntos de venta digitales para pequeños negocios',
      excerpt: 'Descubre cómo los sistemas POS modernos pueden transformar la operación de tu negocio y mejorar la experiencia del cliente.',
      date: '5 de abril, 2024',
      author: 'Consultor de Negocios',
      image: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      slug: 'pos-negocios'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-24 pb-4 md:pt-28 md:pb-8 bg-gradient-to-b from-tech-lightGray to-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Tecnológico</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Artículos, guías y consejos para mantenerte al día con la tecnología
          </p>
        </div>
      </section>
      
      {/* Featured Article - Moved higher */}
      <section className="py-6">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Mantenimiento preventivo" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar size={16} className="mr-2" />
                  <span>15 de mayo, 2024</span>
                  <span className="mx-2">•</span>
                  <User size={16} className="mr-2" />
                  <span>Equipo Técnico</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-4">5 señales de que tu computadora necesita mantenimiento preventivo</h2>
                <p className="text-gray-600 mb-6">
                  Descubre las señales que indican que es momento de realizar un mantenimiento a tu equipo para evitar problemas mayores y extender su vida útil.
                </p>
                
                <Link 
                  to="/blog/mantenimiento-preventivo" 
                  className="group flex items-center text-tech-blue font-medium hover:underline mt-auto"
                >
                  Leer artículo completo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blog Posts Grid */}
      <section className="py-12 bg-tech-lightGray">
        <div className="container-padding max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Artículos recientes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <div key={post.id} className="glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full">
                <div className="relative h-48">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-6 flex flex-col h-[calc(100%-12rem)]">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar size={14} className="mr-1" />
                    <span>{post.date}</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                  <p className="text-gray-600 mb-6 line-clamp-3 flex-grow">{post.excerpt}</p>
                  
                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="group flex items-center text-tech-blue font-medium hover:underline mt-auto"
                  >
                    Leer más
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <a href="#" className="btn-outline">Cargar más artículos</a>
          </div>
        </div>
      </section>
      
      {/* Archive Section - Making it more compact */}
      <section className="py-12">
        <div className="container-padding max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Archivo de artículos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {['Mayo 2024', 'Abril 2024', 'Marzo 2024', 'Febrero 2024', 'Enero 2024', 'Diciembre 2023'].map((month, index) => (
              <a 
                key={index}
                href="#" 
                className="glass-card rounded-2xl p-6 flex justify-between items-center transition-all duration-300 hover:bg-tech-blue/5"
              >
                <span className="font-medium">{month}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter Section - Making it more compact */}
      <section className="py-12 bg-tech-blue text-white">
        <div className="container-padding max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Suscríbete a nuestro boletín</h2>
          <p className="text-lg mb-6 max-w-3xl mx-auto opacity-90">
            Recibe nuestros artículos más recientes y consejos tecnológicos directamente en tu correo
          </p>
          
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="px-4 py-3 rounded-lg flex-grow focus:outline-none text-gray-900"
              required
            />
            <button
              type="submit"
              className="bg-white text-tech-blue hover:bg-gray-100 py-3 px-6 rounded-lg font-medium transition-all duration-300"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
