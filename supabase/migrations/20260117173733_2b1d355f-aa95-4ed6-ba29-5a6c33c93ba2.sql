-- Función para insertar un contacto y devolver el ID
-- Usa SECURITY DEFINER para bypass RLS en el SELECT del ID
CREATE OR REPLACE FUNCTION public.submit_contact(
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO contact_submissions (name, email, phone, subject, message)
  VALUES (p_name, p_email, p_phone, p_subject, p_message)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Permitir que usuarios anónimos y autenticados ejecuten la función
GRANT EXECUTE ON FUNCTION public.submit_contact(text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_contact(text, text, text, text, text) TO authenticated;