import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderResult {
  folio_ingreso: string | null;
  folio_servicio: string | null;
  remision: string | null;
  estatus: string;
  fecha_aprox_entrega: string | null;
  producto: string;
}

const OrderStatusSearch: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Por favor ingresa un número de folio o remisión');
      return;
    }

    setIsSearching(true);
    setOrderResult(null);
    setNotFound(false);

    try {
      // Buscar por folio_ingreso, remision o folio_servicio
      const { data, error } = await supabase
        .from('special_orders')
        .select('folio_ingreso, folio_servicio, remision, estatus, fecha_aprox_entrega, producto')
        .or(`folio_ingreso.ilike.%${searchTerm.trim()}%,remision.ilike.%${searchTerm.trim()}%,folio_servicio.ilike.%${searchTerm.trim()}%`)
        .limit(1)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        // Si el estatus es "Entregado", lo tratamos como no encontrado (pedido ya no pendiente)
        if (data.estatus === 'Entregado') {
          setNotFound(true);
        } else {
          setOrderResult(data);
        }
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusDisplay = (estatus: string) => {
    if (estatus === 'Notificado con Esdras') {
      return 'en proceso';
    }
    if (estatus === 'Pedido') {
      return 'pedido y en camino';
    }
    if (estatus === 'En tienda') {
      return 'en tienda y puede pasar a recogerlo';
    }
    return estatus.toLowerCase();
  };

  const isInStore = (estatus: string) => estatus === 'En tienda';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-0">
        {/* Clickable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">¿Tienes un pedido con nosotros?</h3>
              <p className="text-sm text-muted-foreground">Click aquí para conocer su estatus</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Expandable Content */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-6 pb-6 space-y-4 border-t">
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Ingresa tu número de folio de ingreso, folio de servicio o remisión para consultar el estatus de tu pedido:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Número de folio o remisión"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Result Display */}
            {orderResult && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200">
                  Tu pedido con folio{' '}
                  <span className="font-bold">
                    #{orderResult.folio_ingreso || orderResult.folio_servicio || orderResult.remision}
                  </span>{' '}
                  se encuentra{' '}
                  <span className="font-bold">{getStatusDisplay(orderResult.estatus)}</span>
                  {!isInStore(orderResult.estatus) && orderResult.fecha_aprox_entrega && (
                    <>
                      {' '}y tiene como fecha estimada de entrega el día{' '}
                      <span className="font-bold">{formatDate(orderResult.fecha_aprox_entrega)}</span>
                    </>
                  )}
                  .
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Producto: {orderResult.producto}
                </p>
              </div>
            )}

            {notFound && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                  No se encuentra ningún pedido pendiente. Verifica tu folio de ingreso, de servicio o remisión.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusSearch;
