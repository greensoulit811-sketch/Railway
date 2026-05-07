-- Add Facebook Pixel and cookie consent fields to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS fb_pixel_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fb_pixel_id text,
ADD COLUMN IF NOT EXISTS fb_pixel_test_event_code text,
ADD COLUMN IF NOT EXISTS cookie_consent_enabled boolean NOT NULL DEFAULT false;