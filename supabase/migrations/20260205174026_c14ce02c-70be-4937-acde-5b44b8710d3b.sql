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