/*
  # Create Game Settings Table

  1. New Tables
    - `game_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - e.g., 'survival_guide_url'
      - `setting_value` (text) - the value for the setting
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on `game_settings` table
    - Allow public read access (for game to fetch document URL)
    - No public write access (admin only, managed server-side)
    
  3. Initial Data
    - Insert a default survival guide setting
*/

CREATE TABLE IF NOT EXISTS game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game settings"
  ON game_settings FOR SELECT
  TO public
  USING (true);

INSERT INTO game_settings (setting_key, setting_value)
VALUES ('survival_guide_url', '')
ON CONFLICT (setting_key) DO NOTHING;
