-- Drop the existing constraint and recreate with 'cooling' included
ALTER TABLE public.component_specs DROP CONSTRAINT IF EXISTS component_specs_component_type_check;

ALTER TABLE public.component_specs ADD CONSTRAINT component_specs_component_type_check 
CHECK (component_type IN ('cpu', 'motherboard', 'ram', 'gpu', 'psu', 'case', 'storage', 'cooling'));