
-- Customer courier history cache table
CREATE TABLE public.customer_courier_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  total_parcels INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  returned_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  in_transit_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  return_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_delivery_date TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  recent_parcels JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'steadfast',
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cache_expire_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

-- Enable RLS
ALTER TABLE public.customer_courier_history ENABLE ROW LEVEL SECURITY;

-- Only staff can read
CREATE POLICY "Staff can view courier history"
ON public.customer_courier_history
FOR SELECT
TO authenticated
USING (public.has_any_staff_role(auth.uid()));

-- Only staff can insert/update
CREATE POLICY "Staff can manage courier history"
ON public.customer_courier_history
FOR ALL
TO authenticated
USING (public.has_any_staff_role(auth.uid()))
WITH CHECK (public.has_any_staff_role(auth.uid()));

-- Index for fast phone lookup
CREATE INDEX idx_customer_courier_history_phone ON public.customer_courier_history(phone);

-- Trigger for updated_at
CREATE TRIGGER update_customer_courier_history_updated_at
BEFORE UPDATE ON public.customer_courier_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
