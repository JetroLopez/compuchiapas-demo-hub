import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, FileText, Copy, Check, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  QuotationItem,
  formatCurrency,
  calculateSubtotal,
  calculateTotal,
  generateWhatsAppText,
  copyToClipboard,
  printQuotation,
} from '@/lib/quotation-export';

const GeneralQuotation: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-quotation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, clave, category_id')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return products
      .filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.clave?.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [products, searchTerm]);

  const addItem = (product: { id: string; name: string; clave?: string | null }) => {
    // Check if already in list
    if (items.some(item => item.id === product.id)) {
      // Increment quantity instead
      setItems(items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        id: product.id,
        name: product.name,
        clave: product.clave || undefined,
        quantity: 1,
        price: 0,
      }]);
    }
    setSearchTerm('');
  };

  const updateItem = (id: string, field: 'quantity' | 'price', value: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleCopyWhatsApp = async () => {
    if (items.length === 0) {
      toast({
        title: 'Sin productos',
        description: 'Agrega al menos un producto a la cotización',
        variant: 'destructive',
      });
      return;
    }

    const text = generateWhatsAppText({
      clientName: clientName || undefined,
      items,
      notes: notes || undefined,
      validityDays: 7,
    });

    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copiado',
      description: 'Texto copiado al portapapeles',
    });
  };

  const handlePrint = () => {
    if (items.length === 0) {
      toast({
        title: 'Sin productos',
        description: 'Agrega al menos un producto a la cotización',
        variant: 'destructive',
      });
      return;
    }

    printQuotation({
      clientName: clientName || undefined,
      items,
      notes: notes || undefined,
      validityDays: 7,
    });
  };

  const handleClear = () => {
    setItems([]);
    setClientName('');
    setNotes('');
    setSearchTerm('');
  };

  const total = calculateTotal(items);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Search and Add Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Buscar Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Buscar por nombre o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Search Results */}
          {filteredProducts.length > 0 && (
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-muted/50 flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() => addItem(product)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{product.name}</p>
                    {product.clave && (
                      <p className="text-xs text-muted-foreground">{product.clave}</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchTerm && filteredProducts.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-4">
              No se encontraron productos
            </p>
          )}

          {/* Client Info */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="clientName">Nombre del cliente (opcional)</Label>
              <Input
                id="clientName"
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones, condiciones, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText size={20} />
              Cotización
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpiar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Busca y agrega productos a la cotización
            </p>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-tight">{item.name}</p>
                        {item.clave && (
                          <p className="text-xs text-muted-foreground">{item.clave}</p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Subtotal</Label>
                        <div className="h-8 flex items-center font-medium text-sm">
                          {formatCurrency(calculateSubtotal(item))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyWhatsApp}
                >
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar para WhatsApp'}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handlePrint}
                >
                  <Printer size={16} className="mr-2" />
                  Imprimir PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralQuotation;
