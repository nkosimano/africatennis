-- Create event type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM (
        'singles_match',
        'doubles_match',
        'practice_session',
        'tournament_match_singles',
        'tournament_match_doubles'
    );
EXCEPTION
    WHEN duplicate_object THEN
        -- If it exists, add new values
        ALTER TYPE event_type_enum ADD VALUE IF NOT EXISTS 'tournament_match_singles';
        ALTER TYPE event_type_enum ADD VALUE IF NOT EXISTS 'tournament_match_doubles';
END $$;

-- Drop existing tournament format enum if it exists
DROP TYPE IF EXISTS tournament_format_enum CASCADE;

-- Create tournament format enum
CREATE TYPE tournament_format_enum AS ENUM (
    'single_elimination',
    'double_elimination',
    'round_robin',
    'swiss'
);

-- Create tournament status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tournaments table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    format tournament_format_enum NOT NULL DEFAULT 'single_elimination',
    organizer_id UUID NOT NULL REFERENCES profiles(id),
    status tournament_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location_id UUID REFERENCES locations(id),
    max_participants INTEGER DEFAULT 32,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    is_ranked BOOLEAN DEFAULT true
);

-- Create tournament_rounds table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    status tournament_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, round_number)
);

-- Create tournament_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES profiles(id),
    player2_id UUID REFERENCES profiles(id),
    winner_id UUID REFERENCES profiles(id),
    status tournament_status_enum NOT NULL DEFAULT 'pending',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    score_summary JSONB
);

-- Enable Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Tournaments RLS Policies
DO $$ BEGIN
    CREATE POLICY "Tournaments are viewable by everyone"
    ON tournaments FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournaments are insertable by authenticated users"
    ON tournaments FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournaments are updatable by organizer or participants"
    ON tournaments FOR UPDATE
    TO authenticated
    USING (
        organizer_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM tournament_matches
            WHERE tournament_matches.tournament_id = tournaments.id
            AND (tournament_matches.player1_id = auth.uid() OR tournament_matches.player2_id = auth.uid())
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournaments are deletable by organizer"
    ON tournaments FOR DELETE
    TO authenticated
    USING (organizer_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tournament Rounds RLS Policies
DO $$ BEGIN
    CREATE POLICY "Tournament rounds are viewable by everyone"
    ON tournament_rounds FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament rounds are insertable by tournament organizer"
    ON tournament_rounds FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_rounds.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament rounds are updatable by tournament organizer"
    ON tournament_rounds FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_rounds.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament rounds are deletable by tournament organizer"
    ON tournament_rounds FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_rounds.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tournament Matches RLS Policies
DO $$ BEGIN
    CREATE POLICY "Tournament matches are viewable by everyone"
    ON tournament_matches FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament matches are insertable by tournament organizer"
    ON tournament_matches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_matches.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament matches are updatable by participants or organizer"
    ON tournament_matches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_matches.tournament_id
            AND tournaments.organizer_id = auth.uid()
        ) OR player1_id = auth.uid() OR player2_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tournament matches are deletable by tournament organizer"
    ON tournament_matches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_matches.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns if they don't exist
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
    CREATE TRIGGER update_tournaments_updated_at
        BEFORE UPDATE ON tournaments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_tournament_rounds_updated_at ON tournament_rounds;
    CREATE TRIGGER update_tournament_rounds_updated_at
        BEFORE UPDATE ON tournament_rounds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON tournament_matches;
    CREATE TRIGGER update_tournament_matches_updated_at
        BEFORE UPDATE ON tournament_matches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$; 