-- Make phone column nullable for customers and suppliers
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN phone DROP NOT NULL;