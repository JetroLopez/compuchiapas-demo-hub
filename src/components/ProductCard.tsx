
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  specs: string[];
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  image, 
  specs 
}) => {
  const whatsappNumber = "+529612345678"; // Ejemplo - cambiar por número real
  const whatsappMessage = `Hola, me interesa el producto ${name} con precio ${price}. ¿Podrían darme más información?`;
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl group">
      <div className="relative overflow-hidden h-56">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-tech-blue font-bold text-xl mb-4">{price}</p>
        
        <div className="space-y-2 mb-6">
          {specs.map((spec, index) => (
            <p key={index} className="text-sm text-gray-600 flex items-start">
              <span className="mr-2 text-tech-blue">•</span>
              {spec}
            </p>
          ))}
        </div>
        
        <button 
          onClick={handleWhatsAppClick}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
