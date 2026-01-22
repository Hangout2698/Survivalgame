/*
  # Create Storage Bucket for Game Documents

  1. Storage Setup
    - Create a public bucket called `game-documents` for storing game rules PDFs
    - Anyone can read the files (public access)
    - Only authenticated users can upload/modify files
  
  2. Security
    - Public read access for all users
    - Authenticated write access for uploads
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-documents', 'game-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for game documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-documents');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload game documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-documents');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update game documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game-documents');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete game documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-documents');