/*
  # Create email_logs table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Reference to the user who received the email
      - `email` (text) - Email address
      - `type` (text) - Type of email (completion_notice, welcome, order_confirmation, etc.)
      - `metadata` (jsonb) - Additional data about the email
      - `created_at` (timestamptz) - When the email was sent

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for admins to view all email logs
    - Add policy for users to view their own email logs
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System can insert email logs (for edge functions)
CREATE POLICY "System can insert email logs"
  ON email_logs
  FOR INSERT
  WITH CHECK (true);
