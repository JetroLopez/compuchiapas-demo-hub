
-- Create hero_slides table for landing page carousel
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public read for active slides
CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can manage hero slides"
ON public.hero_slides FOR ALL
USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Ventas can manage hero slides"
ON public.hero_slides FOR ALL
USING (public.has_role(auth.uid(), 'ventas'));

-- Trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert placeholder slides
INSERT INTO public.hero_slides (title, subtitle, image_url, link_url, display_order) VALUES
('Semana de Hardware', 'Hasta 15% OFF en productos seleccionados', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&h=500&fit=crop', '/productos', 1),
('Arma tu PC Gamer', 'Los mejores componentes al mejor precio', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&h=500&fit=crop', '/productos/arma-tu-pc', 2),
('Servicio Técnico Profesional', 'Reparamos tu equipo con garantía', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&h=500&fit=crop', '/servicios', 3);

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-images', 'hero-images', true);

CREATE POLICY "Anyone can view hero images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

CREATE POLICY "Authenticated users can upload hero images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hero images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete hero images"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-images' AND auth.role() = 'authenticated');
