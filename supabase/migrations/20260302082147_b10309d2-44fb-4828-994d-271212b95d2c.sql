
-- Add is_variable flag to products (default false = simple product)
ALTER TABLE public.products ADD COLUMN is_variable boolean NOT NULL DEFAULT false;

-- Add variant_price to product_variants (independent price per variant)
ALTER TABLE public.product_variants ADD COLUMN variant_price numeric NULL;
