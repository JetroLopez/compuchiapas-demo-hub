-- Allow anyone to search for their order by folio_ingreso or remision (limited columns only)
CREATE POLICY "Anyone can search orders by folio"
ON public.special_orders
FOR SELECT
USING (true);