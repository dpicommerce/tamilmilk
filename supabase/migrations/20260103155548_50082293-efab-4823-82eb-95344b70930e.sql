-- Create sms_templates table for storing reusable SMS templates
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'general' CHECK (template_type IN ('customer', 'supplier', 'general')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "All authenticated users can view templates"
ON public.sms_templates
FOR SELECT
USING (true);

-- Only admins can insert templates
CREATE POLICY "Only admins can insert templates"
ON public.sms_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update templates
CREATE POLICY "Only admins can update templates"
ON public.sms_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete templates
CREATE POLICY "Only admins can delete templates"
ON public.sms_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();