-- Fix customer balance trigger to calculate correctly
-- Sale: customer owes us MORE (add to balance)
-- Credit: customer PAID us (subtract from balance)
-- Debit: we GAVE customer money/advance (add to balance)

CREATE OR REPLACE FUNCTION public.update_customer_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  amount_change numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id IS NOT NULL THEN
      -- Calculate the balance change based on transaction type
      -- Sale/Debit: increases what customer owes (positive)
      -- Credit: customer paid, decreases what they owe (negative)
      IF NEW.type = 'credit' THEN
        amount_change := -NEW.amount;  -- Payment received, reduce balance
      ELSE
        amount_change := NEW.amount;   -- Sale or Debit, increase balance
      END IF;
      
      UPDATE public.customers 
      SET balance = balance + amount_change
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.customer_id IS NOT NULL THEN
      IF OLD.type = 'credit' THEN
        amount_change := OLD.amount;  -- Was negative, reverse it
      ELSE
        amount_change := -OLD.amount;
      END IF;
      UPDATE public.customers 
      SET balance = balance + amount_change
      WHERE id = OLD.customer_id;
    END IF;
    -- Apply new transaction
    IF NEW.customer_id IS NOT NULL THEN
      IF NEW.type = 'credit' THEN
        amount_change := -NEW.amount;
      ELSE
        amount_change := NEW.amount;
      END IF;
      UPDATE public.customers 
      SET balance = balance + amount_change
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the deleted transaction
    IF OLD.customer_id IS NOT NULL THEN
      IF OLD.type = 'credit' THEN
        amount_change := OLD.amount;  -- Was negative, reverse it
      ELSE
        amount_change := -OLD.amount;
      END IF;
      UPDATE public.customers 
      SET balance = balance + amount_change
      WHERE id = OLD.customer_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Also fix supplier balance trigger
-- Purchase: we owe supplier MORE (add to balance) 
-- Credit: we PAID supplier (subtract from balance)
-- Debit: supplier gave us money back (subtract from balance)

CREATE OR REPLACE FUNCTION public.update_supplier_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  amount_change numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.supplier_id IS NOT NULL THEN
      -- Purchase: increases what we owe (positive)
      -- Credit: we paid supplier, decreases what we owe (negative)
      -- Debit: supplier returned money (negative)
      IF NEW.type = 'credit' OR NEW.type = 'debit' THEN
        amount_change := -NEW.amount;  -- Payment made or refund received
      ELSE
        amount_change := NEW.amount;   -- Purchase, increase what we owe
      END IF;
      
      UPDATE public.suppliers 
      SET balance = balance + amount_change
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.supplier_id IS NOT NULL THEN
      IF OLD.type = 'credit' OR OLD.type = 'debit' THEN
        amount_change := OLD.amount;
      ELSE
        amount_change := -OLD.amount;
      END IF;
      UPDATE public.suppliers 
      SET balance = balance + amount_change
      WHERE id = OLD.supplier_id;
    END IF;
    IF NEW.supplier_id IS NOT NULL THEN
      IF NEW.type = 'credit' OR NEW.type = 'debit' THEN
        amount_change := -NEW.amount;
      ELSE
        amount_change := NEW.amount;
      END IF;
      UPDATE public.suppliers 
      SET balance = balance + amount_change
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.supplier_id IS NOT NULL THEN
      IF OLD.type = 'credit' OR OLD.type = 'debit' THEN
        amount_change := OLD.amount;
      ELSE
        amount_change := -OLD.amount;
      END IF;
      UPDATE public.suppliers 
      SET balance = balance + amount_change
      WHERE id = OLD.supplier_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Recalculate all customer balances based on correct logic
UPDATE public.customers c
SET balance = COALESCE((
  SELECT 
    SUM(CASE 
      WHEN t.type = 'credit' THEN -t.amount  -- Payment received
      ELSE t.amount                          -- Sale or Debit
    END)
  FROM public.transactions t
  WHERE t.customer_id = c.id
), 0);

-- Recalculate all supplier balances based on correct logic
UPDATE public.suppliers s
SET balance = COALESCE((
  SELECT 
    SUM(CASE 
      WHEN t.type IN ('credit', 'debit') THEN -t.amount  -- Payment made or refund
      ELSE t.amount                                       -- Purchase
    END)
  FROM public.transactions t
  WHERE t.supplier_id = s.id
), 0);