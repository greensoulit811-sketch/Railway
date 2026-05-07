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