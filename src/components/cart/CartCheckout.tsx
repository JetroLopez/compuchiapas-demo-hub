import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, MessageCircle, Store, Truck, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartCheckoutProps {
  onBack: () => void;
  onOrderComplete: (result: { orderNumber: number; deliveryMethod: 'pickup' | 'delivery' | null; paymentMethod: 'cash' | 'transfer' }) => void;
  requiresQuote: boolean;
}

const CartCheckout: React.FC<CartCheckoutProps> = ({ onBack, onOrderComplete, requiresQuote }) => {
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null);
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

  const handleSubmitOrder = async () => {
    if (!phone.trim()) {
      toast({
        title: "Teléfono requerido",
        description: "Por favor ingresa tu número de teléfono de contacto",
        variant: "destructive"
      });
      return;
    }

    if (!requiresQuote && !paymentMethod) {
      toast({
        title: "Método de pago requerido",
        description: "Por favor selecciona un método de pago",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'cash' && !deliveryMethod) {
      toast({
        title: "Método de entrega requerido",
        description: "Por favor selecciona pickup o entrega a domicilio",
        variant: "destructive"
      });
      return;
    }

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

      const { data, error } = await supabase
        .from('web_orders')
        .insert({
          phone: phone.trim(),
          payment_method: paymentMethod || 'cash',
          delivery_method: deliveryMethod,
          items: orderItems,
          subtotal: subtotal,
          requires_quote: requiresQuote,
          billing_data: formatBillingData()
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

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error al crear pedido",
        description: "Hubo un problema al procesar tu pedido. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If requires quote, show simplified version
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

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Volver al carrito
        </Button>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Método de pago</Label>
          <RadioGroup 
            value={paymentMethod || ''} 
            onValueChange={(v) => {
              setPaymentMethod(v as 'cash' | 'transfer');
              if (v === 'transfer') setDeliveryMethod(null);
            }}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer flex-1">Efectivo contra entrega</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer" className="cursor-pointer flex-1">Transferencia electrónica</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Phone Number */}
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

        {/* Delivery Method - Only for cash */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Método de entrega</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setDeliveryMethod('pickup')}
              >
                <Store size={24} />
                <span>Pickup en tienda</span>
              </Button>
              <Button
                variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setDeliveryMethod('delivery')}
              >
                <Truck size={24} />
                <span>Entrega a domicilio</span>
              </Button>
            </div>
          </div>
        )}

        {/* Billing Checkbox */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="billing" 
              checked={wantsBilling} 
              onCheckedChange={(checked) => setWantsBilling(checked === true)}
            />
            <Label htmlFor="billing" className="cursor-pointer">Deseo facturar</Label>
          </div>

          {wantsBilling && (
            <div className="space-y-3 pl-6 border-l-2">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  value={billingData.razonSocial}
                  onChange={(e) => setBillingData(prev => ({ ...prev, razonSocial: e.target.value }))}
                  maxLength={150}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={billingData.rfc}
                  onChange={(e) => setBillingData(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                  maxLength={13}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp">Código Postal</Label>
                <Input
                  id="cp"
                  value={billingData.codigoPostal}
                  onChange={(e) => setBillingData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regimen">Régimen Fiscal</Label>
                <Input
                  id="regimen"
                  value={billingData.regimenFiscal}
                  onChange={(e) => setBillingData(prev => ({ ...prev, regimenFiscal: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfdi">Uso de CFDI</Label>
                <Input
                  id="cfdi"
                  value={billingData.usoCfdi}
                  onChange={(e) => setBillingData(prev => ({ ...prev, usoCfdi: e.target.value }))}
                  maxLength={50}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
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
