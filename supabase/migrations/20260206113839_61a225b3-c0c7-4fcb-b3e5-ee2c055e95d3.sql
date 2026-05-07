
-- Create a secure table for CAPI secrets
-- RLS enabled with NO policies = only service_role can access
CREATE TABLE public.capi_secrets (
  id text PRIMARY KEY DEFAULT 'global',
  access_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capi_secrets ENABLE ROW LEVEL SECURITY;

-- Insert default row
INSERT INTO public.capi_secrets (id) VALUES ('global') ON CONFLICT DO NOTHING;
