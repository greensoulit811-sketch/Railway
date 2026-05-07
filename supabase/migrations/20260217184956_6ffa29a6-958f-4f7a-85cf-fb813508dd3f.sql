
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id),
  UNIQUE(product_id, session_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Anyone can read wishlists (guest sessions need access)
CREATE POLICY "Wishlists are readable by everyone"
  ON public.wishlists FOR SELECT USING (true);

-- Anyone can insert (guests and authenticated)
CREATE POLICY "Anyone can add to wishlist"
  ON public.wishlists FOR INSERT WITH CHECK (true);

-- Anyone can delete their own wishlist items
CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlists FOR DELETE USING (
    (auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL)
  );
