-- Create storage bucket for pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pictures', 'pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the pictures bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the pictures bucket
DROP POLICY IF EXISTS "Public pictures are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pictures" ON storage.objects;

-- Create policies for the pictures bucket
CREATE POLICY "Public pictures are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pictures');

CREATE POLICY "Users can upload their own pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
); 