-- Create deleted_records table to store audit trail of deleted data
CREATE TABLE public.deleted_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  deletion_reason TEXT NOT NULL,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_records ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted records
CREATE POLICY "Only admins can view deleted records"
ON public.deleted_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert deleted records
CREATE POLICY "Only admins can insert deleted records"
ON public.deleted_records
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_deleted_records_table_name ON public.deleted_records(table_name);
CREATE INDEX idx_deleted_records_deleted_at ON public.deleted_records(deleted_at DESC);