import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ProductCardProps {
  clave: string | null;
  name: string;
  image: string;
  existencias: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  clave,
  name, 
  image, 
  existencias
}) => {
  const whatsappNumber = "9622148546";
  const whatsappMessage = `Hola, me interesa cotizar el producto:\n\nClave: ${clave || 'N/A'}\nDescripción: ${name}\n\n¿Podrían darme más información?`;
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <div className="relative overflow-hidden h-56">
        <img 
          src={image} 
          alt=""
          title=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          draggable={false}
        />
        {existencias > 0 && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            En stock: {existencias}
          </span>
        )}
        {existencias === 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Agotado
          </span>
        )}
      </div>
      
      <div className="p-6">
        {clave && (
          <p className="text-xs text-gray-500 mb-1">Clave: {clave}</p>
        )}
        <h3 className="text-lg font-semibold mb-4 line-clamp-2">{name}</h3>
        
        <button 
          onClick={handleWhatsAppClick}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          Cotizar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
