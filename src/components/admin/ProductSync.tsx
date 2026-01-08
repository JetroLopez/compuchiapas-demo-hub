import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2, Upload, AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';

interface ParsedProduct {
  clave: string;
  descripcion: string;
  linea: string;
  existencias: number;
  imagen_url?: string;
}

// Column name variations we accept (case-insensitive)
const COLUMN_ALIASES: Record<string, string[]> = {
  clave: ['clave', 'codigo', 'código', 'sku', 'id', 'cve'],
  descripcion: ['descripcion', 'descripción', 'nombre', 'name', 'producto', 'desc'],
  linea: ['linea', 'línea', 'categoria', 'categoría', 'category', 'cat', 'line'],
  existencias: ['existencias', 'existencia', 'stock', 'qty', 'cantidad', 'inventory', 'inv', 'exist'],
  imagen_url: ['imagen_url', 'imagen', 'image', 'url', 'foto', 'photo', 'img', 'url_imagen', 'image_url'],
};

function normalizeColumnName(col: string): string | null {
  const lower = col.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(lower)) return key;
  }
  return null;
}

const ProductSync: React.FC = () => {
  const queryClient = useQueryClient();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseXlsx = (file: File): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Use first sheet
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          // Convert to JSON with header row
          const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (rows.length === 0) {
            reject(new Error('El archivo está vacío'));
            return;
          }

          // Map columns from first row keys
          const firstRowKeys = Object.keys(rows[0]);
          const columnMap: Record<string, string> = {};
          for (const key of firstRowKeys) {
            const normalized = normalizeColumnName(key);
            if (normalized) {
              columnMap[normalized] = key;
            }
          }

          // Validate required columns
          const missing: string[] = [];
          if (!columnMap.clave) missing.push('CLAVE');
          if (!columnMap.descripcion) missing.push('DESCRIPCION');
          if (!columnMap.linea) missing.push('LINEA');
          if (!columnMap.existencias) missing.push('EXISTENCIAS');

          if (missing.length > 0) {
            reject(new Error(`Columnas requeridas no encontradas: ${missing.join(', ')}`));
            return;
          }

          const products: ParsedProduct[] = [];
          for (const row of rows) {
            const clave = String(row[columnMap.clave] ?? '').trim();
            const descripcion = String(row[columnMap.descripcion] ?? '').trim();
            const linea = String(row[columnMap.linea] ?? '').trim();
            const existenciasRaw = row[columnMap.existencias];
            const existencias = typeof existenciasRaw === 'number' 
              ? existenciasRaw 
              : parseInt(String(existenciasRaw), 10) || 0;
            const imagen_url = columnMap.imagen_url 
              ? String(row[columnMap.imagen_url] ?? '').trim() || undefined 
              : undefined;

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

          resolve(products);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParsedProducts([]);
    setFileName(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const products = await parseXlsx(file);

      if (products.length === 0) {
        setParseError('No se encontraron productos válidos con existencias >= 1');
        return;
      }

      setParsedProducts(products);
      toast.success(`${products.length} productos detectados en ${file.name}`);
    } catch (err: any) {
      console.error('Parse error:', err);
      setParseError(err?.message || 'Error al procesar el archivo');
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const syncMutation = useMutation({
    mutationFn: async (products: ParsedProduct[]) => {
      // Deduplicate by CLAVE to avoid Postgres error
      const deduped = new Map<string, ParsedProduct>();
      let duplicates = 0;
      for (const p of products) {
        if (!p.clave) continue;
        if (deduped.has(p.clave)) duplicates++;
        deduped.set(p.clave, p);
      }
      const uniqueProducts = Array.from(deduped.values());

      const newClaves = new Set(uniqueProducts.map((p) => p.clave).filter(Boolean));

      // Fetch ALL existing claves (paginate to avoid 1000 limit)
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

      const chunkSize = 500;
      for (let i = 0; i < clavesToDeactivate.length; i += chunkSize) {
        const chunk = clavesToDeactivate.slice(i, i + chunkSize);
        const { error: deactivateError } = await supabase
          .from('products')
          .update({ existencias: 0 })
          .in('clave', chunk);

        if (deactivateError) throw deactivateError;
      }

      // Upsert by CLAVE
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
      setParsedProducts([]);
      setFileName(null);
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
          <FileSpreadsheet size={20} />
          Sincronizar Inventario desde Excel
        </CardTitle>
        <CardDescription>
          Sube un archivo XLSX con las columnas: <strong>CLAVE</strong>, <strong>DESCRIPCION</strong>, <strong>LINEA</strong>, <strong>EXISTENCIAS</strong>, y opcionalmente <strong>URL_IMAGEN</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Archivo Excel (.xlsx, .xls)</Label>
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="max-w-md"
            />
            {fileName && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {fileName}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Acepta nombres de columna alternativos: clave/codigo/sku, descripcion/nombre, linea/categoria, existencias/stock, imagen_url/imagen/url
          </p>
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
