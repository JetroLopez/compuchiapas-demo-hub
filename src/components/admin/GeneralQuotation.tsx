import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Trash2, FileText, Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import logoCSC from '@/assets/LogoCSC.png';

interface QuotLineItem {
  id: string;
  productId: string;
  description: string;
  clave: string;
  quantity: number;
  costoBase: number;
  precioUnitario: number; // final editable price (cost * 1.17, rounded to 5)
  imageUrl: string | null;
}

const formatMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const roundTo5 = (v: number) => (v <= 0 ? 0 : Math.ceil(v / 5) * 5);

const calcSuggestedPrice = (costo: number) => {
  if (!costo || costo <= 0) return 0;
  return roundTo5(costo * 1.17);
};

const generateFolio = () => {
  const now = new Date();
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const initial = days[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, '0');
  return `${initial}${dd}${mm}${yy}${hh}`;
};

const GeneralQuotation: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<QuotLineItem[]>([]);
  const [clientName, setClientName] = useState('A QUIEN CORRESPONDA');
  const [withImages, setWithImages] = useState(false);
  const [folio] = useState(generateFolio);

  // Get user profile name
  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const asesorName = profile?.full_name || user?.email || 'Asesor';

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: products = [], isFetching } = useQuery({
    queryKey: ['quotation-product-search', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const tokens = debouncedSearch.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
      if (tokens.length === 0) return [];
      const orClauses = tokens.map(t => `name.ilike.%${t}%,clave.ilike.%${t}%`).join(',');
      const { data, error } = await supabase
        .from('products')
        .select('id, name, clave, costo, image_url')
        .eq('is_active', true)
        .or(orClauses)
        .order('name')
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  const addItem = (product: { id: string; name: string; clave: string | null; costo: number | null; image_url: string | null }) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const costo = product.costo || 0;
      setItems([...items, {
        id: crypto.randomUUID(),
        productId: product.id,
        description: product.name,
        clave: product.clave || '',
        quantity: 1,
        costoBase: costo,
        precioUnitario: calcSuggestedPrice(costo),
        imageUrl: product.image_url || null,
      }]);
    }
    setSearchTerm('');
  };

  const updateItem = useCallback((id: string, field: keyof QuotLineItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // Calculations
  const itemTotals = items.map(i => {
    const impuestos = i.precioUnitario * i.quantity * 0.08 / 1.08; // IVA included in price, extract it
    const subtotalSinIva = i.precioUnitario * i.quantity - impuestos;
    return {
      ...i,
      totalLinea: i.precioUnitario * i.quantity,
      impuestosLinea: i.precioUnitario * i.quantity * 0.08 / 1.08,
    };
  });

  // For the PDF: desglose from final price
  // precioUnitario is the FINAL price with IVA included
  // subtotal = sum(precioUnitario * qty) / 1.08
  // impuestos = subtotal * 0.08
  // total = subtotal + impuestos
  const totalBruto = items.reduce((s, i) => s + i.precioUnitario * i.quantity, 0);
  const subtotal = totalBruto / 1.08;
  const impuestos = totalBruto - subtotal;
  const totalFinal = totalBruto;

  const handleClear = () => {
    setItems([]);
    setClientName('A QUIEN CORRESPONDA');
    setSearchTerm('');
    setWithImages(false);
  };

  const handlePrintPDF = () => {
    if (items.length === 0) {
      toast({ title: 'Sin productos', description: 'Agrega al menos un producto', variant: 'destructive' });
      return;
    }

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const vigencia = new Date(fecha.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const itemRows = items.map(item => {
      const total = item.precioUnitario * item.quantity;
      const impItem = total - (total / 1.08);
      return `
        <tr>
          <td style="white-space:pre-wrap;">${item.description.replace(/\n/g, '<br>')}</td>
          <td style="text-align:right;">${formatMXN(item.precioUnitario / 1.08)}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">${formatMXN(impItem)}</td>
          <td style="text-align:right;font-weight:600;">${formatMXN(total)}</td>
        </tr>`;
    }).join('');

    const imageGrid = withImages ? `
      <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
        ${items.filter(i => i.imageUrl).map(item => `
          <div style="width:140px;text-align:center;">
            <img src="${item.imageUrl}" style="width:130px;height:100px;object-fit:contain;border:1px solid #ddd;border-radius:4px;" />
            <p style="font-size:9px;color:#555;margin-top:4px;line-height:1.2;">${item.description.split('\n')[0].substring(0, 60)}</p>
          </div>
        `).join('')}
      </div>` : '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Cotización ${folio}</title>
<style>
  @page { size: letter; margin: 15mm 15mm 15mm 15mm; }
  @media print {
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin-top: 10mm; margin-bottom: 10mm; margin-left: 15mm; margin-right: 15mm; }
    header, footer, .no-print { display: none !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; font-size: 11px; line-height: 1.5; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f355c; padding-bottom: 14px; margin-bottom: 16px; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .logo { width: 85px; height: 85px; object-fit: contain; }
  .company-info h1 { font-size: 15px; color: #0f355c; margin-bottom: 2px; font-weight: 700; letter-spacing: 0.3px; }
  .company-info p { font-size: 10px; color: #000000; line-height: 1.5; }
  .meta-box { border: 1.5px solid #0f355c; border-radius: 6px; padding: 10px 14px; font-size: 10px; text-align: left; min-width: 210px; color: #000000; }
  .meta-box strong { color: #0f355c; }
  .meta-box p { margin-bottom: 3px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  thead th { background: #0f355c; color: #ffffff; padding: 9px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border: none; }
  tbody td { padding: 9px 8px; border-bottom: 1.5px solid #e0e0e0; vertical-align: top; font-size: 11px; line-height: 1.4; color: #000000; }
  tbody tr:last-child td { border-bottom: 2px solid #0f355c; }

  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .totals-table { width: 270px; }
  .totals-table td { padding: 6px 10px; font-size: 11px; border-bottom: 1px solid #e0e0e0; color: #000000; }
  .totals-table .total-row { background: #0f355c; color: #ffffff; font-weight: 700; font-size: 13px; }
  .totals-table .total-row td { border-bottom: none; color: #ffffff; }

  .terms { background: #f7f8fa; border: 1px solid #dde1e6; border-radius: 5px; padding: 12px 16px; margin-bottom: 14px; }
  .terms h3 { font-size: 11px; color: #0f355c; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; }
  .terms ol { padding-left: 20px; font-size: 9.5px; color: #000000; }
  .terms ol li { margin-bottom: 3px; line-height: 1.5; }

  .footer-bank { background: #0f355c; color: #ffffff; padding: 12px 16px; border-radius: 5px; font-size: 10px; text-align: center; }
  .footer-bank p { margin-bottom: 3px; color: #ffffff; }
</style></head><body>

<div class="header">
  <div class="header-left">
    <img src="${logoCSC}" class="logo" />
    <div class="company-info">
      <h1>COMPUSISTEMAS DE CHIAPAS SA de CV</h1>
      <p>6a Avenida Sur No. 12, Colonia Centro 30700, Tapachula, Chiapas</p>
      <p>🌐 www.compuchiapas.com.mx</p>
      <p><strong>Asesor comercial:</strong> ${asesorName}</p>
      <p><strong>Cliente:</strong> ${clientName}</p>
    </div>
  </div>
  <div class="meta-box">
    <p><strong>Fecha:</strong> ${fechaStr}</p>
    <p><strong>Folio:</strong> ${folio}</p>
    <p><strong>Vigencia:</strong> ${vigencia} (3 días)</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="text-align:left;width:45%;">Descripción</th>
      <th style="text-align:right;width:14%;">Precio Unit.</th>
      <th style="text-align:center;width:8%;">Cant.</th>
      <th style="text-align:right;width:14%;">Impuestos</th>
      <th style="text-align:right;width:14%;">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

${imageGrid}

<div class="totals-section">
  <table class="totals-table">
    <tr><td style="text-align:right;">Subtotal</td><td style="text-align:right;">${formatMXN(subtotal)}</td></tr>
    <tr><td style="text-align:right;">Impuesto %</td><td style="text-align:right;">8.000%</td></tr>
    <tr><td style="text-align:right;">Total Impuesto</td><td style="text-align:right;">${formatMXN(impuestos)}</td></tr>
    <tr class="total-row"><td style="text-align:right;">TOTAL</td><td style="text-align:right;">${formatMXN(totalFinal)}</td></tr>
  </table>
</div>

<div class="terms">
  <h3>Términos y Condiciones</h3>
  <ol>
    <li><strong>Vigencia:</strong> 3 días naturales a partir de la fecha de emisión.</li>
    <li><strong>Precios y existencias:</strong> Sujetos a cambio sin previo aviso y a disponibilidad de inventario.</li>
    <li><strong>Pago:</strong> De contado (100% al momento de ordenar).</li>
    <li><strong>Entrega:</strong> Inmediata en tienda física; de 5 a 10 días hábiles para mercancía sobre pedido.</li>
    <li><strong>Envío:</strong> Gratuito dentro de la ciudad.</li>
    <li><strong>Devoluciones:</strong> No aplican cambios, cancelaciones ni devoluciones en pedidos especiales.</li>
    <li><strong>Facturación:</strong> Solicitarla al momento de confirmar la cotización.</li>
    <li><strong>Garantía:</strong> Hasta 1 año sobre defectos de fábrica, dependiendo del producto.</li>
  </ol>
</div>

<div class="footer-bank">
  <p><strong>COMPUSISTEMAS DE CHIAPAS SA DE CV</strong> / 962-214-8546</p>
  <p>BBVA: Suc 544 / Clabe: 012133001323580268</p>
  <p style="margin-top:6px;font-style:italic;">Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con su asesor de ventas.</p>
</div>

</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Search & Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Buscar Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por clave o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          {isFetching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!isFetching && products.length > 0 && (
            <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
              {products.map(p => (
                <div
                  key={p.id}
                  className="p-3 hover:bg-muted/50 flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() => addItem(p)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.clave} — Costo: {formatMXN(p.costo || 0)}</p>
                  </div>
                  <Button size="sm" variant="ghost"><Plus size={16} /></Button>
                </div>
              ))}
            </div>
          )}
          {searchTerm.length >= 2 && !isFetching && products.length === 0 && debouncedSearch.length >= 2 && (
            <p className="text-center text-muted-foreground py-4 text-sm">Sin resultados</p>
          )}

          {/* Client & Config */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label>Cliente</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div>
              <Label>Asesor</Label>
              <Input value={asesorName} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Folio</Label>
              <Input value={folio} disabled className="bg-muted font-mono" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="with-images" checked={withImages} onCheckedChange={setWithImages} />
              <Label htmlFor="with-images">Incluir imágenes en PDF</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FileText size={20} /> Cotización</span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>Limpiar</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Busca y agrega productos</p>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{item.clave}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      rows={2}
                      className="text-sm resize-y"
                      placeholder="Descripción del producto..."
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio Final</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={e => updateItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <div className="h-8 flex items-center font-semibold text-sm">
                          {formatMXN(item.precioUnitario * item.quantity)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Costo: {formatMXN(item.costoBase)} → Sugerido: {formatMXN(calcSuggestedPrice(item.costoBase))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatMXN(subtotal)}</span></div>
                <div className="flex justify-between"><span>Impuesto (8%):</span><span>{formatMXN(impuestos)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>TOTAL:</span><span>{formatMXN(totalFinal)}</span>
                </div>
              </div>

              <Button className="w-full" onClick={handlePrintPDF}>
                <Printer size={16} className="mr-2" />
                Generar PDF
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralQuotation;
