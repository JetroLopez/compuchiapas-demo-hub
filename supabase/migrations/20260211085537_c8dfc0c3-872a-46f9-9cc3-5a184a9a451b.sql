
-- Drop the duplicate restrictive INSERT policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.web_orders;
DROP POLICY IF EXISTS "Anyone can create web orders" ON public.web_orders;

-- Create a single PERMISSIVE INSERT policy for anonymous users
CREATE POLICY "Anyone can create web orders permissive"
ON public.web_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
