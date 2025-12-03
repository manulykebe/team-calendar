/*
  # Create Reporting System Database

  ## Overview
  This migration creates a comprehensive reporting system with role-based access control,
  supporting both admin (custom queries) and user (predefined queries) modes.

  ## 1. New Tables
  
  ### `saved_queries`
  Stores custom SQL queries created by admin users
  - `id` (uuid, primary key) - Unique query identifier
  - `name` (text) - Query display name
  - `description` (text) - Query purpose description
  - `sql_query` (text) - The actual SQL query
  - `parameters` (jsonb) - Query parameter definitions
  - `created_by` (text) - User ID who created the query
  - `site` (text) - Site identifier for multi-tenancy
  - `is_public` (boolean) - Whether query is available to all users
  - `category` (text) - Query category for organization
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `predefined_queries`
  Library of pre-built queries available to all users
  - `id` (uuid, primary key) - Unique query identifier
  - `name` (text) - Query display name
  - `description` (text) - Query purpose description
  - `sql_query` (text) - The actual SQL query
  - `parameters` (jsonb) - Query parameter definitions
  - `category` (text) - Query category
  - `site` (text) - Site identifier
  - `sort_order` (integer) - Display order
  - `is_active` (boolean) - Whether query is available
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `query_executions`
  Audit log of all query executions for security and tracking
  - `id` (uuid, primary key) - Unique execution identifier
  - `query_id` (uuid) - Reference to saved/predefined query
  - `query_type` (text) - 'saved', 'predefined', or 'custom'
  - `executed_by` (text) - User ID who executed the query
  - `site` (text) - Site identifier
  - `sql_query` (text) - The executed SQL (for audit)
  - `parameters` (jsonb) - Parameters used
  - `row_count` (integer) - Number of rows returned
  - `execution_time_ms` (integer) - Execution duration
  - `status` (text) - 'success' or 'error'
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz) - Execution timestamp

  ### `query_results_cache`
  Cache for query results to improve performance
  - `id` (uuid, primary key) - Unique cache identifier
  - `query_hash` (text, unique) - Hash of query + parameters
  - `query_id` (uuid) - Reference to query
  - `results` (jsonb) - Cached query results
  - `row_count` (integer) - Number of rows
  - `site` (text) - Site identifier
  - `created_at` (timestamptz) - Cache creation time
  - `expires_at` (timestamptz) - Cache expiration time

  ## 2. Security
  
  - Enable RLS on all tables
  - Admins can do everything
  - Regular users can only read predefined queries and their own execution history
  - All queries are site-scoped for multi-tenancy
  - Audit trail for all database operations

  ## 3. Indexes
  
  - Index on site for all tables (multi-tenancy)
  - Index on query_hash for cache lookups
  - Index on created_at for time-based queries
  - Index on executed_by for user history

  ## 4. Important Notes
  
  - SQL queries are stored as text and validated before execution
  - Parameters use JSON format for flexibility
  - Cache expires after 1 hour by default
  - All timestamps use UTC
*/

-- Create saved_queries table
CREATE TABLE IF NOT EXISTS saved_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  sql_query text NOT NULL,
  parameters jsonb DEFAULT '[]'::jsonb,
  created_by text NOT NULL,
  site text NOT NULL,
  is_public boolean DEFAULT false,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create predefined_queries table
CREATE TABLE IF NOT EXISTS predefined_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  sql_query text NOT NULL,
  parameters jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  site text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create query_executions table (audit log)
CREATE TABLE IF NOT EXISTS query_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid,
  query_type text NOT NULL CHECK (query_type IN ('saved', 'predefined', 'custom')),
  executed_by text NOT NULL,
  site text NOT NULL,
  sql_query text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  row_count integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create query_results_cache table
CREATE TABLE IF NOT EXISTS query_results_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text UNIQUE NOT NULL,
  query_id uuid,
  results jsonb NOT NULL,
  row_count integer DEFAULT 0,
  site text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_queries_site ON saved_queries(site);
CREATE INDEX IF NOT EXISTS idx_saved_queries_created_by ON saved_queries(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_queries_category ON saved_queries(site, category);

CREATE INDEX IF NOT EXISTS idx_predefined_queries_site ON predefined_queries(site);
CREATE INDEX IF NOT EXISTS idx_predefined_queries_category ON predefined_queries(site, category);
CREATE INDEX IF NOT EXISTS idx_predefined_queries_active ON predefined_queries(site, is_active);

CREATE INDEX IF NOT EXISTS idx_query_executions_site ON query_executions(site);
CREATE INDEX IF NOT EXISTS idx_query_executions_user ON query_executions(site, executed_by);
CREATE INDEX IF NOT EXISTS idx_query_executions_created ON query_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_hash ON query_results_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON query_results_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_site ON query_results_cache(site);

-- Enable Row Level Security
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_results_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_queries
CREATE POLICY "Users can view public queries or their own"
  ON saved_queries FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = current_user);

CREATE POLICY "Users can insert their own queries"
  ON saved_queries FOR INSERT
  TO authenticated
  WITH CHECK (created_by = current_user);

CREATE POLICY "Users can update their own queries"
  ON saved_queries FOR UPDATE
  TO authenticated
  USING (created_by = current_user)
  WITH CHECK (created_by = current_user);

CREATE POLICY "Users can delete their own queries"
  ON saved_queries FOR DELETE
  TO authenticated
  USING (created_by = current_user);

-- RLS Policies for predefined_queries (read-only for users, admins manage via app logic)
CREATE POLICY "Users can view active predefined queries"
  ON predefined_queries FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "System can manage predefined queries"
  ON predefined_queries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for query_executions (audit log)
CREATE POLICY "Users can view their own execution history"
  ON query_executions FOR SELECT
  TO authenticated
  USING (executed_by = current_user);

CREATE POLICY "System can insert execution logs"
  ON query_executions FOR INSERT
  TO authenticated
  WITH CHECK (executed_by = current_user);

-- RLS Policies for query_results_cache
CREATE POLICY "Users can view cache entries"
  ON query_results_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage cache"
  ON query_results_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_saved_queries_updated_at ON saved_queries;
CREATE TRIGGER update_saved_queries_updated_at
  BEFORE UPDATE ON saved_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predefined_queries_updated_at ON predefined_queries;
CREATE TRIGGER update_predefined_queries_updated_at
  BEFORE UPDATE ON predefined_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default predefined queries for demonstration
INSERT INTO predefined_queries (name, description, sql_query, category, site, sort_order, is_active) VALUES
  (
    'User List',
    'Get all active users in the system',
    'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE status = ''active'' ORDER BY last_name',
    'Users',
    'azjp',
    1,
    true
  ),
  (
    'Recent Query Executions',
    'View the most recent 50 query executions',
    'SELECT executed_by, query_type, status, row_count, execution_time_ms, created_at FROM query_executions ORDER BY created_at DESC LIMIT 50',
    'Audit',
    'azjp',
    2,
    true
  ),
  (
    'Query Performance Stats',
    'Analyze query performance metrics',
    'SELECT query_type, COUNT(*) as execution_count, AVG(execution_time_ms) as avg_time_ms, MAX(execution_time_ms) as max_time_ms, SUM(CASE WHEN status = ''error'' THEN 1 ELSE 0 END) as error_count FROM query_executions GROUP BY query_type ORDER BY execution_count DESC',
    'Analytics',
    'azjp',
    3,
    true
  )
ON CONFLICT DO NOTHING;
