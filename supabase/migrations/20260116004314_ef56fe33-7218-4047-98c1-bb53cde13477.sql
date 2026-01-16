-- Add policy to allow technicians to update internal status of services
CREATE POLICY "Tecnicos can update estatus_interno"
ON public.services
FOR UPDATE
USING (has_role(auth.uid(), 'tecnico'::app_role))
WITH CHECK (has_role(auth.uid(), 'tecnico'::app_role));