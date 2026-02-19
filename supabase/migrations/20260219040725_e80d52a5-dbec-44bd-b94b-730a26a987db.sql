
-- Create table for software ESD brand images
CREATE TABLE public.software_esd_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.software_esd_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view software brands" ON public.software_esd_brands
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage software brands" ON public.software_esd_brands
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Populate with existing brands
INSERT INTO public.software_esd_brands (name)
SELECT DISTINCT marca FROM public.software_esd
ON CONFLICT (name) DO NOTHING;
