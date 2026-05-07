
-- Homepage Templates
CREATE TABLE public.homepage_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  preview_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.homepage_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.homepage_templates FOR ALL USING (is_admin(auth.uid()));

-- Homepage Sections
CREATE TABLE public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.homepage_templates(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  layout_style text NOT NULL DEFAULT 'grid',
  product_source text DEFAULT 'category',
  product_source_value text DEFAULT '',
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage sections" ON public.homepage_sections FOR ALL USING (is_admin(auth.uid()));

-- Homepage Banners
CREATE TABLE public.homepage_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.homepage_templates(id) ON DELETE CASCADE,
  image text NOT NULL DEFAULT '',
  link text DEFAULT '',
  alt_text text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.homepage_banners FOR SELECT USING ((is_active = true) OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage banners" ON public.homepage_banners FOR ALL USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_homepage_templates_updated_at BEFORE UPDATE ON public.homepage_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_banners_updated_at BEFORE UPDATE ON public.homepage_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 4 default templates
INSERT INTO public.homepage_templates (name, label, is_active) VALUES
  ('default', 'Default (Current)', true),
  ('grocery', 'Grocery', false),
  ('cosmetics', 'Cosmetics', false),
  ('gadgets', 'Gadgets', false),
  ('furniture', 'Furniture', false);

-- Seed default sections for grocery
INSERT INTO public.homepage_sections (template_id, section_type, title, subtitle, sort_order, settings_json) VALUES
  ((SELECT id FROM public.homepage_templates WHERE name = 'grocery'), 'category_icons', 'Shop by Category', 'Browse essentials', 1, '{"columns": 6}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'grocery'), 'flash_sale', 'Flash Sale', 'Grab before it ends!', 2, '{"countdown_hours": 24}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'grocery'), 'product_grid', 'Daily Essentials', 'Everything you need', 3, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'grocery'), 'combo_offers', 'Combo Offers', 'Save more with bundles', 4, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'grocery'), 'delivery_strip', 'We Deliver Fast', '', 5, '{"promise_text": "Same day delivery available"}'::jsonb);

-- Seed sections for cosmetics
INSERT INTO public.homepage_sections (template_id, section_type, title, subtitle, sort_order, settings_json) VALUES
  ((SELECT id FROM public.homepage_templates WHERE name = 'cosmetics'), 'hero_banner', 'Premium Beauty', 'Glow from within', 1, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'cosmetics'), 'shop_by_concern', 'Shop by Concern', 'Find your perfect match', 2, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'cosmetics'), 'brand_slider', 'Top Brands', 'Trusted brands we carry', 3, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'cosmetics'), 'best_sellers', 'Best Sellers', 'Most loved products', 4, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'cosmetics'), 'ingredient_highlight', 'Ingredient Spotlight', 'Know what goes on your skin', 5, '{}'::jsonb);

-- Seed sections for gadgets
INSERT INTO public.homepage_sections (template_id, section_type, title, subtitle, sort_order, settings_json) VALUES
  ((SELECT id FROM public.homepage_templates WHERE name = 'gadgets'), 'featured_hero', 'Featured Gadget', 'Top specs, best price', 1, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'gadgets'), 'hot_deals', 'Hot Deals', 'Limited time offers', 2, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'gadgets'), 'shop_by_brand', 'Shop by Brand', 'All your favorite brands', 3, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'gadgets'), 'comparison_block', 'Compare Products', 'Side by side specs', 4, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'gadgets'), 'warranty_strip', 'Warranty & Support', '', 5, '{"warranty_text": "1 Year Official Warranty"}'::jsonb);

-- Seed sections for furniture
INSERT INTO public.homepage_sections (template_id, section_type, title, subtitle, sort_order, settings_json) VALUES
  ((SELECT id FROM public.homepage_templates WHERE name = 'furniture'), 'visual_hero', 'Transform Your Space', 'Premium furniture collection', 1, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'furniture'), 'shop_by_room', 'Shop by Room', 'Living, Bedroom, Kitchen & more', 2, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'furniture'), 'featured_collections', 'Featured Collections', 'Curated for you', 3, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'furniture'), 'material_highlight', 'Materials & Sizes', 'Quality you can trust', 4, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'furniture'), 'customer_gallery', 'Customer Homes', 'Real homes, real style', 5, '{}'::jsonb);

-- Seed sections for default template
INSERT INTO public.homepage_sections (template_id, section_type, title, subtitle, sort_order, settings_json) VALUES
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'hero_slider', 'Hero Slider', '', 1, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'featured_categories', 'Featured Categories', '', 2, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'featured_products', 'Featured Products', '', 3, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'new_arrivals', 'New Arrivals', '', 4, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'best_sellers', 'Best Sellers', '', 5, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'customer_reviews', 'Customer Reviews', '', 6, '{}'::jsonb),
  ((SELECT id FROM public.homepage_templates WHERE name = 'default'), 'newsletter', 'Newsletter', '', 7, '{}'::jsonb);
