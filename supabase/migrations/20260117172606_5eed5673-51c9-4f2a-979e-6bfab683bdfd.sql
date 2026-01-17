-- Crear función que verifica si un teléfono normalizado ya existe
-- Esta función se ejecuta con privilegios elevados (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_input text;
  phone_exists boolean;
BEGIN
  -- Normalizar el teléfono de entrada (solo dígitos)
  normalized_input := regexp_replace(phone_to_check, '\D', '', 'g');
  
  -- Verificar si existe algún teléfono normalizado que coincida
  SELECT EXISTS(
    SELECT 1 FROM contact_submissions
    WHERE regexp_replace(phone, '\D', '', 'g') = normalized_input
  ) INTO phone_exists;
  
  RETURN phone_exists;
END;
$$;