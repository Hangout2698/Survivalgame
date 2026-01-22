/*
  # Create Survival Guide Content Table

  1. New Tables
    - `survival_guide_content`
      - `id` (uuid, primary key)
      - `file_name` (text) - name of the uploaded PDF
      - `file_path` (text) - storage path to the PDF
      - `raw_text` (text) - full extracted text from PDF
      - `extracted_at` (timestamp) - when the content was extracted
      - `is_active` (boolean) - whether this is the currently active guide
      
  2. Security
    - Enable RLS on `survival_guide_content` table
    - Allow public read access for active guide content
    - No public write access (admin only, managed server-side)
    
  3. Notes
    - Only one guide should be active at a time
    - Raw text will be used to generate context-aware decisions
*/

CREATE TABLE IF NOT EXISTS survival_guide_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  raw_text text NOT NULL,
  extracted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE survival_guide_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active survival guide content"
  ON survival_guide_content FOR SELECT
  TO public
  USING (is_active = true);

-- Create an index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_survival_guide_active ON survival_guide_content(is_active) WHERE is_active = true;