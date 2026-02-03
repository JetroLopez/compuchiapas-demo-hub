import React, { useState } from 'react';
import { MessageCircle, ShoppingCart, Plus, Minus } from 'lucide-react';
import { calculatePrice, formatPrice } from '@/lib/price-utils';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  id: string;
  clave: string | null;
  name: string;
  image: string;
  existencias: number;
  costo: number | null;
  categoryId: string | null;
  showPrice?: boolean;
  type?: 'product' | 'promotion';
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  id,
  clave,
  name, 
  image, 
  existencias,
  costo,
  categoryId,
  showPrice = false,
  type = 'product',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  
  const whatsappNumber = "9622148546";
  const price = calculatePrice(costo, categoryId);
  const formattedPrice = formatPrice(price);
  
  const quantityInCart = getItemQuantity(id, type);
  const isInCart = quantityInCart > 0;
  
  const whatsappMessage = showPrice && price > 0
    ? `Hola, me interesa cotizar el producto:\n\nClave: ${clave || 'N/A'}\nDescripción: ${name}\nPrecio: ${formattedPrice}\n\n¿Podrían darme más información?`
    : `Hola, me interesa cotizar el producto:\n\nClave: ${clave || 'N/A'}\nDescripción: ${name}\n\n¿Podrían darme más información sobre precio y disponibilidad?`;
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (existencias <= 0) {
      toast({
        title: "Producto agotado",
        description: "Este producto no está disponible actualmente",
        variant: "destructive"
      });
      return;
    }
    
    addItem({
      id,
      type,
      name,
      image_url: image,
      price: showPrice ? price : null,
      maxStock: existencias,
      clave
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantityInCart >= existencias) {
      toast({
        title: "Existencia limitada",
        description: "Si requieres más piezas contáctanos directamente",
        variant: "default"
      });
      return;
    }
    updateQuantity(id, type, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(id, type, quantityInCart - 1);
  };

  return (
    <div 
      className={`glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative ${isInCart ? 'ring-2 ring-primary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-square">
        <img 
          src={image} 
          alt=""
          title=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          draggable={false}
        />
        
        {/* Stock badges */}
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

        {/* Cart overlay */}
        {(isHovered || isInCart) && existencias > 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300">
            {!isInCart ? (
              <button
                onClick={handleAddToCart}
                className="bg-primary text-primary-foreground rounded-full p-4 hover:scale-110 transition-transform shadow-lg"
                aria-label="Agregar al carrito"
              >
                <ShoppingCart size={24} />
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-background rounded-full px-2 py-1 shadow-lg">
                <button
                  onClick={handleDecrement}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Reducir cantidad"
                >
                  <Minus size={20} />
                </button>
                <span className="font-bold text-lg min-w-[2rem] text-center">{quantityInCart}</span>
                <button
                  onClick={handleIncrement}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-6">
        {clave && (
          <p className="text-xs text-muted-foreground mb-1">Clave: {clave}</p>
        )}
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{name}</h3>
        
        {/* Price Display - Only when showPrice is true */}
        {showPrice && price > 0 && (
          <p className="text-2xl font-bold text-primary mb-4">{formattedPrice}</p>
        )}
        {showPrice && price === 0 && (
          <p className="text-lg text-muted-foreground mb-4">Consultar precio</p>
        )}
        {!showPrice && (
          <p className="text-lg text-muted-foreground mb-4">Consultar precio</p>
        )}
        
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
