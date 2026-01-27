-- Add field for CPU integrated graphics
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS cpu_has_igpu boolean DEFAULT false;