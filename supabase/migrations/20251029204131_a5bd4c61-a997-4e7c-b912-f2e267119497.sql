-- Add unique constraint to session_id for upsert functionality
ALTER TABLE abandoned_checkouts 
ADD CONSTRAINT abandoned_checkouts_session_id_unique UNIQUE (session_id);