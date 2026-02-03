-- Create web_orders table for storing orders from the website
CREATE TABLE public.web_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL UNIQUE,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  delivery_method TEXT CHECK (delivery_method IN ('pickup', 'delivery')),
  items JSONB NOT NULL, -- Array of {product_id, promotion_id, name, quantity, price, image_url}
  subtotal NUMERIC,
  requires_quote BOOLEAN NOT NULL DEFAULT false,
  billing_data TEXT, -- Structured billing info as single text field
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.web_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create orders" 
ON public.web_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins and ventas can view all orders" 
ON public.web_orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Admins and ventas can update orders" 
ON public.web_orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Only admin can delete orders" 
ON public.web_orders 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_web_orders_updated_at
BEFORE UPDATE ON public.web_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();