
CREATE OR REPLACE FUNCTION public.create_web_order(
  p_phone text,
  p_payment_method text,
  p_delivery_method text,
  p_items jsonb,
  p_subtotal numeric,
  p_requires_quote boolean,
  p_billing_data text DEFAULT NULL,
  p_shipping_option text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number integer;
BEGIN
  -- Validate required fields
  IF trim(coalesce(p_phone, '')) = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  IF length(p_phone) > 20 THEN
    RAISE EXCEPTION 'Phone exceeds maximum length';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items cannot be empty';
  END IF;

  INSERT INTO public.web_orders (phone, payment_method, delivery_method, items, subtotal, requires_quote, billing_data, shipping_option)
  VALUES (trim(p_phone), p_payment_method, p_delivery_method, p_items, p_subtotal, p_requires_quote, p_billing_data, p_shipping_option)
  RETURNING order_number INTO v_order_number;

  RETURN v_order_number;
END;
$$;
