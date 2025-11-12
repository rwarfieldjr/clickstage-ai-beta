-- Create order_images table for multiple images per order
CREATE TABLE IF NOT EXISTS public.order_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL CHECK (image_type IN ('original', 'staged')),
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shareable_links table for client access
CREATE TABLE IF NOT EXISTS public.shareable_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accessed_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.order_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareable_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_images
CREATE POLICY "Admins can manage all order images"
  ON public.order_images
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their order images"
  ON public.order_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_images.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- RLS policies for shareable_links
CREATE POLICY "Admins can manage shareable links"
  ON public.shareable_links
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can access valid shareable links"
  ON public.shareable_links
  FOR SELECT
  USING (expires_at > now());

-- Create indexes for performance
CREATE INDEX idx_order_images_order_id ON public.order_images(order_id);
CREATE INDEX idx_order_images_type ON public.order_images(image_type);
CREATE INDEX idx_shareable_links_token ON public.shareable_links(token);
CREATE INDEX idx_shareable_links_order_id ON public.shareable_links(order_id);