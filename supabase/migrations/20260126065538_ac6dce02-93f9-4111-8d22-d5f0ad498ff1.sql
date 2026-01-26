-- Tabla para especificaciones técnicas de componentes PC
CREATE TABLE public.component_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE NOT NULL,
  component_type TEXT NOT NULL CHECK (component_type IN ('cpu', 'motherboard', 'ram', 'gpu', 'psu', 'case', 'storage')),
  
  -- Specs compartidas
  socket TEXT,
  ram_type TEXT,
  form_factor TEXT,
  
  -- CPU specs
  cpu_tdp INTEGER,
  
  -- Motherboard specs
  ram_slots INTEGER,
  max_ram_speed INTEGER,
  m2_slots INTEGER,
  chipset TEXT,
  
  -- RAM specs
  ram_capacity INTEGER,
  ram_speed INTEGER,
  ram_modules INTEGER,
  
  -- GPU specs
  gpu_tdp INTEGER,
  gpu_length INTEGER,
  
  -- PSU specs
  psu_wattage INTEGER,
  psu_efficiency TEXT,
  
  -- Case specs
  case_max_gpu_length INTEGER,
  case_form_factors TEXT[],
  
  -- Storage specs
  storage_type TEXT,
  storage_capacity INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.component_specs ENABLE ROW LEVEL SECURITY;

-- Anyone can view specs (needed for public PC builder)
CREATE POLICY "Anyone can view component specs"
ON public.component_specs
FOR SELECT
USING (true);

-- Admins and ventas can manage specs
CREATE POLICY "Admins and ventas can manage component specs"
ON public.component_specs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_component_specs_updated_at
BEFORE UPDATE ON public.component_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();