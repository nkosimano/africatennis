-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id text PRIMARY KEY,
    provisional_k_factor integer NOT NULL DEFAULT 32,
    established_k_factor integer NOT NULL DEFAULT 24,
    initial_rating integer NOT NULL DEFAULT 1200,
    matches_for_established integer NOT NULL DEFAULT 10,
    rating_scale_min integer NOT NULL DEFAULT 1000,
    rating_scale_max integer NOT NULL DEFAULT 2000,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by uuid REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read system settings
CREATE POLICY "System settings are viewable by everyone" ON public.system_settings
    FOR SELECT USING (true);

-- Only allow administrators to update system settings
CREATE POLICY "System settings are updatable by administrators" ON public.system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only allow administrators to insert system settings
CREATE POLICY "System settings are insertable by administrators" ON public.system_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default settings
INSERT INTO public.system_settings (
    id,
    provisional_k_factor,
    established_k_factor,
    initial_rating,
    matches_for_established,
    rating_scale_min,
    rating_scale_max
) VALUES (
    'rating_settings',
    32,
    24,
    1200,
    10,
    1000,
    2000
) ON CONFLICT (id) DO NOTHING; 