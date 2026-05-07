
-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  instructions text,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  allow_partial_delivery_payment boolean NOT NULL DEFAULT false,
  partial_type text DEFAULT 'delivery_charge',
  fixed_partial_amount numeric,
  require_transaction_id boolean NOT NULL DEFAULT false,
  provider_fields jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled payment methods"
ON public.payment_methods FOR SELECT
USING (is_enabled = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (is_admin(auth.uid()));

-- Add payment tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS payment_method_name text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS partial_rule_snapshot jsonb;

-- Insert default COD payment method
INSERT INTO public.payment_methods (name, code, description, sort_order)
VALUES ('Cash on Delivery', 'cod', 'Pay when you receive your order', 0);

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
