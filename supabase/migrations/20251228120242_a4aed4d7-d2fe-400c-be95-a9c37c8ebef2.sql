-- Create settings table for storing default rates
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "All authenticated users can view settings"
ON public.settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update settings"
ON public.settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert settings
CREATE POLICY "Only admins can insert settings"
ON public.settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rates
INSERT INTO public.settings (key, value, description) VALUES
  ('default_purchase_rate', '35', 'Default milk purchase rate per liter'),
  ('default_sales_rate', '50', 'Default milk sales rate per liter');