import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2, ClipboardPaste, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParsedProduct {
  clave: string;
  descripcion: string;
  linea: string;
  existencias: number;
  imagen_url?: string;
}

const ProductSync: React.FC = () => {
  const queryClient = useQueryClient();
  const [pastedData, setPastedData] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Fetch categories to map LINEA values
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  const parseTableData = (text: string): ParsedProduct[] => {
    const lines = text
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const products: ParsedProduct[] = [];

    // Detect delimiter (tab or multiple spaces)
    const firstLine = lines[0];
    const isTabDelimited = firstLine.includes('\t');

    const looksLikeUrl = (value: string) => /^https?:\/\//i.test(value);

    for (const line of lines) {
      // Skip header row if detected
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('clave') && lowerLine.includes('descripcion')) {
        continue;
      }

      let clave = '';
      let descripcion = '';
      let linea = '';
      let existencias = 0;
      let imagen_url: string | undefined;

      if (isTabDelimited) {
        const parts = line.split('\t').map((p) => p.trim());
        if (parts.length < 4) continue;

        clave = parts[0] || '';
        descripcion = parts[1] || '';
        linea = parts[2] || '';
        existencias = parseInt(parts[3] || '0', 10) || 0;
        imagen_url = parts[4]?.trim() || undefined;
      } else {
        // Try: separated by 2+ spaces (common when copying from some systems)
        const parts = line
          .split(/\s{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

        if (parts.length >= 4) {
          clave = parts[0] || '';
          descripcion = parts[1] || '';
          linea = parts[2] || '';
          existencias = parseInt(parts[3] || '0', 10) || 0;
          imagen_url = parts[4]?.trim() || undefined;
        } else {
          // Fallback: single-space separated (descripcion puede contener espacios)
          // Formato esperado:
          // CLAVE <descripcion...> LINEA EXISTENCIAS [URL_IMAGEN]
          const tokens = line.split(/\s+/).filter(Boolean);
          if (tokens.length < 4) continue;

          clave = tokens[0] || '';

          const last = tokens[tokens.length - 1];
          const hasUrl = looksLikeUrl(last);

          if (hasUrl) {
            imagen_url = last;
            existencias = parseInt(tokens[tokens.length - 2] || '0', 10) || 0;
            linea = tokens[tokens.length - 3] || '';
            descripcion = tokens.slice(1, tokens.length - 3).join(' ').trim();
          } else {
            existencias = parseInt(last || '0', 10) || 0;
            linea = tokens[tokens.length - 2] || '';
            descripcion = tokens.slice(1, tokens.length - 2).join(' ').trim();
          }
        }
      }

      // Only include products with existencias >= 1
      if (clave && descripcion && linea && existencias >= 1) {
        products.push({
          clave,
          descripcion,
          linea,
          existencias,
          imagen_url,
        });
      }
    }

    return products;
  };

  const handlePaste = () => {
    setParseError(null);

    if (!pastedData.trim()) {
      setParseError('No hay datos para procesar');
      return;
    }

    try {
      const products = parseTableData(pastedData);

      if (products.length === 0) {
        setParseError(
          'No se encontraron productos válidos. Asegúrate de que el formato sea: CLAVE | DESCRIPCION | LINEA | EXISTENCIAS | URL_IMAGEN (opcional)'
        );
        return;
      }

      setParsedProducts(products);
      toast.success(`${products.length} productos detectados`);
    } catch (error) {
      setParseError('Error al procesar los datos');
    }
  };

  const syncMutation = useMutation({
    mutationFn: async (products: ParsedProduct[]) => {
      // Deduplicate by CLAVE to avoid Postgres error:
      // "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const deduped = new Map<string, ParsedProduct>();
      let duplicates = 0;
      for (const p of products) {
        if (!p.clave) continue;
        if (deduped.has(p.clave)) duplicates++;
        // Keep the last occurrence (usually the most recent inventory row)
        deduped.set(p.clave, p);
      }
      const uniqueProducts = Array.from(deduped.values());

      const newClaves = new Set(uniqueProducts.map((p) => p.clave).filter(Boolean));

      // Fetch ALL existing claves (PostgREST default limit is 1000)
      const pageSize = 1000;
      const existingClaves: string[] = [];

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('products')
          .select('clave')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        const claves = (data || []).map((r) => r.clave).filter(Boolean) as string[];
        existingClaves.push(...claves);

        if (!data || data.length < pageSize) break;
      }

      // Mark products not in list as inactive (0 existencias)
      const clavesToDeactivate = existingClaves.filter((clave) => !newClaves.has(clave));

      // Update in chunks to avoid oversized queries
      const chunkSize = 500;
      for (let i = 0; i < clavesToDeactivate.length; i += chunkSize) {
        const chunk = clavesToDeactivate.slice(i, i + chunkSize);
        const { error: deactivateError } = await supabase
          .from('products')
          .update({ existencias: 0 })
          .in('clave', chunk);

        if (deactivateError) throw deactivateError;
      }

      // Upsert (by CLAVE) so we don't depend on fetching all IDs, and avoid duplicates.
      const rows = uniqueProducts.map((product) => {
        const category = categories.find(
          (c) =>
            c.name.toLowerCase() === product.linea.toLowerCase() ||
            c.id.toLowerCase() === product.linea.toLowerCase()
        );

        const productData: any = {
          clave: product.clave,
          name: product.descripcion,
          category_id: category?.id || null,
          existencias: product.existencias,
          is_active: true,
        };

        if (product.imagen_url) {
          productData.image_url = product.imagen_url;
        }

        return productData;
      });

      const { error: upsertError } = await supabase
        .from('products')
        .upsert(rows, { onConflict: 'clave' });

      if (upsertError) throw upsertError;

      return {
        synced: uniqueProducts.length,
        deactivated: clavesToDeactivate.length,
        duplicates,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      const extra = result.duplicates > 0 ? ` (${result.duplicates} claves duplicadas fusionadas)` : '';
      toast.success(
        `Sincronización completada: ${result.synced} productos actualizados, ${result.deactivated} marcados sin existencias${extra}`
      );
      setPastedData('');
      setParsedProducts([]);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      const message =
        error && typeof error === 'object' && 'message' in (error as any)
          ? String((error as any).message)
          : 'Error desconocido';
      toast.error(`Error al sincronizar productos: ${message}`);
    },
  });

  const handleSave = () => {
    if (parsedProducts.length === 0) {
      toast.error('No hay productos para guardar');
      return;
    }
    syncMutation.mutate(parsedProducts);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardPaste size={20} />
          Sincronizar Inventario
        </CardTitle>
        <CardDescription>
          Pega los datos de tu punto de venta con formato: CLAVE, DESCRIPCIÓN, LÍNEA, EXISTENCIAS, URL_IMAGEN (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder={`Ejemplo de formato (separado por tabs o espacios):

CLAVE001    Teclado USB Logitech    Periféricos    15    https://ejemplo.com/teclado.jpg
CLAVE002    Mouse Inalámbrico       Periféricos    8     https://ejemplo.com/mouse.jpg
CLAVE003    Laptop HP 15            Equipos        3`}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePaste} disabled={!pastedData.trim()}>
            <ClipboardPaste size={16} className="mr-2" />
            Procesar Datos
          </Button>
        </div>

        {parseError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {parsedProducts.length > 0 && (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>{parsedProducts.length}</strong> productos listos para sincronizar.
                Los productos que no estén en esta lista se marcarán con 0 existencias.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Clave</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Línea</th>
                    <th className="text-center p-2">Existencias</th>
                    <th className="text-left p-2">URL Imagen</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedProducts.slice(0, 50).map((product, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 font-mono">{product.clave}</td>
                      <td className="p-2 truncate max-w-xs">{product.descripcion}</td>
                      <td className="p-2">{product.linea}</td>
                      <td className="p-2 text-center">{product.existencias}</td>
                      <td className="p-2 truncate max-w-[150px] text-xs text-muted-foreground" title={product.imagen_url}>
                        {product.imagen_url || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedProducts.length > 50 && (
                <p className="text-center text-muted-foreground py-2 text-sm">
                  ... y {parsedProducts.length - 50} productos más
                </p>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductSync;
