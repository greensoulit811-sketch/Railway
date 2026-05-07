
-- Create landing pages table
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hero section
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT,
  hero_image TEXT,
  hero_cta_text TEXT NOT NULL DEFAULT 'Order Now',
  
  -- Products (up to 5 product IDs)
  product_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- How to use section (JSONB array of {image, title, description})
  how_to_use_cards JSONB NOT NULL DEFAULT '[]',
  
  -- Reviews section
  show_reviews BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active landing pages
CREATE POLICY "Anyone can view active landing pages"
ON public.landing_pages
FOR SELECT
USING ((is_active = true) OR is_admin(auth.uid()));

-- Admins can manage landing pages
CREATE POLICY "Admins can manage landing pages"
ON public.landing_pages
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
