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