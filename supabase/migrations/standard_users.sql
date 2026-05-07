-- Create standard users table for custom auth
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update user_roles to point to public.users if needed
-- Note: We might want to keep the auth.users for compatibility with existing triggers, 
-- but for a pure Railway conversion, public.users is better.

-- If user_roles already exists and points to auth.users, we might need to modify it.
DO $$
BEGIN
    -- Check if user_roles exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        -- Add a column for public_user_id if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'public_user_id') THEN
            ALTER TABLE public.user_roles ADD COLUMN public_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END
$$;
