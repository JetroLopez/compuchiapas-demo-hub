-- Drop the unique constraint on clave to allow products with same code but different descriptions
-- Products will be identified by CLAVE + NAME (DESCRIPCION) combination instead
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_clave_key;