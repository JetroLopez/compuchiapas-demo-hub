-- Allow anonymous users to create web orders (public checkout)
CREATE POLICY "Anyone can create web orders"
ON public.web_orders
FOR INSERT
TO anon
WITH CHECK (true);
