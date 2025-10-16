-- Create abandoned_checkouts table to track incomplete orders
CREATE TABLE public.abandoned_checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  transactional_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  bundle_name TEXT,
  bundle_price NUMERIC,
  bundle_photos INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Create policies for admins to view and manage abandoned checkouts
CREATE POLICY "Admins can view all abandoned checkouts"
ON public.abandoned_checkouts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_abandoned_checkouts_updated_at
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on email for faster lookups
CREATE INDEX idx_abandoned_checkouts_email ON public.abandoned_checkouts(email);

-- Create index on created_at for reporting
CREATE INDEX idx_abandoned_checkouts_created_at ON public.abandoned_checkouts(created_at DESC);

-- Create index on completed status
CREATE INDEX idx_abandoned_checkouts_completed ON public.abandoned_checkouts(completed);