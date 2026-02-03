import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/price-utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  product_id: string | null;
  promotion_id: string | null;
  name: string;
  quantity: number;
  price: number | null;
  image_url: string | null;
  clave: string | null;
}

interface WebOrder {
  id: string;
  order_number: number;
  phone: string;
  payment_method: string;
  delivery_method: string | null;
  items: OrderItem[];
  subtotal: number | null;
  requires_quote: boolean;
  billing_data: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia'
};

const deliveryLabels: Record<string, string> = {
  pickup: 'Pickup en tienda',
  delivery: 'Entrega a domicilio'
};

const AdminWebOrders: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<WebOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['web-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('web_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(order => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || []
      })) as WebOrder[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('web_orders')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-orders'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido ha sido actualizado"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleWhatsApp = (phone: string, orderNumber: number) => {
    const message = `Hola, te contactamos de Compuchiapas respecto a tu pedido #${orderNumber}`;
    window.open(`https://wa.me/52${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos Web</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"># Pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay pedidos
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">#{order.order_number}</TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>{paymentLabels[order.payment_method] || order.payment_method}</TableCell>
                  <TableCell>
                    {order.delivery_method ? deliveryLabels[order.delivery_method] : '-'}
                  </TableCell>
                  <TableCell>
                    {order.requires_quote ? (
                      <Badge variant="outline">Cotización</Badge>
                    ) : (
                      formatPrice(order.subtotal || 0)
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={order.status} 
                      onValueChange={(v) => handleStatusChange(order.id, v)}
                    >
                      <SelectTrigger className={`w-[130px] ${statusColors[order.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-green-600"
                      onClick={() => handleWhatsApp(order.phone, order.order_number)}
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Método de pago</p>
                    <p className="font-medium">{paymentLabels[selectedOrder.payment_method]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entrega</p>
                    <p className="font-medium">
                      {selectedOrder.delivery_method ? deliveryLabels[selectedOrder.delivery_method] : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Productos</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-2 bg-muted/50 rounded-lg">
                        <img 
                          src={item.image_url || '/placeholder.svg'} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.clave && (
                            <p className="text-xs text-muted-foreground">Clave: {item.clave}</p>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>Cantidad: {item.quantity}</span>
                            {item.price ? (
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                            ) : (
                              <span className="text-muted-foreground">Sin precio</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!selectedOrder.requires_quote && (
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                  </div>
                )}

                {selectedOrder.billing_data && (
                  <div className="border-t pt-4">
                    <p className="font-semibold mb-2">Datos de Facturación</p>
                    <pre className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {selectedOrder.billing_data}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWebOrders;
