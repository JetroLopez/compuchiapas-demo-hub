
-- Add shipping_option column to web_orders table
ALTER TABLE public.web_orders 
ADD COLUMN shipping_option TEXT DEFAULT NULL;

-- Create a table for the price visibility setting (real-time sync)
CREATE TABLE public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  show_public_prices BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read store settings
CREATE POLICY "Anyone can read store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Only admins can update store settings
CREATE POLICY "Admins can update store settings"
ON public.store_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Insert default row
INSERT INTO public.store_settings (id, show_public_prices) VALUES ('main', false);

-- Enable realtime for store_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
