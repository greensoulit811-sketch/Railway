
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
