import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MessageCircle, Store, Truck, Loader2, MapPin, Globe, CreditCard, Banknote, Building2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CartCheckoutProps {
  onBack: () => void;
  onOrderComplete: (result: { orderNumber: number; deliveryMethod: 'pickup' | 'delivery' | null; paymentMethod: string }) => void;
  requiresQuote: boolean;
}

type DeliveryMethod = 'pickup' | 'delivery';
type ShippingZone = 'local' | 'foraneo';
type PaymentMethod = 'cash' | 'card' | 'transfer';

const CartCheckout: React.FC<CartCheckoutProps> = ({ onBack, onOrderComplete, requiresQuote }) => {
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [shippingZone, setShippingZone] = useState<ShippingZone | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState('');
  const [wantsBilling, setWantsBilling] = useState(false);
  const [billingData, setBillingData] = useState({
    razonSocial: '',
    rfc: '',
    codigoPostal: '',
    regimenFiscal: '',
    usoCfdi: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappNumber = "9622148546";

  // Derived state
  const showShippingZone = deliveryMethod === 'delivery';
  const showPaymentOptions = deliveryMethod === 'pickup' || (deliveryMethod === 'delivery' && shippingZone !== null);
  const showContactSection = showPaymentOptions && paymentMethod !== null;
  const canSubmit = showContactSection && phone.trim().length > 0 && !isSubmitting;

  const handleDeliveryChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    setShippingZone(null);
    setPaymentMethod(null);
  };

  const handleShippingZoneChange = (zone: ShippingZone) => {
    setShippingZone(zone);
    setPaymentMethod(null);
  };

  const getPaymentOptions = (): { value: PaymentMethod; label: string; icon: React.ReactNode }[] => {
    if (deliveryMethod === 'pickup') {
      return [
        { value: 'cash', label: 'Efectivo', icon: <Banknote size={16} /> },
        { value: 'card', label: 'Tarjeta de crédito o débito', icon: <CreditCard size={16} /> },
        { value: 'transfer', label: 'Transferencia electrónica', icon: <Building2 size={16} /> },
      ];
    }
    if (deliveryMethod === 'delivery' && shippingZone === 'local') {
      return [
        { value: 'cash', label: 'Efectivo contra entrega', icon: <Banknote size={16} /> },
        { value: 'transfer', label: 'Transferencia electrónica', icon: <Building2 size={16} /> },
      ];
    }
    if (deliveryMethod === 'delivery' && shippingZone === 'foraneo') {
      return [
        { value: 'transfer', label: 'Transferencia electrónica', icon: <Building2 size={16} /> },
      ];
    }
    return [];
  };

  const handleQuoteWhatsApp = () => {
    const productList = items.map(item =>
      `- ${item.name} (${item.quantity} pza${item.quantity > 1 ? 's' : ''})`
    ).join('\n');
    const message = `Hola, me gustaría cotizar los siguientes productos:\n\n${productList}\n\n¿Podrían darme información de precios y disponibilidad?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatBillingData = () => {
    if (!wantsBilling) return null;
    return `Razón Social: ${billingData.razonSocial}\nRFC: ${billingData.rfc}\nCódigo Postal: ${billingData.codigoPostal}\nRégimen Fiscal: ${billingData.regimenFiscal}\nUso de CFDI: ${billingData.usoCfdi}`;
  };

  const getShippingOption = (): string | null => {
    if (deliveryMethod !== 'delivery') return null;
    if (shippingZone === 'local') return 'Dentro de la ciudad (Tapachula)';
    if (shippingZone === 'foraneo') return 'Foráneo (Cd. Hidalgo, Huixtla, Mazatán, Tuxtla Chico, otro)';
    return null;
  };

  const handleSubmitOrder = async () => {
    if (!canSubmit) return;

    if (wantsBilling) {
      if (!billingData.razonSocial || !billingData.rfc || !billingData.codigoPostal || !billingData.regimenFiscal || !billingData.usoCfdi) {
        toast({
          title: "Datos de facturación incompletos",
          description: "Por favor completa todos los campos de facturación",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        product_id: item.type === 'product' ? item.id : null,
        promotion_id: item.type === 'promotion' ? item.id : null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image_url: item.image_url,
        clave: item.clave
      }));

      const paymentLabels: Record<string, string> = {
        cash: deliveryMethod === 'delivery' ? 'Efectivo contra entrega' : 'Efectivo',
        card: 'Tarjeta de crédito o débito',
        transfer: 'Transferencia electrónica',
      };

      const { data, error } = await supabase
        .from('web_orders')
        .insert({
          phone: phone.trim(),
          payment_method: paymentLabels[paymentMethod || 'cash'] || paymentMethod || 'cash',
          delivery_method: deliveryMethod === 'pickup' ? 'Pickup en tienda' : 'Entrega a domicilio',
          items: orderItems as unknown as import('@/integrations/supabase/types').Json,
          subtotal: subtotal,
          requires_quote: requiresQuote,
          billing_data: formatBillingData(),
          shipping_option: getShippingOption()
        })
        .select('order_number')
        .single();

      if (error) throw error;

      clearCart();
      onOrderComplete({
        orderNumber: data.order_number,
        deliveryMethod: deliveryMethod,
        paymentMethod: paymentMethod || 'cash'
      });
    } catch (error: any) {
      const pgCode = error?.code || 'UNKNOWN';
      const isRLS = pgCode === '42501' || error?.message?.includes('row-level security');
      const isNetwork = error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError');
      const isTimeout = error?.message?.includes('timeout') || pgCode === '57014';

      let errorCode = 'ERR-ORDER-000';
      let errorDesc = 'Error desconocido. Intenta nuevamente.';

      if (isRLS) {
        errorCode = 'ERR-ORDER-403';
        errorDesc = 'Permiso denegado al crear el pedido. Contacta soporte.';
      } else if (isNetwork) {
        errorCode = 'ERR-ORDER-NET';
        errorDesc = 'Sin conexión a internet. Verifica tu red e intenta de nuevo.';
      } else if (isTimeout) {
        errorCode = 'ERR-ORDER-TMO';
        errorDesc = 'El servidor tardó demasiado. Intenta en unos momentos.';
      } else if (pgCode === '23505') {
        errorCode = 'ERR-ORDER-DUP';
        errorDesc = 'Pedido duplicado detectado. Verifica tus pedidos anteriores.';
      } else if (pgCode === '23502') {
        errorCode = 'ERR-ORDER-VAL';
        errorDesc = 'Faltan datos obligatorios en el pedido.';
      }

      console.error(`[${errorCode}] Error creating order:`, error);
      toast({
        title: `Error al crear pedido (${errorCode})`,
        description: errorDesc,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quote-only mode
  if (requiresQuote) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Volver al carrito
          </Button>
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Cotización Requerida</h3>
            <p className="text-muted-foreground text-sm">
              Algunos productos de tu carrito no tienen precio disponible. Contáctanos para obtener una cotización personalizada.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Productos a cotizar:</p>
              <ul className="text-sm text-left space-y-1">
                {items.map(item => (
                  <li key={`${item.type}-${item.id}`}>
                    • {item.name} ({item.quantity} pza{item.quantity > 1 ? 's' : ''})
                  </li>
                ))}
              </ul>
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              size="lg"
              onClick={handleQuoteWhatsApp}
            >
              <MessageCircle size={18} className="mr-2" />
              Cotizar por WhatsApp
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  const paymentOptions = getPaymentOptions();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Volver al carrito
        </Button>

        {/* Step 1: Delivery Method */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Método de entrega</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDeliveryChange('pickup')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                deliveryMethod === 'pickup'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <Store size={24} className={deliveryMethod === 'pickup' ? 'text-primary' : 'text-muted-foreground'} />
              <span className={cn("text-sm font-medium", deliveryMethod === 'pickup' ? 'text-primary' : 'text-muted-foreground')}>
                Pickup en tienda
              </span>
            </button>
            <button
              onClick={() => handleDeliveryChange('delivery')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                deliveryMethod === 'delivery'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <Truck size={24} className={deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground'} />
              <span className={cn("text-sm font-medium", deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground')}>
                Entrega a domicilio
              </span>
            </button>
          </div>
        </div>

        {/* Step 1b: Shipping Zone (if delivery) */}
        {showShippingZone && (
          <div className="space-y-3 pl-3 border-l-2 border-primary/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label className="text-sm font-semibold">Zona de envío</Label>
            <div className="space-y-2">
              <button
                onClick={() => handleShippingZoneChange('local')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  shippingZone === 'local'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <MapPin size={16} className={shippingZone === 'local' ? 'text-primary' : 'text-muted-foreground'} />
                <span className="text-sm">Dentro de la ciudad (Tapachula)</span>
              </button>
              <button
                onClick={() => handleShippingZoneChange('foraneo')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  shippingZone === 'foraneo'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <Globe size={16} className={shippingZone === 'foraneo' ? 'text-primary' : 'text-muted-foreground'} />
                <span className="text-sm">Foráneo (Cd. Hidalgo, Huixtla, Mazatán, Tuxtla Chico, otro...)</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              ⚠️ El envío puede tener costo adicional.
            </p>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {showPaymentOptions && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label className="text-sm font-semibold">Método de pago</Label>
            <div className="space-y-2">
              {paymentOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    paymentMethod === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <span className={paymentMethod === opt.value ? 'text-primary' : 'text-muted-foreground'}>{opt.icon}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Transfer info */}
            {paymentMethod === 'transfer' && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-sm font-semibold">Datos para transferencia (BBVA Bancomer)</p>
                <div className="text-sm space-y-1">
                  <p>Cuenta: <span className="font-mono font-medium">0132358026</span></p>
                  <p>CLABE: <span className="font-mono font-medium">012133001323580268</span></p>
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, ya realicé mi transferencia para mi pedido.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium mt-1"
                >
                  <MessageCircle size={14} />
                  Enviar comprobante por WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Contact & Billing */}
        {showContactSection && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="phone">Número telefónico de contacto (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 961 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="billing"
                  checked={wantsBilling}
                  onCheckedChange={(checked) => setWantsBilling(checked === true)}
                />
                <Label htmlFor="billing" className="cursor-pointer">¿Deseo facturar?</Label>
              </div>

              {wantsBilling && (
                <div className="space-y-3 pl-6 border-l-2 border-muted animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social</Label>
                    <Input id="razonSocial" value={billingData.razonSocial} onChange={(e) => setBillingData(prev => ({ ...prev, razonSocial: e.target.value }))} maxLength={150} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input id="rfc" value={billingData.rfc} onChange={(e) => setBillingData(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))} maxLength={13} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cp">Código Postal</Label>
                    <Input id="cp" value={billingData.codigoPostal} onChange={(e) => setBillingData(prev => ({ ...prev, codigoPostal: e.target.value }))} maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regimen">Régimen Fiscal</Label>
                    <Input id="regimen" value={billingData.regimenFiscal} onChange={(e) => setBillingData(prev => ({ ...prev, regimenFiscal: e.target.value }))} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfdi">Uso de CFDI</Label>
                    <Input id="cfdi" value={billingData.usoCfdi} onChange={(e) => setBillingData(prev => ({ ...prev, usoCfdi: e.target.value }))} maxLength={50} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmitOrder}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            'Realizar mi pedido'
          )}
        </Button>
      </div>
    </ScrollArea>
  );
};

export default CartCheckout;
