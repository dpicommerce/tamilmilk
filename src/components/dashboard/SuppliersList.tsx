import { cn } from '@/lib/utils';
import { Truck, IndianRupee } from 'lucide-react';

interface Supplier {
  id: string;
  supplier_id: string;
  name: string;
  phone: string;
  balance: number;
  milk_rate: number;
}

interface SuppliersListProps {
  suppliers: Supplier[];
  onSelectSupplier: (supplier: Supplier) => void;
}

export function SuppliersList({ suppliers, onSelectSupplier }: SuppliersListProps) {
  return (
    <div className="stat-card animate-slide-up">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        All Suppliers
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {suppliers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No suppliers found</p>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              onClick={() => onSelectSupplier(supplier)}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{supplier.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{supplier.supplier_id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />
                    {Number(supplier.milk_rate).toFixed(2)}/L
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'font-semibold',
                    Number(supplier.balance) >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {Number(supplier.balance) >= 0 ? '+' : ''}₹{Math.abs(Number(supplier.balance)).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(supplier.balance) >= 0 ? 'To Pay' : 'Advance'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
