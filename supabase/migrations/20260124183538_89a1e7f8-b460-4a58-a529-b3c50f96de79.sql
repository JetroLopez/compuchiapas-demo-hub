-- Create table for tracking products that are ordered/in transit (Por Surtir)
CREATE TABLE public.products_por_surtir (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  clave TEXT NOT NULL,
  nombre TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'ordered'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products_por_surtir ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view products por surtir" 
ON public.products_por_surtir 
FOR SELECT 
USING (true);

-- Admins and ventas can manage
CREATE POLICY "Admins and ventas can manage products por surtir" 
ON public.products_por_surtir 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_products_por_surtir_updated_at
  BEFORE UPDATE ON public.products_por_surtir
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();