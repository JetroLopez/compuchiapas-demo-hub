-- Add GPU memory fields to component_specs
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS gpu_memory_type text,
ADD COLUMN IF NOT EXISTS gpu_memory_capacity integer;