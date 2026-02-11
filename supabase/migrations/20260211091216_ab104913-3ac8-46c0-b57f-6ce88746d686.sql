
-- Allow supervisor and ventas roles to also update store_settings
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;

CREATE POLICY "Admins supervisors ventas can update store settings"
ON public.store_settings
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'ventas'::app_role)
);
