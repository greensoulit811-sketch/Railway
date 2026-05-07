-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    is_new BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Slider slides table
CREATE TABLE public.slider_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    heading TEXT NOT NULL,
    text TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    cta_link TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_method TEXT NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store settings table
CREATE TABLE public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Security definer function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies

-- User roles: only admins can see all, users can see their own
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles: users can manage their own
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Categories: public read, admin write
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin(auth.uid()));

-- Products: public read, admin write
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.is_admin(auth.uid()));

-- Slider slides: public read active, admin write
CREATE POLICY "Anyone can view active slides" ON public.slider_slides
    FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage slides" ON public.slider_slides
    FOR ALL USING (public.is_admin(auth.uid()));

-- Orders: users can view their own, admins can view all
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Order items: same as orders
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Store settings: public read, admin write
CREATE POLICY "Anyone can view settings" ON public.store_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.store_settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- Reviews: public read approved, admin manages all
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true OR public.is_admin(auth.uid()));

CREATE POLICY "Anyone can submit reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add timestamp triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slider_slides_updated_at BEFORE UPDATE ON public.slider_slides
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default store settings
INSERT INTO public.store_settings (key, value) VALUES
    ('store_name', 'Swift Cart'),
    ('store_email', 'hello@swiftcart.com'),
    ('store_phone', '+880 1234 567890'),
    ('store_address', '123 Store Street, Gulshan-1, Dhaka 1212, Bangladesh'),
    ('shipping_inside_dhaka', '60'),
    ('shipping_outside_dhaka', '120'),
    ('site_title', 'Swift Cart - Premium Clothing Store'),
    ('meta_description', 'Discover elegantly designed dresses and clothing for every occasion at Swift Cart with fast delivery across Bangladesh.');

-- Insert default categories
INSERT INTO public.categories (name, slug, image) VALUES
    ('Dresses', 'dresses', 'https://images.unsplash.com/photo-1595777457583-95e059f581ce?w=600&q=80'),
    ('Tops', 'tops', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80'),
    ('Bottoms', 'bottoms', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'),
    ('Accessories', 'accessories', 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&q=80');

-- Insert default slider slides
INSERT INTO public.slider_slides (image, heading, text, cta_text, cta_link, sort_order) VALUES
    ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80', 'Summer Dress Collection', 'Discover elegant styles for the warm season', 'Shop Dresses', '/shop?category=dresses', 1),
    ('https://images.unsplash.com/photo-1549298240-0d8e60513026?w=1920&q=80', 'Evening Elegance', 'Stunning gowns for your special moments', 'View Collection', '/shop?category=dresses', 2),
    ('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80', 'New Arrivals', 'Update your wardrobe with the latest trends', 'Explore', '/shop', 3);

-- Insert approved sample reviews
INSERT INTO public.reviews (name, rating, text, is_approved) VALUES
    ('Sarah Johnson', 5, 'Absolutely love the quality of products here! Fast shipping and excellent customer service.', true),
    ('Michael Chen', 5, 'The headphones I bought exceeded my expectations. Will definitely shop here again!', true),
    ('Emily Davis', 4, 'Great selection and competitive prices. The checkout process was smooth and easy.', true);
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
-- Create storage bucket for shop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to shop images
CREATE POLICY "Public can view shop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload shop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-images' AND is_admin(auth.uid()));

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update shop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shop-images' AND is_admin(auth.uid()));

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete shop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-images' AND is_admin(auth.uid()));
-- Create site_settings table for global configuration
CREATE TABLE public.site_settings (
    id text PRIMARY KEY DEFAULT 'global',
    default_country_code text NOT NULL DEFAULT 'BD',
    default_country_name text NOT NULL DEFAULT 'Bangladesh',
    currency_code text NOT NULL DEFAULT 'BDT',
    currency_symbol text NOT NULL DEFAULT '৳',
    currency_locale text NOT NULL DEFAULT 'bn-BD',
    language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'bn')),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can insert settings (for initial setup)
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Insert default settings row
INSERT INTO public.site_settings (id) VALUES ('global');

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add unique constraint on key column for store_settings to enable upsert
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_key_unique UNIQUE (key);
-- Add Facebook Pixel and cookie consent fields to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS fb_pixel_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fb_pixel_id text,
ADD COLUMN IF NOT EXISTS fb_pixel_test_event_code text,
ADD COLUMN IF NOT EXISTS cookie_consent_enabled boolean NOT NULL DEFAULT false;
-- Add theme color field to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#e85a4f';

-- Update existing record with default theme color
UPDATE public.site_settings 
SET theme_accent_color = '#e85a4f' 
WHERE id = 'global' AND theme_accent_color IS NULL;
-- Add courier fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS courier_provider text,
ADD COLUMN IF NOT EXISTS courier_status text,
ADD COLUMN IF NOT EXISTS courier_tracking_id text,
ADD COLUMN IF NOT EXISTS courier_consignment_id text,
ADD COLUMN IF NOT EXISTS courier_reference text,
ADD COLUMN IF NOT EXISTS courier_payload jsonb,
ADD COLUMN IF NOT EXISTS courier_response jsonb,
ADD COLUMN IF NOT EXISTS courier_created_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS courier_updated_at timestamp with time zone;

-- Create courier_settings table for storing API credentials securely
CREATE TABLE public.courier_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL UNIQUE,
    enabled boolean DEFAULT false,
    api_base_url text,
    api_key text,
    api_secret text,
    merchant_id text,
    pickup_address text,
    pickup_phone text,
    default_weight numeric DEFAULT 0.5,
    cod_enabled boolean DEFAULT true,
    show_tracking_to_customer boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage courier settings
CREATE POLICY "Admins can manage courier settings"
ON public.courier_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Create courier_logs table for tracking API interactions
CREATE TABLE public.courier_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    provider text NOT NULL,
    action text NOT NULL,
    status text,
    message text,
    request_payload jsonb,
    response_payload jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view courier logs
CREATE POLICY "Admins can view courier logs"
ON public.courier_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert logs
CREATE POLICY "Admins can insert courier logs"
ON public.courier_logs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_courier_tracking ON public.orders(courier_tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_consignment ON public.orders(courier_consignment_id);
CREATE INDEX IF NOT EXISTS idx_courier_logs_order_id ON public.courier_logs(order_id);

-- Add trigger for updated_at on courier_settings
CREATE TRIGGER update_courier_settings_updated_at
BEFORE UPDATE ON public.courier_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- =============================================
-- PHASE 6: Staff Roles - Add enum values first
-- =============================================

-- Extend the existing app_role enum to include manager and order_handler
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_handler';
-- Staff Role Functions
CREATE OR REPLACE FUNCTION public.has_any_staff_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'manager', 'order_handler')
    )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_orders(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'manager', 'order_handler')
    )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'manager')
    )
$$;
-- Create product_variants table
CREATE TABLE public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    sku TEXT NOT NULL,
    price_adjustment NUMERIC DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variants"
ON public.product_variants FOR SELECT
USING ((is_active = true) OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage variants"
ON public.product_variants FOR ALL
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
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
-- Create shipping_methods table for configurable shipping options
CREATE TABLE public.shipping_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active shipping methods
CREATE POLICY "Anyone can view active shipping methods"
ON public.shipping_methods
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Admins can manage shipping methods
CREATE POLICY "Admins can manage shipping methods"
ON public.shipping_methods
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_methods_updated_at
BEFORE UPDATE ON public.shipping_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shipping methods
INSERT INTO public.shipping_methods (name, description, base_rate, estimated_days, sort_order) VALUES
('Standard Delivery', 'Regular delivery service', 0, '3-5 days', 1),
('Express Delivery', 'Fast delivery service', 50, '1-2 days', 2);
-- Create checkout_leads table
CREATE TABLE public.checkout_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_no TEXT NOT NULL UNIQUE,
  lead_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'invalid')),
  source TEXT NOT NULL DEFAULT 'checkout',
  
  -- Customer info
  customer_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  
  -- Cart snapshot
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'BDT',
  
  -- Meta
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Conversion
  converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- Create index for deduplication lookup
CREATE INDEX idx_checkout_leads_phone_created ON public.checkout_leads(phone, created_at DESC);
CREATE INDEX idx_checkout_leads_status ON public.checkout_leads(status);
CREATE INDEX idx_checkout_leads_lead_token ON public.checkout_leads(lead_token);

-- Enable RLS
ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

-- Public users can insert new leads
CREATE POLICY "Anyone can create leads"
ON public.checkout_leads
FOR INSERT
WITH CHECK (true);

-- Public users can update only their own lead using lead_token
CREATE POLICY "Users can update their own leads"
ON public.checkout_leads
FOR UPDATE
USING (lead_token = current_setting('app.lead_token', true));

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.checkout_leads
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all leads
CREATE POLICY "Admins can update all leads"
ON public.checkout_leads
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.checkout_leads
FOR DELETE
USING (is_admin(auth.uid()));

-- Function to generate lead number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(lead_no, '^LEAD-' || year_str || '-', ''), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.checkout_leads
  WHERE lead_no LIKE 'LEAD-' || year_str || '-%';
  
  NEW.lead_no := 'LEAD-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-generating lead_no
CREATE TRIGGER trigger_generate_lead_number
BEFORE INSERT ON public.checkout_leads
FOR EACH ROW
WHEN (NEW.lead_no IS NULL OR NEW.lead_no = '')
EXECUTE FUNCTION public.generate_lead_number();

-- Trigger for updating updated_at
CREATE TRIGGER update_checkout_leads_updated_at
BEFORE UPDATE ON public.checkout_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add expanded theme color columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand_primary text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS brand_secondary text DEFAULT '#f0f0f0',
  ADD COLUMN IF NOT EXISTS brand_accent text DEFAULT '#e85a4f',
  ADD COLUMN IF NOT EXISTS brand_background text DEFAULT '#faf9f7',
  ADD COLUMN IF NOT EXISTS brand_foreground text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS brand_muted text DEFAULT '#6b7280',
  ADD COLUMN IF NOT EXISTS brand_border text DEFAULT '#e5e7eb',
  ADD COLUMN IF NOT EXISTS brand_card text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS brand_radius text DEFAULT '0.5';

-- Add Conversion API fields to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS fb_capi_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fb_capi_dataset_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_capi_test_event_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_capi_api_version text NOT NULL DEFAULT 'v20.0';

-- Create a secure table for CAPI secrets
-- RLS enabled with NO policies = only service_role can access
CREATE TABLE public.capi_secrets (
  id text PRIMARY KEY DEFAULT 'global',
  access_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capi_secrets ENABLE ROW LEVEL SECURITY;

-- Insert default row
INSERT INTO public.capi_secrets (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Add is_active column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update handle_new_user to set is_active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, email, is_active)
    VALUES (NEW.id, NEW.email, true);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$function$;

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  instructions text,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  allow_partial_delivery_payment boolean NOT NULL DEFAULT false,
  partial_type text DEFAULT 'delivery_charge',
  fixed_partial_amount numeric,
  require_transaction_id boolean NOT NULL DEFAULT false,
  provider_fields jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled payment methods"
ON public.payment_methods FOR SELECT
USING (is_enabled = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (is_admin(auth.uid()));

-- Add payment tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS payment_method_name text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS partial_rule_snapshot jsonb;

-- Insert default COD payment method
INSERT INTO public.payment_methods (name, code, description, sort_order)
VALUES ('Cash on Delivery', 'cod', 'Pay when you receive your order', 0);

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (is_admin(auth.uid()));

-- Add 'confirmed' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'pending';

-- Add fb_purchase_sent column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fb_purchase_sent boolean NOT NULL DEFAULT false;

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

-- Add is_variable flag to products (default false = simple product)
ALTER TABLE public.products ADD COLUMN is_variable boolean NOT NULL DEFAULT false;

-- Add variant_price to product_variants (independent price per variant)
ALTER TABLE public.product_variants ADD COLUMN variant_price numeric NULL;
ALTER TABLE public.site_settings ADD COLUMN show_stock_to_visitors boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN hide_stock boolean NOT NULL DEFAULT false;

-- Customer courier history cache table
CREATE TABLE public.customer_courier_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  total_parcels INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  returned_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  in_transit_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  return_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_delivery_date TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  recent_parcels JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'steadfast',
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cache_expire_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

-- Enable RLS
ALTER TABLE public.customer_courier_history ENABLE ROW LEVEL SECURITY;

-- Only staff can read
CREATE POLICY "Staff can view courier history"
ON public.customer_courier_history
FOR SELECT
TO authenticated
USING (public.has_any_staff_role(auth.uid()));

-- Only staff can insert/update
CREATE POLICY "Staff can manage courier history"
ON public.customer_courier_history
FOR ALL
TO authenticated
USING (public.has_any_staff_role(auth.uid()))
WITH CHECK (public.has_any_staff_role(auth.uid()));

-- Index for fast phone lookup
CREATE INDEX idx_customer_courier_history_phone ON public.customer_courier_history(phone);

-- Trigger for updated_at
CREATE TRIGGER update_customer_courier_history_updated_at
BEFORE UPDATE ON public.customer_courier_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.product_variants ADD COLUMN variant_sale_price numeric NULL;
ALTER TABLE public.products ADD COLUMN specifications jsonb NULL DEFAULT NULL;
