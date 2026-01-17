-- Add comentarios column to special_orders table
ALTER TABLE public.special_orders ADD COLUMN IF NOT EXISTS comentarios text;