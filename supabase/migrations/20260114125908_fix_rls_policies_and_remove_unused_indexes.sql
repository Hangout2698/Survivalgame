/*
  # Fix Security Issues

  This migration addresses critical security vulnerabilities:

  1. **Fix RLS Policies**
     - Remove policies with USING (true) that bypass security
     - Implement proper user_id checks for data isolation
     - Policies now properly restrict access to user's own data

  2. **Remove Unused Indexes**
     - Drop idx_game_states_user_id
     - Drop idx_game_states_status
     - Drop idx_completed_games_user_id
     - Drop idx_completed_games_outcome
     - These indexes were not being utilized by queries

  3. **Security Improvements**
     - All policies now check user_id matches request parameter
     - No more blanket access with USING (true) or WITH CHECK (true)
     - Proper isolation between anonymous users' data

  ## Note on Anonymous Users
  This schema uses client-provided user_id for anonymous game tracking.
  For production, consider implementing Supabase Anonymous Auth for better security.
*/

-- Drop existing insecure RLS policies
DROP POLICY IF EXISTS "Users can view own game states" ON game_states;
DROP POLICY IF EXISTS "Users can insert own game states" ON game_states;
DROP POLICY IF EXISTS "Users can update own game states" ON game_states;
DROP POLICY IF EXISTS "Users can delete own game states" ON game_states;
DROP POLICY IF EXISTS "Users can view own completed games" ON completed_games;
DROP POLICY IF EXISTS "Users can insert own completed games" ON completed_games;

-- Create secure RLS policies for game_states
-- Users can only select their own game states
CREATE POLICY "Users can view own game states"
  ON game_states FOR SELECT
  TO anon
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only insert game states with their own user_id
CREATE POLICY "Users can insert own game states"
  ON game_states FOR INSERT
  TO anon
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only update their own game states
CREATE POLICY "Users can update own game states"
  ON game_states FOR UPDATE
  TO anon
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only delete their own game states
CREATE POLICY "Users can delete own game states"
  ON game_states FOR DELETE
  TO anon
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create secure RLS policies for completed_games
-- Users can only view their own completed games
CREATE POLICY "Users can view own completed games"
  ON completed_games FOR SELECT
  TO anon
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only insert completed games with their own user_id
CREATE POLICY "Users can insert own completed games"
  ON completed_games FOR INSERT
  TO anon
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Remove unused indexes to improve performance
DROP INDEX IF EXISTS idx_game_states_user_id;
DROP INDEX IF EXISTS idx_game_states_status;
DROP INDEX IF EXISTS idx_completed_games_user_id;
DROP INDEX IF EXISTS idx_completed_games_outcome;
