-- =============================================
-- TABLA: contact_submissions (Formulario de contacto)
-- =============================================
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar (formulario público)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Política: Solo lectura para usuarios autenticados (futura admin)
CREATE POLICY "Authenticated users can view submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- TABLA: blog_entries (Entradas del blog)
-- =============================================
CREATE TABLE public.blog_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT NOT NULL DEFAULT 'Equipo Compuchiapas',
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_entries ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer entradas publicadas
CREATE POLICY "Anyone can view published blog entries"
ON public.blog_entries
FOR SELECT
USING (is_published = true);

-- Política: Usuarios autenticados pueden gestionar (futura admin)
CREATE POLICY "Authenticated users can manage blog entries"
ON public.blog_entries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- TABLA: categories (Categorías de productos)
-- =============================================
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver categorías activas
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Política: Usuarios autenticados pueden gestionar
CREATE POLICY "Authenticated users can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- TABLA: products (Productos)
-- =============================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  price_numeric DECIMAL(10,2),
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  specs TEXT[] DEFAULT '{}',
  description TEXT,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver productos activos
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Política: Usuarios autenticados pueden gestionar
CREATE POLICY "Authenticated users can manage products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- TABLA: newsletter_subscriptions (Suscripciones al boletín)
-- =============================================
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede suscribirse
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

-- Política: Usuarios autenticados pueden ver suscripciones
CREATE POLICY "Authenticated users can view subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- TABLA: service_requests (Solicitudes de servicio)
-- =============================================
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  device_type TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede crear solicitudes de servicio
CREATE POLICY "Anyone can submit service request"
ON public.service_requests
FOR INSERT
WITH CHECK (true);

-- Política: Usuarios autenticados pueden ver solicitudes
CREATE POLICY "Authenticated users can view service requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- FUNCIÓN: Actualizar timestamp updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_entries_updated_at
  BEFORE UPDATE ON public.blog_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DATOS INICIALES: Categorías
-- =============================================
INSERT INTO public.categories (id, name, display_order) VALUES
  ('all', 'Todos', 0),
  ('laptops', 'Laptops', 1),
  ('desktops', 'Computadoras', 2),
  ('components', 'Componentes', 3),
  ('accessories', 'Accesorios', 4),
  ('printers', 'Impresoras', 5),
  ('network', 'Redes', 6),
  ('consumables', 'Consumibles', 7);