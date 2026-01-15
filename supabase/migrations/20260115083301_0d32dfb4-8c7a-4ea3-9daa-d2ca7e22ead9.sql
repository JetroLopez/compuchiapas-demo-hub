-- Drop the old check constraint
ALTER TABLE public.contact_submissions DROP CONSTRAINT contact_submissions_status_check;

-- Add new check constraint with 'contacted' value
ALTER TABLE public.contact_submissions 
ADD CONSTRAINT contact_submissions_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'contacted'::text, 'resolved'::text, 'archived'::text]));

-- Drop existing admin-only UPDATE policy
DROP POLICY IF EXISTS "Admins can update submissions" ON public.contact_submissions;

-- Create new UPDATE policy for admin and ventas roles
CREATE POLICY "Admins and ventas can update submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));