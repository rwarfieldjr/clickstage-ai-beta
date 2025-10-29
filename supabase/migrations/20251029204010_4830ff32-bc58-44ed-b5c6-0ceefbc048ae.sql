-- Add columns to abandoned_checkouts to store file data and avoid Stripe metadata limits
ALTER TABLE abandoned_checkouts 
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS staging_style text,
ADD COLUMN IF NOT EXISTS photos_count integer;

-- Add index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_session_id ON abandoned_checkouts(session_id);