-- Add is_active columns to categories and products
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add line_total to order_items for easier queries
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS line_total numeric GENERATED ALWAYS AS (price * quantity) STORED;

-- Update RLS policies to filter by is_active for public users

-- Drop existing policies and recreate with is_active filter
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

-- Allow anonymous users to insert orders (for checkout)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to insert order items
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders or admins all" 
ON public.orders 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin(auth.uid()) OR user_id IS NULL);

-- Allow admins to view all order items
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR is_admin(auth.uid()) OR orders.user_id IS NULL)
  )
);