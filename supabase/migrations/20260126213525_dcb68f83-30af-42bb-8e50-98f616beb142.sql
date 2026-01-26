-- Add costo column to products table
ALTER TABLE public.products 
ADD COLUMN costo numeric DEFAULT 0;