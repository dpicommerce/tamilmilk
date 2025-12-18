
-- Create function to auto-update customer balance on transaction insert/update/delete
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id IS NOT NULL THEN
      -- For sales: positive amount increases customer debt (they owe us)
      -- For payment received: negative amount decreases debt
      UPDATE public.customers 
      SET balance = balance + NEW.amount
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE public.customers 
      SET balance = balance - OLD.amount
      WHERE id = OLD.customer_id;
    END IF;
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.customers 
      SET balance = balance + NEW.amount
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE public.customers 
      SET balance = balance - OLD.amount
      WHERE id = OLD.customer_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create function to auto-update supplier balance on transaction insert/update/delete
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.supplier_id IS NOT NULL THEN
      -- For purchases: positive amount increases what we owe supplier
      -- For payment made: negative amount decreases what we owe
      UPDATE public.suppliers 
      SET balance = balance + NEW.amount
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.supplier_id IS NOT NULL THEN
      UPDATE public.suppliers 
      SET balance = balance - OLD.amount
      WHERE id = OLD.supplier_id;
    END IF;
    IF NEW.supplier_id IS NOT NULL THEN
      UPDATE public.suppliers 
      SET balance = balance + NEW.amount
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.supplier_id IS NOT NULL THEN
      UPDATE public.suppliers 
      SET balance = balance - OLD.amount
      WHERE id = OLD.supplier_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for customer balance updates
CREATE TRIGGER trigger_update_customer_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_balance();

-- Create triggers for supplier balance updates
CREATE TRIGGER trigger_update_supplier_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_supplier_balance();
