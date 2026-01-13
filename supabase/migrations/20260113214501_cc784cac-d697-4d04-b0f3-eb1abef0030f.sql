-- Create enum for service status
CREATE TYPE service_status AS ENUM ('Emitida', 'Remitida', 'Facturada', 'Cancelada');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL DEFAULT 'MOSTR',
  estatus service_status NOT NULL DEFAULT 'Emitida',
  fecha_elaboracion DATE NOT NULL DEFAULT CURRENT_DATE,
  condicion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();