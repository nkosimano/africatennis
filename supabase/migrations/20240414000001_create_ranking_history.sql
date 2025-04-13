-- Create the ranking_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE ranking_type_enum AS ENUM ('singles', 'doubles');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the ranking_history table
CREATE TABLE IF NOT EXISTS public.ranking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id),
    ranking_type ranking_type_enum NOT NULL,
    points NUMERIC NOT NULL,
    rank INTEGER NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    points_change NUMERIC DEFAULT 0,
    related_event_id UUID REFERENCES public.events(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ranking_history_profile_id ON public.ranking_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_calculation_date ON public.ranking_history(calculation_date);
CREATE INDEX IF NOT EXISTS idx_ranking_history_ranking_type ON public.ranking_history(ranking_type);

-- Enable Row Level Security
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ranking history"
    ON public.ranking_history
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert ranking history"
    ON public.ranking_history
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own ranking history"
    ON public.ranking_history
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND auth.uid() = profile_id)
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = profile_id);

CREATE POLICY "Users can delete their own ranking history"
    ON public.ranking_history
    FOR DELETE
    USING (auth.role() = 'authenticated' AND auth.uid() = profile_id); 