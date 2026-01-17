-- Create table to store exhibited warehouse settings
CREATE TABLE public.exhibited_warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  is_exhibited boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id)
);

-- Enable RLS
ALTER TABLE public.exhibited_warehouses ENABLE ROW LEVEL SECURITY;

-- Anyone can view exhibited warehouses (needed for public products page)
CREATE POLICY "Anyone can view exhibited warehouses"
ON public.exhibited_warehouses
FOR SELECT
USING (true);

-- Only admins can manage exhibited warehouses
CREATE POLICY "Admins can manage exhibited warehouses"
ON public.exhibited_warehouses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_exhibited_warehouses_updated_at
BEFORE UPDATE ON public.exhibited_warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();