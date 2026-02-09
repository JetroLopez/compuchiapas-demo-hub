
-- Fix 1: Remove overly permissive public SELECT policy on special_orders
DROP POLICY IF EXISTS "Anyone can search orders by folio" ON public.special_orders;

-- Create secure RPC for public folio search (limited fields, exact match only)
CREATE OR REPLACE FUNCTION public.search_order_by_folio(p_folio text)
RETURNS TABLE(
  folio_ingreso text,
  folio_servicio text,
  remision text,
  estatus text,
  fecha_aprox_entrega date,
  producto text,
  comentarios text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input: reject empty or oversized input
  IF p_folio IS NULL OR length(trim(p_folio)) = 0 OR length(p_folio) > 50 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    so.folio_ingreso,
    so.folio_servicio,
    so.remision,
    so.estatus::text,
    so.fecha_aprox_entrega,
    so.producto,
    so.comentarios
  FROM public.special_orders so
  WHERE so.estatus != 'Entregado'
    AND (
      so.folio_ingreso = trim(p_folio)
      OR so.remision = trim(p_folio)
      OR so.folio_servicio = trim(p_folio)
    );
END;
$$;

-- Fix 2: Add VARCHAR constraints to prevent oversized data injection
ALTER TABLE public.contact_submissions
  ALTER COLUMN name TYPE VARCHAR(100),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN phone TYPE VARCHAR(20),
  ALTER COLUMN subject TYPE VARCHAR(200),
  ALTER COLUMN message TYPE VARCHAR(5000);

ALTER TABLE public.web_orders
  ALTER COLUMN phone TYPE VARCHAR(20),
  ALTER COLUMN billing_data TYPE VARCHAR(1000),
  ALTER COLUMN notes TYPE VARCHAR(1000);

-- Fix 3: Update submit_contact with server-side input validation
CREATE OR REPLACE FUNCTION public.submit_contact(p_name text, p_email text, p_phone text, p_subject text, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Validate required fields are not empty
  IF trim(coalesce(p_name, '')) = '' OR trim(coalesce(p_email, '')) = '' OR trim(coalesce(p_subject, '')) = '' OR trim(coalesce(p_message, '')) = '' THEN
    RAISE EXCEPTION 'Required fields cannot be empty';
  END IF;

  -- Validate input lengths
  IF length(p_name) > 100 THEN
    RAISE EXCEPTION 'Name exceeds maximum length';
  END IF;
  IF length(p_email) > 255 THEN
    RAISE EXCEPTION 'Email exceeds maximum length';
  END IF;
  IF length(p_phone) > 20 THEN
    RAISE EXCEPTION 'Phone exceeds maximum length';
  END IF;
  IF length(p_subject) > 200 THEN
    RAISE EXCEPTION 'Subject exceeds maximum length';
  END IF;
  IF length(p_message) > 5000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length';
  END IF;

  -- Validate email format
  IF p_email !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  INSERT INTO contact_submissions (name, email, phone, subject, message)
  VALUES (trim(p_name), trim(p_email), trim(p_phone), trim(p_subject), trim(p_message))
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
