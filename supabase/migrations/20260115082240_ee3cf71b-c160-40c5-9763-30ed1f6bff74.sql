-- Add UPDATE policy for admins on contact_submissions
CREATE POLICY "Admins can update submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));