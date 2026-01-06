-- Fix: Restrict contact_submissions SELECT access to admins only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON public.contact_submissions;

-- Create new policy that only allows admins to view contact submissions
CREATE POLICY "Admins can view submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));