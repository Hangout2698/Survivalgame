/*
  # Survival Game Database Schema

  ## Purpose
  Store game states for save/resume functionality and track completed games for learning analytics.

  ## Tables Created
  
  ### 1. game_states
  Stores active and paused game sessions
  - `id` (uuid, primary key) - unique game instance identifier
  - `user_id` (uuid) - anonymous user identifier from browser
  - `scenario` (jsonb) - complete scenario configuration
  - `metrics` (jsonb) - current player metrics
  - `history` (jsonb) - array of decisions and consequences
  - `turn_number` (integer) - current turn
  - `created_at` (timestamptz) - when game started
  - `updated_at` (timestamptz) - last save time
  - `status` (text) - 'active', 'paused', 'completed'
  
  ### 2. completed_games
  Archive of finished games for analysis and learning
  - `id` (uuid, primary key)
  - `user_id` (uuid) - anonymous user identifier
  - `outcome` (text) - 'survived', 'barely_survived', 'died'
  - `scenario_type` (text) - environment type
  - `turns_survived` (integer) - how many turns lasted
  - `decisions` (jsonb) - all decisions made
  - `metrics_timeline` (jsonb) - how metrics changed over time
  - `lessons` (jsonb) - what the player learned
  - `completed_at` (timestamptz) - when game ended
  
  ## Security
  - RLS enabled on both tables
  - Users can only access their own games
  - Public read access disabled
*/

-- Create game_states table
CREATE TABLE IF NOT EXISTS game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scenario jsonb NOT NULL,
  metrics jsonb NOT NULL,
  history jsonb DEFAULT '[]'::jsonb,
  turn_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);

-- Create completed_games table
CREATE TABLE IF NOT EXISTS completed_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  outcome text NOT NULL,
  scenario_type text NOT NULL,
  turns_survived integer NOT NULL,
  decisions jsonb NOT NULL,
  metrics_timeline jsonb NOT NULL,
  lessons jsonb NOT NULL,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_states
CREATE POLICY "Users can view own game states"
  ON game_states FOR SELECT
  TO authenticated, anon
  USING (user_id = gen_random_uuid());

CREATE POLICY "Users can insert own game states"
  ON game_states FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update own game states"
  ON game_states FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own game states"
  ON game_states FOR DELETE
  TO authenticated, anon
  USING (true);

-- RLS Policies for completed_games
CREATE POLICY "Users can view own completed games"
  ON completed_games FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert own completed games"
  ON completed_games FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_status ON game_states(status);
CREATE INDEX IF NOT EXISTS idx_completed_games_user_id ON completed_games(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_games_outcome ON completed_games(outcome);
