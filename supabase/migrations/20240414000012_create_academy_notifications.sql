-- Create academy_notifications table
CREATE TABLE IF NOT EXISTS public.academy_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_academy_notifications_user_id ON public.academy_notifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON public.academy_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
    ON public.academy_notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.academy_notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.academy_notifications
    FOR DELETE
    USING (auth.uid() = user_id); 