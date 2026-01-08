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
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const products: ParsedProduct[] = [];
    
    // Detect delimiter (tab or multiple spaces)
    const firstLine = lines[0];
    const isTabDelimited = firstLine.includes('\t');
    
    for (const line of lines) {
      let parts: string[];
      
      if (isTabDelimited) {
        parts = line.split('\t').map(p => p.trim());
      } else {
        // Handle space-delimited data (at least 2 spaces as separator)
        parts = line.split(/\s{2,}/).map(p => p.trim());
      }

      // Skip header row if detected
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('clave') && lowerLine.includes('descripcion')) {
        continue;
      }

      // Need at least 4 columns: CLAVE, DESCRIPCION, LINEA, EXISTENCIAS (URL_IMAGEN optional)
      if (parts.length >= 4) {
        const existencias = parseInt(parts[3]) || 0;
        
        // Only include products with existencias >= 1
        if (existencias >= 1) {
          products.push({
            clave: parts[0],
            descripcion: parts[1],
            linea: parts[2],
            existencias,
            imagen_url: parts[4]?.trim() || undefined,
          });
        }
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
        setParseError('No se encontraron productos válidos. Asegúrate de que el formato sea: CLAVE | DESCRIPCION | LINEA | EXISTENCIAS | URL_IMAGEN (opcional)');
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
      // Get all current claves from DB
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, clave');

      const existingClaves = new Map(
        existingProducts?.map(p => [p.clave, p.id]) || []
      );

      const toUpdate: any[] = [];
      const toInsert: any[] = [];
      const newClaves = new Set(products.map(p => p.clave));

      // Prepare products for update or insert
      for (const product of products) {
        // Find category ID by matching name
        const category = categories.find(
          c => c.name.toLowerCase() === product.linea.toLowerCase() ||
               c.id.toLowerCase() === product.linea.toLowerCase()
        );

        const productData: any = {
          clave: product.clave,
          name: product.descripcion,
          category_id: category?.id || null,
          existencias: product.existencias,
          is_active: true,
        };

        // Only include image_url if provided
        if (product.imagen_url) {
          productData.image_url = product.imagen_url;
        }

        if (existingClaves.has(product.clave)) {
          // Update existing - include the id
          toUpdate.push({
            id: existingClaves.get(product.clave),
            ...productData,
          });
        } else {
          // Insert new - don't include id, let the database generate it
          toInsert.push(productData);
        }
      }

      // Mark products not in list as inactive (0 existencias)
      const clavesToDeactivate = Array.from(existingClaves.keys())
        .filter(clave => clave && !newClaves.has(clave));

      if (clavesToDeactivate.length > 0) {
        const { error: deactivateError } = await supabase
          .from('products')
          .update({ existencias: 0 })
          .in('clave', clavesToDeactivate);

        if (deactivateError) throw deactivateError;
      }

      // Update existing products
      if (toUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .upsert(toUpdate, { onConflict: 'id' });

        if (updateError) throw updateError;
      }

      // Insert new products
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('products')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      return {
        synced: products.length,
        deactivated: clavesToDeactivate.length,
        updated: toUpdate.length,
        inserted: toInsert.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Sincronización completada: ${result.synced} productos actualizados, ${result.deactivated} marcados sin existencias`);
      setPastedData('');
      setParsedProducts([]);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Error al sincronizar productos');
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
