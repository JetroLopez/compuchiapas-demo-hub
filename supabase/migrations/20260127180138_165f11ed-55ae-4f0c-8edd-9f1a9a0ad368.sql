-- Add new columns for CPU
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS cpu_base_frequency numeric,
ADD COLUMN IF NOT EXISTS is_gamer boolean DEFAULT false;

-- Add new columns for GPU (video outputs)
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS gpu_hdmi_ports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_displayport_ports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_mini_displayport_ports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_vga_ports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_dvi_ports integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_brand text;

-- Add new columns for PSU
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS psu_form_factor text,
ADD COLUMN IF NOT EXISTS psu_color text,
ADD COLUMN IF NOT EXISTS psu_modular boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS psu_pcie_cable boolean DEFAULT false;

-- Add new columns for Case
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS case_color text,
ADD COLUMN IF NOT EXISTS case_fans_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS case_fans_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS case_psu_position text;

-- Add new columns for Storage (restructured)
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS storage_interface text,
ADD COLUMN IF NOT EXISTS storage_subtype text,
ADD COLUMN IF NOT EXISTS storage_m2_size text,
ADD COLUMN IF NOT EXISTS storage_speed integer,
ADD COLUMN IF NOT EXISTS storage_has_heatsink boolean DEFAULT false;

-- Add new columns for Cooling
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS cooling_fans_count integer,
ADD COLUMN IF NOT EXISTS cooling_color text,
ADD COLUMN IF NOT EXISTS cooling_type text;