-- Create table to track processed Stripe sessions
CREATE TABLE IF NOT EXISTS public.processed_stripe_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_intent_id text,
  credits_added integer NOT NULL,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_sessions_session_id ON public.processed_stripe_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_user_id ON public.processed_stripe_sessions(user_id);

-- Enable RLS
ALTER TABLE public.processed_stripe_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view processed sessions
CREATE POLICY "Admins can view processed sessions"
  ON public.processed_stripe_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.processed_stripe_sessions IS 'Tracks processed Stripe checkout sessions to prevent replay attacks';