import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Monitor, AlertTriangle, CheckCircle, Copy, Printer, Check, Zap, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComponentProducts, usePCBuilderCompatibility } from '@/hooks/useCompatibility';
import {
  PCBuild,
  ProductWithSpec,
  COMPONENT_LABELS,
  COMPONENT_ICONS,
} from '@/lib/compatibility-rules';
import {
  QuotationItem,
  formatCurrency,
  calculateTotal,
  generateWhatsAppText,
  copyToClipboard,
  printQuotation,
} from '@/lib/quotation-export';
import ComponentSelector from './ComponentSelector';

const COMPONENT_ORDER: (keyof PCBuild)[] = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'];

const PCBuilderQuotation: React.FC = () => {
  const { toast } = useToast();
  const [build, setBuild] = useState<PCBuild>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const compatibility = usePCBuilderCompatibility(build);

  const handleSelectComponent = (type: keyof PCBuild, product: ProductWithSpec | null) => {
    setBuild(prev => ({ ...prev, [type]: product }));
    if (product) {
      setPrices(prev => ({ ...prev, [product.id]: prev[product.id] || 0 }));
    }
  };

  const handlePriceChange = (productId: string, price: number) => {
    setPrices(prev => ({ ...prev, [productId]: price }));
  };

  const handleClear = () => {
    setBuild({});
    setPrices({});
    setClientName('');
    setNotes('');
  };

  const getItems = (): QuotationItem[] => {
    return COMPONENT_ORDER
      .filter(type => build[type])
      .map(type => {
        const product = build[type]!;
        return {
          id: product.id,
          name: product.name,
          clave: product.clave || undefined,
          quantity: 1,
          price: prices[product.id] || 0,
        };
      });
  };

  const handleCopyWhatsApp = async () => {
    const items = getItems();
    if (items.length === 0) {
      toast({
        title: 'Sin componentes',
        description: 'Selecciona al menos un componente',
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
    const items = getItems();
    if (items.length === 0) {
      toast({
        title: 'Sin componentes',
        description: 'Selecciona al menos un componente',
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

  const total = calculateTotal(getItems());
  const selectedCount = COMPONENT_ORDER.filter(type => build[type]).length;

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
              />
            ))}
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
                  {COMPONENT_ORDER.map(type => {
                    const product = build[type];
                    if (!product) return null;
                    
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{COMPONENT_ICONS[type]}</span>
                          <span className="truncate max-w-[120px]">{COMPONENT_LABELS[type]}</span>
                        </span>
                        <span className="font-medium">
                          {formatCurrency(prices[product.id] || 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
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
