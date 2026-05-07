-- =============================================
-- PHASE 6: Staff Roles - Add enum values first
-- =============================================

-- Extend the existing app_role enum to include manager and order_handler
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_handler';