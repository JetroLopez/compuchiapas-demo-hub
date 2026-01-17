-- Permitir que clientes anónimos/autenticados ejecuten la validación sin exponer datos
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO authenticated;