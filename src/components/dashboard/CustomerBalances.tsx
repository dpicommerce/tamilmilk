import { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface CustomerBalancesProps {
  customers: Customer[];
}

export function CustomerBalances({ customers }: CustomerBalancesProps) {
  const sortedCustomers = [...customers].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  return (
    <div className="stat-card animate-slide-up">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Customer Balances
      </h3>
      <div className="space-y-3">
        {sortedCustomers.slice(0, 5).map((customer) => (
          <div
            key={customer.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{customer.name}</p>
              <p className="text-sm text-muted-foreground truncate">{customer.phone}</p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  'font-semibold',
                  customer.balance >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {customer.balance >= 0 ? '+' : ''}₹{customer.balance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer.balance >= 0 ? 'To Receive' : 'To Pay'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
