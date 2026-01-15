-- Create enum for special order status
CREATE TYPE public.special_order_status AS ENUM ('Notificado con Esdras', 'Pedido', 'En tienda', 'Entregado');

-- Add 'tecnico' role to app_role enum if not exists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';

-- Create special_orders table
CREATE TABLE public.special_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente TEXT NOT NULL,
    telefono TEXT,
    producto TEXT NOT NULL,
    clave TEXT,
    precio NUMERIC,
    anticipo NUMERIC DEFAULT 0,
    resta NUMERIC DEFAULT 0,
    folio_ingreso TEXT,
    fecha_aprox_entrega DATE,
    estatus special_order_status NOT NULL DEFAULT 'Pedido',
    fecha_entrega DATE,
    folio_servicio TEXT,
    remision TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.special_orders ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view special orders
CREATE POLICY "Authenticated users can view special orders"
ON public.special_orders
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'ventas'::app_role) OR 
    has_role(auth.uid(), 'tecnico'::app_role)
);

-- Admin, ventas and tecnico can insert
CREATE POLICY "Admin ventas tecnico can insert special orders"
ON public.special_orders
FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'ventas'::app_role) OR 
    has_role(auth.uid(), 'tecnico'::app_role)
);

-- Admin, ventas and tecnico can update
CREATE POLICY "Admin ventas tecnico can update special orders"
ON public.special_orders
FOR UPDATE
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'ventas'::app_role) OR 
    has_role(auth.uid(), 'tecnico'::app_role)
);

-- Only admin can delete (for clear all functionality)
CREATE POLICY "Only admin can delete special orders"
ON public.special_orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_special_orders_updated_at
BEFORE UPDATE ON public.special_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();