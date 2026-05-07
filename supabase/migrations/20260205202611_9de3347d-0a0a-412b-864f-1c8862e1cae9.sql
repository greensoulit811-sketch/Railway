-- Add variant columns to order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_info JSONB;

-- RLS Policy Updates for Staff Roles
DROP POLICY IF EXISTS "Users can view their own orders or admins all" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders or staff all" ON public.orders;
CREATE POLICY "Users can view their own orders or staff all"
ON public.orders FOR SELECT
USING ((user_id = auth.uid()) OR can_manage_orders(auth.uid()) OR (user_id IS NULL));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
USING (can_manage_orders(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff can manage products" ON public.products;
CREATE POLICY "Staff can manage products"
ON public.products FOR ALL
USING (can_manage_products(auth.uid()));