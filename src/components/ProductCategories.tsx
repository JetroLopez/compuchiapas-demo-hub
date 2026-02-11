
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  image: string;
  slug: string;
  className?: string;
  style?: React.CSSProperties; // Add style prop
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, image, slug, className, style }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={cn(
        "relative h-64 rounded-2xl overflow-hidden cursor-pointer group",
        "transform transition-all duration-500 hover:shadow-xl",
        className
      )}
      style={style}
      onClick={() => navigate(`/productos?categoria=${slug}`)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-500 group-hover:-translate-y-2">
        <h3 className="text-white text-xl font-semibold">{title}</h3>
        <p className="text-white/80 text-sm mt-1">Explorar categoría</p>
      </div>
    </div>
  );
};

const ProductCategories: React.FC = () => {
  const categories = [
    {
      title: 'Laptops',
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      slug: 'LAPTO'
    },
    {
      title: 'Computadoras de Escritorio',
      image: 'https://tecnotraffic.net/wp-content/uploads/2022/04/Las-mejores-computadoras-de-escritorio-de-2022.jpg',
      slug: 'COMPU'
    },
    {
      title: 'Accesorios',
      image: 'https://tse1.mm.bing.net/th/id/OIP.jXpHOwODKsL2zXMM92p_QgHaEq?rs=1&pid=ImgDetMain&o=7&rm=3',
      slug: 'ACCES'
    },
    {
      title: 'Punto de Venta',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZ3_swGtzbPjKWzUOGnbAJne5Juv8B8J6NHg&s',
      slug: 'PTVTA'
    }
  ];

  return (
    <section className="section-padding bg-tech-lightGray dark:bg-muted/30">
      <div className="container-padding max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Categorías de Productos</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ofrecemos una amplia gama de soluciones tecnológicas para satisfacer todas tus necesidades
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              title={category.title}
              image={category.image}
              slug={category.slug}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <a href="/productos" className="btn-primary">
            Ver todos los productos
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;
