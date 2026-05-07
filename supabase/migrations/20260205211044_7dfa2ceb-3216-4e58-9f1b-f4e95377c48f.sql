-- Create checkout_leads table
CREATE TABLE public.checkout_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_no TEXT NOT NULL UNIQUE,
  lead_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'invalid')),
  source TEXT NOT NULL DEFAULT 'checkout',
  
  -- Customer info
  customer_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  
  -- Cart snapshot
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'BDT',
  
  -- Meta
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Conversion
  converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- Create index for deduplication lookup
CREATE INDEX idx_checkout_leads_phone_created ON public.checkout_leads(phone, created_at DESC);
CREATE INDEX idx_checkout_leads_status ON public.checkout_leads(status);
CREATE INDEX idx_checkout_leads_lead_token ON public.checkout_leads(lead_token);

-- Enable RLS
ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

-- Public users can insert new leads
CREATE POLICY "Anyone can create leads"
ON public.checkout_leads
FOR INSERT
WITH CHECK (true);

-- Public users can update only their own lead using lead_token
CREATE POLICY "Users can update their own leads"
ON public.checkout_leads
FOR UPDATE
USING (lead_token = current_setting('app.lead_token', true));

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.checkout_leads
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all leads
CREATE POLICY "Admins can update all leads"
ON public.checkout_leads
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.checkout_leads
FOR DELETE
USING (is_admin(auth.uid()));

-- Function to generate lead number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(lead_no, '^LEAD-' || year_str || '-', ''), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.checkout_leads
  WHERE lead_no LIKE 'LEAD-' || year_str || '-%';
  
  NEW.lead_no := 'LEAD-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-generating lead_no
CREATE TRIGGER trigger_generate_lead_number
BEFORE INSERT ON public.checkout_leads
FOR EACH ROW
WHEN (NEW.lead_no IS NULL OR NEW.lead_no = '')
EXECUTE FUNCTION public.generate_lead_number();

-- Trigger for updating updated_at
CREATE TRIGGER update_checkout_leads_updated_at
BEFORE UPDATE ON public.checkout_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();