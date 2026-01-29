-- Add new case specification fields
ALTER TABLE public.component_specs
ADD COLUMN IF NOT EXISTS case_includes_500w_psu boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS case_is_compact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS case_supports_liquid_cooling boolean DEFAULT false;