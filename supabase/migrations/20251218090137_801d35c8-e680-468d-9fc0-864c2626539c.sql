-- Add milk_rate column to customers table
ALTER TABLE public.customers ADD COLUMN milk_rate numeric NOT NULL DEFAULT 0;

-- Add milk_rate column to suppliers table
ALTER TABLE public.suppliers ADD COLUMN milk_rate numeric NOT NULL DEFAULT 0;