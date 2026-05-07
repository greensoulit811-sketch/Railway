-- Add theme color field to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#e85a4f';

-- Update existing record with default theme color
UPDATE public.site_settings 
SET theme_accent_color = '#e85a4f' 
WHERE id = 'global' AND theme_accent_color IS NULL;