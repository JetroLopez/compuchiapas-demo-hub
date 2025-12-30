-- Modificar la tabla products para coincidir con el flujo de importación CSV

-- Primero eliminar las columnas que no necesitas
ALTER TABLE public.products 
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS price_numeric,
  DROP COLUMN IF EXISTS specs,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS is_featured;

-- Agregar la columna "clave" (código del producto independiente del id)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS clave text;

-- Renombrar stock a existencias si existe, o crear existencias
ALTER TABLE public.products 
  RENAME COLUMN stock TO existencias;

-- Crear índice en clave para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_clave ON public.products(clave);