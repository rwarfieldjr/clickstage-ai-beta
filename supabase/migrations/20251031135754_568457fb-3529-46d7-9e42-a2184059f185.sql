-- Create user_credits table for credit accounting
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
-- Users can view their own credits by email
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can insert their own credits record
CREATE POLICY "Users can insert their own credits"
  ON public.user_credits
  FOR INSERT
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
  ON public.user_credits
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all credits
CREATE POLICY "Admins can update all credits"
  ON public.user_credits
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert credits for any user
CREATE POLICY "Admins can insert credits"
  ON public.user_credits
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index on email for faster lookups
CREATE INDEX idx_user_credits_email ON public.user_credits(email);