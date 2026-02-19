-- Add display_order to software_esd_brands for drag-and-drop ordering
ALTER TABLE public.software_esd_brands ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
