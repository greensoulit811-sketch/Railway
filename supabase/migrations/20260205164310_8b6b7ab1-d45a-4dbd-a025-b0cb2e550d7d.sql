-- Fix overly permissive INSERT policies

-- Drop the permissive policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;

-- Create more restrictive policies
-- Orders: anyone can create but user_id must match if logged in, or be null for guest checkout
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );

-- Order items: can only insert for orders that belong to the user or are guest orders
CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
        )
    );

-- Reviews: anyone can submit (this is intentionally permissive for public review submission)
-- But we add basic validation that required fields are present
CREATE POLICY "Anyone can submit reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        name IS NOT NULL AND 
        text IS NOT NULL AND 
        rating >= 1 AND 
        rating <= 5
    );