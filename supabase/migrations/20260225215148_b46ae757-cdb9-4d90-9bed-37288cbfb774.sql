
-- Clean up por_surtir entries where another product with same clave has stock
DELETE FROM products_por_surtir
WHERE id IN (
  SELECT ps.id
  FROM products_por_surtir ps
  WHERE EXISTS (
    SELECT 1 FROM products p2
    JOIN product_warehouse_stock pws ON pws.product_id = p2.id
    WHERE p2.clave = ps.clave AND p2.id != ps.product_id AND pws.existencias > 0
  )
);
