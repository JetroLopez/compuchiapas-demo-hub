
-- Remove all por_surtir entries where another product with same clave (ignoring leading zeros) has stock
DELETE FROM products_por_surtir
WHERE id IN (
  SELECT ps.id
  FROM products_por_surtir ps
  WHERE EXISTS (
    SELECT 1 FROM products p3
    JOIN product_warehouse_stock pws2 ON pws2.product_id = p3.id
    WHERE LTRIM(p3.clave, '0') = LTRIM(ps.clave, '0') AND p3.clave != ps.clave AND pws2.existencias > 0
  )
);
