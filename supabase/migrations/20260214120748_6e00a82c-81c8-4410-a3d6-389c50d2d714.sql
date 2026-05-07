
-- Add 'confirmed' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'pending';

-- Add fb_purchase_sent column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fb_purchase_sent boolean NOT NULL DEFAULT false;
