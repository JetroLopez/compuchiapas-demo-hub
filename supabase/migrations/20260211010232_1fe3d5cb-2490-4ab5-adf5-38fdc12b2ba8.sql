
-- Create warranty status enum
CREATE TYPE public.warranty_status AS ENUM ('En revisión', 'Con proveedor', 'Listo para su entrega');

-- Create warranties table
CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente TEXT NOT NULL,
  clave_producto TEXT NOT NULL,
  descripcion_producto TEXT NOT NULL,
  descripcion_problema TEXT NOT NULL,
  clave_proveedor TEXT NOT NULL,
  remision_factura TEXT NOT NULL,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  folio_servicio TEXT,
  estatus warranty_status NOT NULL DEFAULT 'En revisión',
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- Admin and supervisor can do everything
CREATE POLICY "Admin and supervisor can manage warranties"
ON public.warranties
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

-- Other authenticated roles can view only
CREATE POLICY "Other roles can view warranties"
ON public.warranties
FOR SELECT
USING (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'ventas'));

-- Trigger for updated_at
CREATE TRIGGER update_warranties_updated_at
BEFORE UPDATE ON public.warranties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
