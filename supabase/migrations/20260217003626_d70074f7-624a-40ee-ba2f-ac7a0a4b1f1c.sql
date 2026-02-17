
-- Agregar warehouse_id a products_por_surtir
ALTER TABLE products_por_surtir 
  ADD COLUMN warehouse_id uuid REFERENCES warehouses(id);

-- Funcion para obtener stock total de un producto
CREATE OR REPLACE FUNCTION get_product_total_stock(p_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(existencias), 0)::integer
  FROM product_warehouse_stock
  WHERE product_id = p_id;
$$ LANGUAGE sql STABLE;
