-- Create software_esd table for Electronic Software Distribution products
CREATE TABLE public.software_esd (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  clave TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  detalles TEXT,
  precio DECIMAL(10,2) NOT NULL,
  img_url TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.software_esd ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active software ESD" 
ON public.software_esd 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage software ESD" 
ON public.software_esd 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_software_esd_updated_at
BEFORE UPDATE ON public.software_esd
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.software_esd (marca, clave, descripcion, detalles, precio, display_order) VALUES
-- Bitdefender
('Bitdefender', 'BD-AV-PLUS', 'Antivirus Plus', 'Protección antivirus básica para Windows', 0, 1),
('Bitdefender', 'BD-IS', 'Internet Security', 'Protección completa para Internet y dispositivos', 0, 2),
('Bitdefender', 'BD-TS', 'Total Security', 'Protección máxima para todos tus dispositivos', 0, 3),
('Bitdefender', 'BD-SOS', 'Small Office Security', 'Solución de seguridad para pequeñas oficinas', 0, 4),
('Bitdefender', 'BD-MAC', 'Antivirus para Mac', 'Protección antivirus para macOS', 0, 5),
('Bitdefender', 'BD-ANDROID', 'Antivirus para Android', 'Protección móvil para dispositivos Android', 0, 6),
-- DESS
('DESS', 'DESS-POS-8', 'Licencia Electrónica DESS Punto de Venta 8', 'Sistema de punto de venta completo', 0, 7),
-- ESET
('ESET', 'ESET-HSE', 'Home Security Essential', 'Protección esencial para el hogar', 0, 8),
('ESET', 'ESET-HSP', 'Home Security Premium', 'Protección premium para el hogar', 0, 9),
('ESET', 'ESET-NOD32', 'Nod32 Antivirus', 'Antivirus ligero y eficiente', 0, 10),
('ESET', 'ESET-SOS', 'Small Office Security Pack', 'Paquete de seguridad para pequeñas oficinas', 0, 11),
-- Kaspersky
('Kaspersky', 'KAS-SO', 'Small Office', 'Solución para pequeñas oficinas', 0, 12),
('Kaspersky', 'KAS-STD', 'Standard Antivirus', 'Antivirus estándar', 0, 13),
('Kaspersky', 'KAS-PLUS', 'Plus Internet Security', 'Seguridad completa para Internet', 0, 14),
('Kaspersky', 'KAS-PREM', 'Premium Total Security', 'Protección premium total', 0, 15),
('Kaspersky', 'KAS-SC', 'Secure Connection', 'Conexión segura VPN', 0, 16),
('Kaspersky', 'KAS-MOB', 'Kaspersky Standard Mobile', 'Protección móvil estándar', 0, 17),
-- Microsoft
('Microsoft', 'MS-365-BS', 'MICROSOFT 365 BUSINESS STANDARD', 'Suite completa para negocios', 0, 18),
('Microsoft', 'MS-365-FAM', 'MICROSOFT 365 FAMILY', 'Suite familiar con múltiples usuarios', 0, 19),
('Microsoft', 'MS-365-PER', 'MICROSOFT 365 PERSONAL', 'Suite personal', 0, 20),
('Microsoft', 'MS-365-BA', 'MICROSOFT 365 BUSINESS APPS', 'Aplicaciones de negocio', 0, 21),
('Microsoft', 'WIN11-HOME', 'Windows 11 HOME', 'Sistema operativo Windows 11 Home', 0, 22),
('Microsoft', 'WIN11-PRO', 'Windows 11 PRO', 'Sistema operativo Windows 11 Pro', 0, 23),
('Microsoft', 'OFF-HOME-2024', 'OFFICE HOME 2024', 'Suite Office Home 2024', 0, 24),
('Microsoft', 'OFF-HB-2024', 'OFFICE HOME AND BUSINESS 2024', 'Suite Office Home and Business 2024', 0, 25),
('Microsoft', 'VISIO-STD-2024', 'VISIO STANDARD 2024', 'Visio Standard 2024', 0, 26),
('Microsoft', 'PROJ-STD-2024', 'PROJECT STANDARD 2024', 'Project Standard 2024', 0, 27),
-- SoftRestaurant
('SoftRestaurant', 'SR-12', 'Soft Restaurant 12', 'Sistema de gestión para restaurantes', 0, 28),
-- Norton
('Norton', 'NORT-360-ADV', 'Norton 360 Advanced', 'Protección avanzada completa', 0, 29),
('Norton', 'NORT-360-DEL', 'Norton 360 Deluxe', 'Protección deluxe', 0, 30),
('Norton', 'NORT-360-STD', 'Norton 360 Standard', 'Protección estándar', 0, 31),
('Norton', 'NORT-AV-PLUS', 'Norton AntiVirus Plus', 'Antivirus básico', 0, 32),
('Norton', 'NORT-360-GAM', 'Norton 360 For Gamers', 'Protección optimizada para gamers', 0, 33),
('Norton', 'NORT-360-PREM', 'Norton 360 Premium', 'Protección premium', 0, 34);
