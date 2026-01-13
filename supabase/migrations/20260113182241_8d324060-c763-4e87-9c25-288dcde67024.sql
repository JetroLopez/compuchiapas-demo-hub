
-- Crear tabla de almacenes
CREATE TABLE public.warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Políticas para almacenes
CREATE POLICY "Anyone can view warehouses" 
ON public.warehouses 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage warehouses" 
ON public.warehouses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insertar almacenes iniciales
INSERT INTO public.warehouses (name) VALUES ('CSC'), ('AT');

-- Crear tabla de stock por almacén
CREATE TABLE public.product_warehouse_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  existencias integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- Habilitar RLS
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Políticas para stock por almacén
CREATE POLICY "Anyone can view stock" 
ON public.product_warehouse_stock 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage stock" 
ON public.product_warehouse_stock 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_product_warehouse_stock_updated_at
BEFORE UPDATE ON public.product_warehouse_stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
