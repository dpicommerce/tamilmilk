-- Create suppliers table similar to customers
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "All authenticated users can view suppliers" 
ON public.suppliers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert suppliers" 
ON public.suppliers 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update suppliers" 
ON public.suppliers 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete suppliers" 
ON public.suppliers 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate supplier ID
CREATE OR REPLACE FUNCTION public.generate_supplier_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_id FROM 5) AS INTEGER)), 0) + 1 
  INTO next_num 
  FROM public.suppliers;
  
  new_id := 'SUPP' || LPAD(next_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$;

-- Create trigger for updated_at on suppliers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'credit', 'debit')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "All authenticated users can view transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can insert transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();