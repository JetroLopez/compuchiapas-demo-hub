import React from 'react';
import { MessageCircle, Check } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  specs: string[];
  stock?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  image, 
  specs,
  stock
}) => {
  const whatsappNumber = "9622148546";
  const whatsappMessage = `Me interesa el producto "${name}" que vi en su sitio web. ¿Está disponible?`;
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className="relative overflow-hidden h-56">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {stock !== undefined && stock > 0 && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Disponible
          </span>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{name}</h3>
        
        {price && (
          <p className="text-tech-blue text-xl font-bold mb-3">{price}</p>
        )}
        
        {specs.length > 0 && (
          <ul className="space-y-1 mb-4">
            {specs.slice(0, 4).map((spec, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        )}
        
        <button 
          onClick={handleWhatsAppClick}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
