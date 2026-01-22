/*
  # Fix Storage Policies for Game Documents
  
  1. Changes
    - Add RLS policies to allow anyone to upload to game-documents bucket
    - Add policy to allow anyone to read from game-documents bucket
    
  2. Security
    - Public read access for all files in bucket
    - Public upload access for all users
*/

CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'game-documents');

CREATE POLICY "Anyone can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-documents');
