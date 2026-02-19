import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Download, ChevronDown, ChevronUp, ShoppingCart, Plus, Minus, MessageCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/price-utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SoftwareESD {
  id: string;
  marca: string;
  clave: string;
  descripcion: string;
  detalles: string | null;
  precio: number;
  img_url: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface SoftwareBrand {
  id: string;
  name: string;
  image_url: string | null;
}

const SoftwareESDPage: React.FC = () => {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [detailSoftware, setDetailSoftware] = useState<SoftwareESD | null>(null);

  useEffect(() => {
    document.title = "Software ESD | Compuchiapas";
  }, []);

  const { data: softwareList = [], isLoading } = useQuery({
    queryKey: ['software-esd'],
    queryFn: async (): Promise<SoftwareESD[]> => {
      const { data, error } = await (supabase
        .from('software_esd')
        .select('*')
        .eq('is_active', true)
        .order('marca', { ascending: true })
        .order('display_order', { ascending: true }) as any);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch brand images
  const { data: brands = [] } = useQuery({
    queryKey: ['software-esd-brands'],
    queryFn: async (): Promise<SoftwareBrand[]> => {
      const { data, error } = await (supabase
        .from('software_esd_brands')
        .select('*') as any);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Map brand name -> image_url
  const brandImageMap = React.useMemo(() => {
    const map = new Map<string, string | null>();
    (brands as SoftwareBrand[]).forEach(b => map.set(b.name, b.image_url));
    return map;
  }, [brands]);

  // Group by brand
  const softwareByBrand = React.useMemo(() => {
    const grouped: Record<string, SoftwareESD[]> = {};
    softwareList.forEach(item => {
      if (!grouped[item.marca]) {
        grouped[item.marca] = [];
      }
      grouped[item.marca].push(item);
    });
    return grouped;
  }, [softwareList]);

  const brandNames = Object.keys(softwareByBrand).sort();

  const handleAddToCart = (software: SoftwareESD) => {
    addItem({
      id: software.id,
      type: 'software',
      name: `${software.marca} - ${software.descripcion}`,
      image_url: software.img_url,
      price: software.precio > 0 ? software.precio : null,
      maxStock: 9999,
      clave: software.clave
    });
    
    toast({
      title: "Agregado al carrito",
      description: `${software.descripcion} agregado correctamente`,
    });
  };

  const handleIncrement = (software: SoftwareESD) => {
    const qty = getItemQuantity(software.id, 'software');
    updateQuantity(software.id, 'software', qty + 1);
  };

  const handleDecrement = (software: SoftwareESD) => {
    const qty = getItemQuantity(software.id, 'software');
    updateQuantity(software.id, 'software', qty - 1);
  };

  const whatsappNumber = "9622148546";

  const handleWhatsAppClick = (software: SoftwareESD) => {
    const message = `Hola, me interesa cotizar el software:\n\n*${software.marca}*\n*${software.descripcion}*\nClave: ${software.clave}\n\n¿Podrían darme información de precio y disponibilidad?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-24 pb-16">
          <div className="container-padding max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-24 pb-14 md:pt-28 md:pb-20 bg-gradient-to-br from-tech-blue via-tech-blue/90 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        
        <div className="container-padding max-w-7xl mx-auto text-center relative z-10 py-0">
          <div className="flex items-center justify-center mb-4">
            <Download size={48} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Software ESD</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
            Licencias de software originales con distribución electrónica instantánea
          </p>
        </div>
      </section>

      {/* Software Brands */}
      <section className="py-10 mx-0 px-0 my-0 bg-white dark:bg-slate-900 md:py-[30px]">
        <div className="container-padding max-w-7xl mx-auto">
          {brandNames.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No hay software disponible en este momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {brandNames.map((brand) => {
                const brandSoftware = softwareByBrand[brand];
                const isExpanded = expandedBrand === brand;
                const brandImage = brandImageMap.get(brand);

                return (
                  <Card key={brand} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedBrand(isExpanded ? null : brand)}
                      className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-muted">
                          {brandImage ? (
                            <img src={brandImage} alt={brand} className="w-full h-full object-contain" />
                          ) : (
                            <Download size={24} className="text-tech-blue dark:text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{brand}</h3>
                          <p className="text-sm text-muted-foreground">
                            {brandSoftware.length} producto{brandSoftware.length !== 1 ? 's' : ''} disponible{brandSoftware.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={24} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={24} className="text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {brandSoftware.map((software) => {
                            const quantityInCart = getItemQuantity(software.id, 'software');
                            const isInCart = quantityInCart > 0;

                            return (
                              <Card key={software.id} className={cn("relative", isInCart && "ring-2 ring-primary")}>
                                <CardContent className="p-4">
                                  {/* Product image */}
                                  {software.img_url && (
                                    <div className="mb-3 aspect-video rounded overflow-hidden bg-muted">
                                      <img 
                                        src={software.img_url} 
                                        alt={software.descripcion} 
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="mb-3">
                                    <Badge variant="outline" className="text-xs mb-2">
                                      {software.clave}
                                    </Badge>
                                    <h4 className="font-semibold text-foreground mb-1">{software.descripcion}</h4>
                                    {software.detalles && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">{software.detalles}</p>
                                    )}
                                    {(software.detalles || software.descripcion.length > 60) && (
                                      <button
                                        onClick={() => setDetailSoftware(software)}
                                        className="text-sm text-primary hover:underline mt-1 flex items-center gap-1"
                                      >
                                        <Eye size={14} />
                                        Ver más
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between mb-3">
                                    {software.precio > 0 ? (
                                      <span className="text-lg font-bold text-primary">
                                        {formatPrice(software.precio)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Consultar precio</span>
                                    )}
                                  </div>

                                  {!isInCart ? (
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleAddToCart(software)}
                                        className="flex-1"
                                        size="sm"
                                      >
                                        <ShoppingCart size={16} className="mr-2" />
                                        Agregar
                                      </Button>
                                      <Button
                                        onClick={() => handleWhatsAppClick(software)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <MessageCircle size={16} />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        onClick={() => handleDecrement(software)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Minus size={16} />
                                      </Button>
                                      <span className="flex-1 text-center font-semibold">{quantityInCart}</span>
                                      <Button
                                        onClick={() => handleIncrement(software)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Plus size={16} />
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Detail dialog */}
      <Dialog open={!!detailSoftware} onOpenChange={(open) => !open && setDetailSoftware(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailSoftware?.descripcion}</DialogTitle>
          </DialogHeader>
          {detailSoftware && (
            <div className="space-y-4">
              {detailSoftware.img_url && (
                <div className="aspect-video rounded overflow-hidden bg-muted">
                  <img src={detailSoftware.img_url} alt={detailSoftware.descripcion} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <Badge variant="outline" className="mb-2">{detailSoftware.clave}</Badge>
                <p className="text-sm font-medium text-muted-foreground mb-1">Marca: {detailSoftware.marca}</p>
              </div>
              {detailSoftware.detalles && (
                <div>
                  <h4 className="font-semibold mb-1">Detalles</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailSoftware.detalles}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                {detailSoftware.precio > 0 ? (
                  <span className="text-xl font-bold text-primary">{formatPrice(detailSoftware.precio)}</span>
                ) : (
                  <span className="text-muted-foreground">Consultar precio</span>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => { handleAddToCart(detailSoftware); setDetailSoftware(null); }} size="sm">
                    <ShoppingCart size={16} className="mr-2" />
                    Agregar
                  </Button>
                  <Button onClick={() => handleWhatsAppClick(detailSoftware)} variant="outline" size="sm">
                    <MessageCircle size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SoftwareESDPage;
