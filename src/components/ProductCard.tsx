
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  specs: string[];
  sku?: string;
  stock?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  image, 
  specs,
  sku,
  stock
}) => {
  const whatsappNumber = "+529622148546"; // Updated WhatsApp number
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
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        {sku && (
          <p className="text-gray-400 text-sm mb-2">SKU: {sku}</p>
        )}
        <p className="text-tech-blue font-bold text-xl mb-2">{price}</p>
        
        {stock !== undefined && (
          <p className="text-sm font-medium mb-3">
            {stock >= 1 ? (
              <span className="text-green-600">Disponible</span>
            ) : (
              <span className="text-red-600">No disponible</span>
            )}
          </p>
        )}
        
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
          disabled={stock !== undefined && stock < 1}
        >
          <MessageCircle size={18} />
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
