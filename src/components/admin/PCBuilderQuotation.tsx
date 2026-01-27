import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Monitor, AlertTriangle, CheckCircle, Copy, Printer, Check, Zap, Trash2, Plus, Search, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePCBuilderCompatibility } from '@/hooks/useCompatibility';
import {
  PCBuild,
  ProductWithSpec,
  COMPONENT_LABELS,
  COMPONENT_ICONS,
} from '@/lib/compatibility-rules';
import {
  QuotationPricingItem,
  calculateSuggestedPrice,
  calculatePricingBreakdown,
  prorateItemPrices,
  formatCurrency,
} from '@/lib/quotation-pricing';
import { copyToClipboard } from '@/lib/quotation-export';
import ComponentSelector from './ComponentSelector';

const COMPONENT_ORDER: (keyof PCBuild)[] = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'];
const OPTIONAL_COMPONENTS: (keyof PCBuild)[] = ['cooling'];

interface AdditionalItem {
  id: string;
  name: string;
  clave?: string;
  categoryId?: string | null;
  costo: number;
  quantity: number;
  price: number;
  existencias?: number;
}

const PCBuilderQuotation: React.FC = () => {
  const { toast } = useToast();
  const [build, setBuild] = useState<PCBuild>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [ramQuantity, setRamQuantity] = useState(1);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [editableTotal, setEditableTotal] = useState<number | null>(null);
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const compatibility = usePCBuilderCompatibility(build);

  // Fetch all products for additional items (paginated to get all)
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products-quotation'],
    queryFn: async () => {
      const allData: Array<{
        id: string;
        name: string;
        clave: string | null;
        category_id: string | null;
        costo: number | null;
        existencias: number | null;
      }> = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, clave, category_id, costo, existencias')
          .eq('is_active', true)
          .order('name')
          .range(offset, offset + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData.push(...data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allData;
    },
  });

  // Calculate max RAM quantity based on motherboard slots and stock
  const maxRamQuantity = useMemo(() => {
    const ramProduct = build.ram;
    if (!ramProduct) return 1;
    
    const moboSlots = build.motherboard?.spec?.ram_slots || 4;
    const ramModules = ramProduct.spec?.ram_modules || 1;
    const maxBySlots = Math.floor(moboSlots / ramModules);
    
    const ramStock = (ramProduct as any).existencias || 999;
    
    return Math.max(1, Math.min(maxBySlots, ramStock));
  }, [build.ram, build.motherboard]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const term = productSearch.toLowerCase();
    return allProducts
      .filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.clave?.toLowerCase().includes(term)
      )
      .slice(0, 15);
  }, [allProducts, productSearch]);

  const handleSelectComponent = (type: keyof PCBuild, product: ProductWithSpec | null) => {
    setBuild(prev => ({ ...prev, [type]: product }));
    if (product) {
      // Auto-set price from costo
      const suggestedPrice = calculateSuggestedPrice(
        (product as any).costo || 0,
        product.category_id
      );
      setPrices(prev => ({ ...prev, [product.id]: prev[product.id] || suggestedPrice }));
    }
    // Reset RAM quantity when RAM is changed
    if (type === 'ram') {
      setRamQuantity(1);
    }
    setEditableTotal(null); // Reset editable total when components change
  };

  const handlePriceChange = (productId: string, price: number) => {
    setPrices(prev => ({ ...prev, [productId]: price }));
    setEditableTotal(null);
  };

  const handleRamQuantityChange = (qty: number) => {
    const validQty = Math.max(1, Math.min(qty, maxRamQuantity));
    setRamQuantity(validQty);
    setEditableTotal(null);
  };

  const handleAddAdditionalItem = (product: typeof allProducts[0]) => {
    const existing = additionalItems.find(item => item.id === product.id);
    if (existing) {
      setAdditionalItems(prev =>
        prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const suggestedPrice = calculateSuggestedPrice(product.costo || 0, product.category_id);
      setAdditionalItems(prev => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          clave: product.clave || undefined,
          categoryId: product.category_id,
          costo: product.costo || 0,
          quantity: 1,
          price: suggestedPrice,
        },
      ]);
    }
    setProductSearch('');
    setEditableTotal(null);
  };

  const handleUpdateAdditionalItem = (id: string, field: 'quantity' | 'price', value: number) => {
    setAdditionalItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setEditableTotal(null);
  };

  const handleRemoveAdditionalItem = (id: string) => {
    setAdditionalItems(prev => prev.filter(item => item.id !== id));
    setEditableTotal(null);
  };

  const handleClear = () => {
    setBuild({});
    setPrices({});
    setRamQuantity(1);
    setAdditionalItems([]);
    setClientName('');
    setNotes('');
    setEditableTotal(null);
  };

  // Build pricing items from components + additional items
  const getAllPricingItems = (): QuotationPricingItem[] => {
    const items: QuotationPricingItem[] = [];
    
    // Components
    [...COMPONENT_ORDER, ...OPTIONAL_COMPONENTS].forEach(type => {
      const product = build[type];
      if (product) {
        // RAM can have quantity > 1
        const qty = type === 'ram' ? ramQuantity : 1;
        items.push({
          id: product.id,
          name: product.name,
          clave: product.clave || undefined,
          categoryId: product.category_id,
          quantity: qty,
          costo: (product as any).costo || 0,
          precioEditado: prices[product.id] || 0,
        });
      }
    });
    
    // Additional items
    additionalItems.forEach(item => {
      items.push({
        id: item.id,
        name: item.name,
        clave: item.clave,
        categoryId: item.categoryId,
        quantity: item.quantity,
        costo: item.costo,
        precioEditado: item.price,
      });
    });
    
    return items;
  };

  const pricingItems = getAllPricingItems();
  const breakdown = calculatePricingBreakdown(pricingItems);
  const displayTotal = editableTotal !== null ? editableTotal : breakdown.total;

  const handleTotalChange = (newTotal: number) => {
    setEditableTotal(newTotal);
  };

  const handleApplyProration = () => {
    if (editableTotal === null || editableTotal === breakdown.total) return;
    
    const proratedItems = prorateItemPrices(pricingItems, editableTotal);
    
    // Update prices for components
    const newPrices = { ...prices };
    [...COMPONENT_ORDER, ...OPTIONAL_COMPONENTS].forEach(type => {
      const product = build[type];
      if (product) {
        const proratedItem = proratedItems.find(i => i.id === product.id);
        if (proratedItem) {
          newPrices[product.id] = proratedItem.precioEditado;
        }
      }
    });
    setPrices(newPrices);
    
    // Update prices for additional items
    setAdditionalItems(prev =>
      prev.map(item => {
        const proratedItem = proratedItems.find(i => i.id === item.id);
        return proratedItem ? { ...item, price: proratedItem.precioEditado } : item;
      })
    );
    
    setEditableTotal(null);
    toast({ title: 'Precios prorrateados correctamente' });
  };

  const generateWhatsAppText = (): string => {
    const date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    
    let text = `📋 *COTIZACIÓN PC - COMPUCHIAPAS*\n`;
    text += `Fecha: ${date}\n`;
    if (clientName) text += `Cliente: ${clientName}\n`;
    text += `\n`;
    
    pricingItems.forEach(item => {
      const itemTotal = item.precioEditado * item.quantity;
      text += `▸ ${item.name}`;
      if (item.quantity > 1) text += ` (x${item.quantity})`;
      text += ` - ${formatCurrency(itemTotal)}\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━\n`;
    text += `Subtotal: ${formatCurrency(breakdown.subtotal)}\n`;
    text += `IVA: ${formatCurrency(breakdown.iva)}\n`;
    text += `*TOTAL: ${formatCurrency(displayTotal)}*\n`;
    
    if (notes) text += `\n📝 Notas: ${notes}\n`;
    
    text += `\nVálido por 7 días`;
    text += `\n📞 WhatsApp: 961-145-3697`;
    text += `\n🌐 compuchiapas.lovable.app`;
    
    return text;
  };

  const handleCopyWhatsApp = async () => {
    if (pricingItems.length === 0) {
      toast({ title: 'Sin componentes', description: 'Selecciona al menos un componente', variant: 'destructive' });
      return;
    }
    
    await copyToClipboard(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado', description: 'Texto copiado al portapapeles' });
  };

  const handlePrint = () => {
    if (pricingItems.length === 0) {
      toast({ title: 'Sin componentes', description: 'Selecciona al menos un componente', variant: 'destructive' });
      return;
    }
    
    const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    const itemsHtml = pricingItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.clave || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.precioEditado)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.precioEditado * item.quantity)}</td>
      </tr>
    `).join('');
    
    const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cotización PC - Compuchiapas</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#333}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;border-bottom:2px solid #2563eb;padding-bottom:20px}.logo{font-size:24px;font-weight:bold;color:#2563eb}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#2563eb;color:white;padding:12px 8px;text-align:left}.totals{margin-top:20px;text-align:right}.total-row{font-size:18px;font-weight:bold}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px}</style>
    </head><body>
      <div class="header"><div class="logo">🖥️ COTIZACIÓN PC - COMPUCHIAPAS</div><div>${date}</div></div>
      ${clientName ? `<div style="margin-bottom:20px;background:#f8fafc;padding:15px;border-radius:8px"><strong>Cliente:</strong> ${clientName}</div>` : ''}
      <table><thead><tr><th>Clave</th><th>Descripción</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      <div class="totals">
        <p>Subtotal: ${formatCurrency(breakdown.subtotal)}</p>
        <p>IVA (8%): ${formatCurrency(breakdown.iva)}</p>
        <p class="total-row">TOTAL: ${formatCurrency(displayTotal)}</p>
      </div>
      ${notes ? `<div style="background:#fef3c7;padding:15px;border-radius:8px;margin-top:20px"><strong>Notas:</strong> ${notes}</div>` : ''}
      <p style="color:#dc2626;font-weight:bold;margin-top:20px">⏰ Cotización válida por 7 días</p>
      <div class="footer"><p><strong>Compusistemas de Chiapas</strong></p><p>📞 961-145-3697 | 🌐 compuchiapas.lovable.app</p></div>
    </body></html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const selectedCount = [...COMPONENT_ORDER, ...OPTIONAL_COMPONENTS].filter(type => build[type]).length + additionalItems.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Component Selectors */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={20} />
              Armar PC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main components */}
            {COMPONENT_ORDER.map(type => (
              <ComponentSelector
                key={type}
                type={type}
                label={COMPONENT_LABELS[type]}
                icon={COMPONENT_ICONS[type]}
                selected={build[type] || null}
                onSelect={(product) => handleSelectComponent(type, product)}
                currentBuild={build}
                price={build[type] ? prices[build[type]!.id] || 0 : 0}
                onPriceChange={(price) => build[type] && handlePriceChange(build[type]!.id, price)}
                // RAM quantity props
                quantity={type === 'ram' ? ramQuantity : undefined}
                maxQuantity={type === 'ram' ? maxRamQuantity : undefined}
                onQuantityChange={type === 'ram' ? handleRamQuantityChange : undefined}
              />
            ))}
            
            {/* Optional components section */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-3">Componentes opcionales</p>
              {OPTIONAL_COMPONENTS.map(type => (
                <ComponentSelector
                  key={type}
                  type={type}
                  label={COMPONENT_LABELS[type]}
                  icon={COMPONENT_ICONS[type]}
                  selected={build[type] || null}
                  onSelect={(product) => handleSelectComponent(type, product)}
                  currentBuild={build}
                  price={build[type] ? prices[build[type]!.id] || 0 : 0}
                  onPriceChange={(price) => build[type] && handlePriceChange(build[type]!.id, price)}
                />
              ))}
            </div>
            
            {/* Additional Items */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Package size={16} />
                  Adicionales
                </p>
                <Dialog open={addProductsOpen} onOpenChange={setAddProductsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus size={14} className="mr-1" />
                      Agregar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Agregar producto adicional</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                      <Input
                        placeholder="Buscar por nombre o clave..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <ScrollArea className="h-[300px]">
                      {filteredProducts.length > 0 ? (
                        <div className="space-y-2">
                          {filteredProducts.map(product => (
                            <div
                              key={product.id}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                handleAddAdditionalItem(product);
                                setAddProductsOpen(false);
                              }}
                            >
                              <p className="font-medium text-sm">{product.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">{product.clave}</span>
                                {product.costo && product.costo > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {formatCurrency(calculateSuggestedPrice(product.costo, product.category_id))}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : productSearch ? (
                        <p className="text-center text-muted-foreground py-8">No se encontraron productos</p>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Escribe para buscar...</p>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              
              {additionalItems.length > 0 && (
                <div className="space-y-2">
                  {additionalItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.clave}</p>
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateAdditionalItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleUpdateAdditionalItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveAdditionalItem(item.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compatibility Status */}
        {selectedCount >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {compatibility.isCompatible ? (
                  <>
                    <CheckCircle className="text-green-500" size={18} />
                    Configuración Compatible
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-destructive" size={18} />
                    Problemas de Compatibilidad
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {compatibility.errors.map((error, i) => (
                <Alert key={i} variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
              {compatibility.warnings.map((warning, i) => (
                <Alert key={i} className="py-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ {warning}
                  </AlertDescription>
                </Alert>
              ))}

              {/* Power Summary */}
              {(build.cpu || build.gpu) && (
                <div className="flex items-center gap-2 pt-2 text-sm">
                  <Zap size={16} className="text-yellow-500" />
                  <span>Consumo estimado: <strong>{compatibility.powerNeeded}W</strong></span>
                  {compatibility.psuWattage && (
                    <Badge variant={compatibility.psuWattage >= compatibility.powerNeeded ? "default" : "destructive"}>
                      Fuente: {compatibility.psuWattage}W
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary and Export */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resumen</span>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <Trash2 size={14} className="mr-1" />
                  Limpiar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCount === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Selecciona componentes para armar tu PC
              </p>
            ) : (
              <>
                {/* Selected Components */}
                <div className="space-y-2">
                  {[...COMPONENT_ORDER, ...OPTIONAL_COMPONENTS].map(type => {
                    const product = build[type];
                    if (!product) return null;
                    
                    // RAM shows quantity
                    const qty = type === 'ram' ? ramQuantity : 1;
                    const unitPrice = prices[product.id] || 0;
                    
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{COMPONENT_ICONS[type]}</span>
                          <span className="truncate max-w-[120px]">{COMPONENT_LABELS[type]}</span>
                          {qty > 1 && <span className="text-muted-foreground">(x{qty})</span>}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(unitPrice * qty)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Additional items in summary */}
                  {additionalItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>📦</span>
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        {item.quantity > 1 && <span className="text-muted-foreground">(x{item.quantity})</span>}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(breakdown.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>IVA (8%):</span>
                    <span>{formatCurrency(breakdown.iva)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold">TOTAL:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={displayTotal}
                        onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                        className="h-8 w-28 text-right font-bold"
                      />
                    </div>
                  </div>
                  {editableTotal !== null && editableTotal !== breakdown.total && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={handleApplyProration}
                    >
                      Prorratear precios
                    </Button>
                  )}
                </div>

                {/* Client Info */}
                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <Label htmlFor="pcClientName" className="text-xs">Cliente</Label>
                    <Input
                      id="pcClientName"
                      placeholder="Nombre del cliente"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcNotes" className="text-xs">Notas</Label>
                    <Textarea
                      id="pcNotes"
                      placeholder="Observaciones..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWhatsApp}
                    className="w-full"
                  >
                    {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar WhatsApp'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="w-full"
                  >
                    <Printer size={14} className="mr-2" />
                    Imprimir PDF
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PCBuilderQuotation;
