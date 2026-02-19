import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Download, ShoppingCart, Plus, Minus, MessageCircle, Eye, X } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
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
  display_order: number | null;
}

const SoftwareESDPage: React.FC = () => {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [detailSoftware, setDetailSoftware] = useState<SoftwareESD | null>(null);
  const productsRef = React.useRef<HTMLDivElement>(null);

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

  const { data: brands = [] } = useQuery({
    queryKey: ['software-esd-brands'],
    queryFn: async (): Promise<SoftwareBrand[]> => {
      const { data, error } = await (supabase
        .from('software_esd_brands')
        .select('*')
        .order('display_order', { ascending: true }) as any);
      if (error) throw error;
      return data || [];
    },
  });

  const brandImageMap = React.useMemo(() => {
    const map = new Map<string, string | null>();
    (brands as SoftwareBrand[]).forEach(b => map.set(b.name, b.image_url));
    return map;
  }, [brands]);

  // Group by brand
  const softwareByBrand = React.useMemo(() => {
    const grouped: Record<string, SoftwareESD[]> = {};
    softwareList.forEach(item => {
      if (!grouped[item.marca]) grouped[item.marca] = [];
      grouped[item.marca].push(item);
    });
    return grouped;
  }, [softwareList]);

  // Brand names ordered by display_order from brands table, then alphabetically for any not in brands table
  const brandNames = React.useMemo(() => {
    const allBrandNames = Object.keys(softwareByBrand);
    const orderedFromDb = (brands as SoftwareBrand[]).map(b => b.name).filter(n => allBrandNames.includes(n));
    const remaining = allBrandNames.filter(n => !orderedFromDb.includes(n)).sort();
    return [...orderedFromDb, ...remaining];
  }, [softwareByBrand, brands]);

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
    toast({ title: "Agregado al carrito", description: `${software.descripcion} agregado correctamente` });
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
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

      {/* Brand Cards Grid */}
      <section className="py-10 bg-background">
        <div className="container-padding max-w-7xl mx-auto">
          {brandNames.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No hay software disponible en este momento.</p>
            </div>
          ) : (
            <>
              {/* Brand selector grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {brandNames.map((brand) => {
                  const brandImage = brandImageMap.get(brand);
                  const productCount = softwareByBrand[brand]?.length || 0;
                  const isSelected = expandedBrand === brand;

                  return (
                    <motion.div
                      key={brand}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                          isSelected
                            ? "border-primary shadow-lg ring-2 ring-primary/20"
                            : "border-transparent hover:border-primary/30"
                        )}
                        onClick={() => {
                          const newBrand = isSelected ? null : brand;
                          setExpandedBrand(newBrand);
                          if (newBrand) {
                            setTimeout(() => {
                              productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 400);
                          }
                        }}
                      >
                        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-3">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center overflow-hidden bg-muted">
                            {brandImage ? (
                              <img src={brandImage} alt={brand} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Download size={28} className="text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-sm md:text-base">{brand}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {productCount} producto{productCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Expanded brand products */}
              <AnimatePresence mode="wait">
                {expandedBrand && softwareByBrand[expandedBrand] && (
                  <motion.div
                    key={expandedBrand}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="overflow-hidden"
                    ref={productsRef}
                  >
                    <div className="border rounded-xl p-4 md:p-6 bg-card mb-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {brandImageMap.get(expandedBrand) ? (
                              <img src={brandImageMap.get(expandedBrand)!} alt={expandedBrand} className="w-full h-full object-contain" />
                            ) : (
                              <Download size={20} className="text-primary" />
                            )}
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-foreground">{expandedBrand}</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setExpandedBrand(null)}>
                          <X size={20} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {softwareByBrand[expandedBrand].map((software) => {
                          const quantityInCart = getItemQuantity(software.id, 'software');
                          const isInCart = quantityInCart > 0;

                          return (
                            <motion.div
                              key={software.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <Card className={cn("relative h-full", isInCart && "ring-2 ring-primary")}>
                                <CardContent className="p-4">
                                  {software.img_url && (
                                    <div className="mb-3 aspect-video rounded-lg overflow-hidden bg-white">
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
                                      <Button onClick={() => handleAddToCart(software)} className="flex-1" size="sm">
                                        <ShoppingCart size={16} className="mr-2" />
                                        Agregar
                                      </Button>
                                      <Button onClick={() => handleWhatsAppClick(software)} variant="outline" size="sm">
                                        <MessageCircle size={16} />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button onClick={() => handleDecrement(software)} variant="outline" size="sm">
                                        <Minus size={16} />
                                      </Button>
                                      <span className="flex-1 text-center font-semibold">{quantityInCart}</span>
                                      <Button onClick={() => handleIncrement(software)} variant="outline" size="sm">
                                        <Plus size={16} />
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
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
                <div className="aspect-video rounded-lg overflow-hidden bg-white">
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
