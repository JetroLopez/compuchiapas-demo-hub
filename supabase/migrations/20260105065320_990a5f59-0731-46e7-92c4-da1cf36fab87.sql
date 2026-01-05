-- Add unique constraint on clave column for upsert functionality
ALTER TABLE public.products ADD CONSTRAINT products_clave_key UNIQUE (clave);