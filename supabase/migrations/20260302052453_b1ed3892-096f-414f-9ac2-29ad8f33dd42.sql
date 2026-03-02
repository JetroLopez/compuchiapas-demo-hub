
CREATE TABLE public.page_visibility (
  id text PRIMARY KEY,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visibility ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage page visibility"
  ON public.page_visibility
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read (needed for nav/routing)
CREATE POLICY "Anyone can read page visibility"
  ON public.page_visibility
  FOR SELECT
  USING (true);

-- Seed default pages
INSERT INTO public.page_visibility (id, is_visible) VALUES
  ('inicio', true),
  ('servicios', true),
  ('productos', true),
  ('software-esd', true),
  ('blog', true),
  ('contacto', true),
  ('admin', true);
