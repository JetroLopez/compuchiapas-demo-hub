import React, { useState } from 'react';
import { MessageCircle, ShoppingCart, Plus, Minus } from 'lucide-react';
import { calculatePrice, formatPrice } from '@/lib/price-utils';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductCardProps {
  id: string;
  clave: string | null;
  name: string;
  image: string;
  existencias: number;
  costo: number | null;
  categoryId: string | null;
  showPrice?: boolean;
  profitMultiplier?: number;
  type?: 'product' | 'promotion' | 'software';
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
  profitMultiplier = 1.20,
  type = 'product',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const whatsappNumber = "9622148546";
  // For software type, use costo directly as final price (no markup applied)
  // For other types, calculate price with markup
  const price = type === 'software' && costo !== null && costo > 0
    ? costo
    : calculatePrice(costo, categoryId, profitMultiplier);
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
    }, !isMobile);
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
    <>
      {/* ===== MOBILE: Horizontal compact card ===== */}
      <div
        className={`md:hidden flex items-stretch rounded-xl overflow-hidden border border-border bg-card shadow-sm ${isInCart ? 'ring-2 ring-primary' : ''}`}
      >
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
          {existencias === 0 && (
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Agotado</span>
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center">
          <h3 className="text-xs font-semibold line-clamp-2 leading-tight text-foreground">{name}</h3>
          {showPrice && price > 0 ? (
            <p className="text-sm font-bold text-primary mt-0.5">{formattedPrice}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-0.5">Consultar precio</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-1 pr-2 flex-shrink-0">
          <button
            onClick={handleWhatsAppClick}
            className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            aria-label="Cotizar por WhatsApp"
          >
            <MessageCircle size={16} />
          </button>
          {existencias > 0 && (
            <>
              {!isInCart ? (
                <button
                  onClick={handleAddToCart}
                  className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  aria-label="Agregar al carrito"
                >
                  <ShoppingCart size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button onClick={handleDecrement} className="p-0.5 hover:bg-muted rounded" aria-label="Reducir">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{quantityInCart}</span>
                  <button onClick={handleIncrement} className="p-0.5 hover:bg-muted rounded" aria-label="Aumentar">
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== DESKTOP: Original vertical card ===== */}
      <div 
        className={`hidden md:flex md:flex-col glass-card rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative ${isInCart ? 'ring-2 ring-primary' : ''}`}
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
        
        <div className="p-6 flex flex-col flex-1">
          {clave && (
            <p className="text-xs text-muted-foreground mb-1">Clave: {clave}</p>
          )}
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{name}</h3>
          
          {showPrice && price > 0 && (
            <p className="text-2xl font-bold text-primary">{formattedPrice}</p>
          )}
          {showPrice && price === 0 && (
            <p className="text-lg text-muted-foreground">Consultar precio</p>
          )}
          {!showPrice && (
            <p className="text-lg text-muted-foreground">Consultar precio</p>
          )}
          
          <div className="flex gap-2 mt-auto pt-4">
            {existencias > 0 && (
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Agregar
              </button>
            )}
            <button 
              onClick={handleWhatsAppClick}
              className={`bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${existencias <= 0 ? 'flex-1' : ''}`}
              title="Más información por WhatsApp"
            >
              <MessageCircle size={18} />
              {existencias <= 0 && 'Cotizar por WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
