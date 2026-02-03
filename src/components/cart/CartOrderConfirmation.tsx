import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, MapPin, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartOrderConfirmationProps {
  orderNumber: number;
  deliveryMethod: 'pickup' | 'delivery' | null;
  paymentMethod: 'cash' | 'transfer';
  onClose: () => void;
}

const CartOrderConfirmation: React.FC<CartOrderConfirmationProps> = ({
  orderNumber,
  deliveryMethod,
  paymentMethod,
  onClose
}) => {
  const { toast } = useToast();
  const whatsappNumber = "9622148546";
  const googleMapsUrl = "https://maps.google.com/?q=Compusistemas+de+Chiapas";

  const bankDetails = {
    banco: 'Bancomer',
    sucursal: '544',
    cuenta: '0132358026',
    clabe: '012133001323580268',
    beneficiario: 'Compusistemas de Chiapas S.A. de C.V.'
  };

  const handleCopyClabe = () => {
    navigator.clipboard.writeText(bankDetails.clabe);
    toast({
      title: "CLABE copiada",
      description: "La CLABE ha sido copiada al portapapeles"
    });
  };

  const handleWhatsApp = () => {
    const message = `Hola, acabo de realizar un pedido desde la web #${orderNumber}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle size={64} className="text-green-500" />
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">¡Pedido Recibido!</h3>
        <p className="text-2xl font-bold text-primary">#{orderNumber}</p>
      </div>

      {paymentMethod === 'cash' && (
        <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
          {deliveryMethod === 'pickup' ? (
            <p className="text-sm">
              Tu pedido <strong>#{orderNumber}</strong> ha sido recibido y puedes pasar por él a{' '}
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline font-medium"
              >
                tienda
              </a>.
            </p>
          ) : (
            <p className="text-sm">
              Tu pedido <strong>#{orderNumber}</strong> ha sido recibido y en breve nos comunicaremos contigo vía WhatsApp para definir ubicación y tiempo de entrega.
            </p>
          )}
        </div>
      )}

      {paymentMethod === 'transfer' && (
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
            <p className="font-semibold mb-3">Datos bancarios para transferencia:</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Banco:</span> {bankDetails.banco}, sucursal {bankDetails.sucursal}</p>
              <p><span className="text-muted-foreground">Cuenta:</span> {bankDetails.cuenta}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">CLABE:</span> 
                <span className="font-mono">{bankDetails.clabe}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyClabe}>
                  <Copy size={14} />
                </Button>
              </div>
              <p className="font-medium pt-2">{bankDetails.beneficiario}</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Es necesario que mandes tu comprobante de transferencia vía WhatsApp
            </p>
          </div>

          <Button 
            className="w-full bg-green-500 hover:bg-green-600" 
            size="lg"
            onClick={handleWhatsApp}
          >
            <MessageCircle size={18} className="mr-2" />
            Enviar mensaje
          </Button>
        </div>
      )}

      <div className="pt-4 border-t">
        <button 
          onClick={handleWhatsApp}
          className="text-sm text-primary hover:underline"
        >
          Quiero hablar con un asesor de ventas sobre mi pedido
        </button>
      </div>

      <Button variant="outline" className="w-full" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );
};

export default CartOrderConfirmation;
