-- Create shipping_methods table for configurable shipping options
CREATE TABLE public.shipping_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active shipping methods
CREATE POLICY "Anyone can view active shipping methods"
ON public.shipping_methods
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Admins can manage shipping methods
CREATE POLICY "Admins can manage shipping methods"
ON public.shipping_methods
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_methods_updated_at
BEFORE UPDATE ON public.shipping_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shipping methods
INSERT INTO public.shipping_methods (name, description, base_rate, estimated_days, sort_order) VALUES
('Standard Delivery', 'Regular delivery service', 0, '3-5 days', 1),
('Express Delivery', 'Fast delivery service', 50, '1-2 days', 2);