-- Fix checkout: remove restrictive check constraints on web_orders
ALTER TABLE public.web_orders DROP CONSTRAINT IF EXISTS web_orders_delivery_method_check;
ALTER TABLE public.web_orders DROP CONSTRAINT IF EXISTS web_orders_payment_method_check;

-- Create bodega_equipos table
CREATE TABLE public.bodega_equipos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  service_clave TEXT NOT NULL,
  fecha_ingreso_servicio DATE NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  numero_serie TEXT NOT NULL DEFAULT '',
  nombre_cliente TEXT NOT NULL,
  telefono_cliente TEXT NOT NULL DEFAULT '',
  fecha_ultimo_contacto DATE,
  estatus_al_almacenar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bodega_equipos ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated roles can manage
CREATE POLICY "Admin supervisor ventas tecnico can view bodega"
  ON public.bodega_equipos FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role) OR 
    has_role(auth.uid(), 'ventas'::app_role) OR 
    has_role(auth.uid(), 'tecnico'::app_role)
  );

CREATE POLICY "Admin supervisor can insert bodega"
  ON public.bodega_equipos FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role) OR 
    has_role(auth.uid(), 'ventas'::app_role) OR 
    has_role(auth.uid(), 'tecnico'::app_role)
  );

CREATE POLICY "Admin supervisor can update bodega"
  ON public.bodega_equipos FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  );

CREATE POLICY "Only admin can delete bodega"
  ON public.bodega_equipos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_bodega_equipos_updated_at
  BEFORE UPDATE ON public.bodega_equipos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
