-- Add unique constraint on key column for store_settings to enable upsert
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_key_unique UNIQUE (key);