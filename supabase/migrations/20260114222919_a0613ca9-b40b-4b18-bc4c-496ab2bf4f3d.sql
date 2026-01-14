-- Add new columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS estatus_interno text NOT NULL DEFAULT 'En tienda',
ADD COLUMN IF NOT EXISTS comentarios text;

-- Add check constraint for estatus_interno values
ALTER TABLE public.services 
ADD CONSTRAINT services_estatus_interno_check 
CHECK (estatus_interno IN ('En tienda', 'En proceso', 'Listo y avisado a cliente'));