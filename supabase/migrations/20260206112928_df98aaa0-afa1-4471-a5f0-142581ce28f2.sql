
-- Add Conversion API fields to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS fb_capi_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fb_capi_dataset_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_capi_test_event_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_capi_api_version text NOT NULL DEFAULT 'v20.0';
