
-- Add monthly goal fields to existing store_settings table
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS meta_mensual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ventas_csc numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ventas_at numeric DEFAULT 0;
