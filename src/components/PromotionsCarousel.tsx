import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tag, ShoppingCart, Plus, Minus, MessageCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  existencias: number | null;
  img_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

const PromotionsCarousel: React.FC = () => {
  const { addItem, getItemQuantity, updateQuantity, setIsOpen } = useCart();
  const { toast } = useToast();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="section-padding bg-gradient-to-br from-tech-blue/5 to-tech-orange/5">
        <div className="container-padding max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  const whatsappNumber = "9622148546";

  const handleWhatsAppClick = (promo: Promotion) => {
    const message = `Ví esta promoción en su pagina web y me interesa
*${promo.clave}*
*${promo.nombre}* por *${formatPrice(promo.precio)}*
¿Sigue disponible?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = (promo: Promotion) => {
    const stock = promo.existencias || 0;
    if (stock <= 0) {
      toast({
        title: "Producto agotado",
        description: "Esta promoción no está disponible actualmente",
        variant: "destructive"
      });
      return;
    }
    
    addItem({
      id: promo.id,
      type: 'promotion',
      name: promo.nombre,
      image_url: promo.img_url,
      price: promo.precio,
      maxStock: stock,
      clave: promo.clave
    });
  };

  const handleIncrement = (promo: Promotion) => {
    const qty = getItemQuantity(promo.id, 'promotion');
    const stock = promo.existencias || 0;
    if (qty >= stock) {
      toast({
        title: "Existencia limitada",
        description: "Si requieres más piezas contáctanos directamente",
        variant: "default"
      });
      return;
    }
    updateQuantity(promo.id, 'promotion', qty + 1);
  };

  const handleDecrement = (promo: Promotion) => {
    const qty = getItemQuantity(promo.id, 'promotion');
    updateQuantity(promo.id, 'promotion', qty - 1);
  };

  return (
    <section className="py-3 md:section-padding bg-gradient-to-br from-tech-blue/5 to-tech-orange/5">
      <div className="container-padding max-w-7xl mx-auto">
        <div className="text-center mb-3 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-tech-orange/10 text-tech-orange px-4 py-2 rounded-full mb-2 md:mb-4">
            <Tag size={18} />
            <span className="font-semibold">Ofertas Especiales</span>
          </div>
          <h2 className="hidden md:block text-3xl md:text-4xl font-bold mb-4">
            Promociones y productos más vendidos
          </h2>
          <p className="hidden md:block text-xl text-gray-600 max-w-3xl mx-auto">
            Aprovecha nuestras ofertas exclusivas y los productos favoritos de nuestros clientes
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({ delay: 2000, stopOnInteraction: true, stopOnMouseEnter: true }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {promotions.map((promo) => {
              const quantityInCart = getItemQuantity(promo.id, 'promotion');
              const isInCart = quantityInCart > 0;
              const stock = promo.existencias || 0;
              const isHovered = hoveredId === promo.id;

              return (
                <CarouselItem key={promo.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card 
                    className={`overflow-hidden h-full group hover:shadow-xl transition-all duration-300 border-0 bg-white ${isInCart ? 'ring-2 ring-primary' : ''}`}
                    onMouseEnter={() => setHoveredId(promo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Image container with fixed aspect ratio */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {promo.img_url ? (
                        <img
                          src={promo.img_url}
                          alt={promo.nombre}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tech-blue/10 to-tech-orange/10">
                          <Tag size={48} className="text-gray-300" />
                        </div>
                      )}
                      
                      {/* Price badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-tech-orange text-white text-lg px-3 py-1 shadow-lg">
                          {formatPrice(promo.precio)}
                        </Badge>
                      </div>
                      
                      {/* Stock indicator */}
                      {stock > 0 && (
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="secondary" className="bg-green-500/90 text-white">
                            {stock} disponibles
                          </Badge>
                        </div>
                      )}
                      {stock === 0 && (
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="secondary" className="bg-red-500/90 text-white">
                            Agotado
                          </Badge>
                        </div>
                      )}

                      {/* Cart overlay */}
                      {(isHovered || isInCart) && stock > 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300">
                          {!isInCart ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(promo);
                              }}
                              className="bg-primary text-primary-foreground rounded-full p-4 hover:scale-110 transition-transform shadow-lg"
                              aria-label="Agregar al carrito"
                            >
                              <ShoppingCart size={24} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 bg-background rounded-full px-2 py-1 shadow-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecrement(promo);
                                }}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                aria-label="Reducir cantidad"
                              >
                                <Minus size={20} />
                              </button>
                              <span className="font-bold text-lg min-w-[2rem] text-center">{quantityInCart}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncrement(promo);
                                }}
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
                    
                    <CardContent className="p-6">
                      <p className="text-xs text-tech-blue font-mono mb-2">{promo.clave}</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-tech-blue transition-colors">
                        {promo.nombre}
                      </h3>
                      {promo.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {promo.descripcion}
                        </p>
                      )}
                      <Button
                        onClick={() => handleWhatsAppClick(promo)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Cotizar por WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4 bg-white shadow-lg hover:bg-tech-blue hover:text-white" />
          <CarouselNext className="hidden md:flex -right-4 bg-white shadow-lg hover:bg-tech-blue hover:text-white" />
        </Carousel>
        
        {/* Mobile indicators */}
        <div className="flex justify-center mt-6 md:hidden">
          <p className="text-sm text-gray-500">Desliza para ver más →</p>
        </div>
      </div>
    </section>
  );
};

export default PromotionsCarousel;
