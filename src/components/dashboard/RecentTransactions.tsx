import { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const typeConfig = {
  purchase: {
    icon: ArrowDownLeft,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    label: 'Purchase',
  },
  sale: {
    icon: ArrowUpRight,
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'Sale',
  },
  credit: {
    icon: CreditCard,
    color: 'text-primary',
    bg: 'bg-primary/10',
    label: 'Payment Received',
  },
  debit: {
    icon: Wallet,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Paid',
  },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="stat-card animate-slide-up">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Recent Transactions
      </h3>
      <div className="space-y-3">
        {transactions.slice(0, 5).map((transaction) => {
          const config = typeConfig[transaction.type];
          const Icon = config.icon;
          
          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                <Icon className={cn('w-5 h-5', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {transaction.customerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.label} • {format(transaction.date, 'MMM dd, h:mm a')}
                </p>
              </div>
              <div className="text-right">
                <p className={cn('font-semibold', config.color)}>
                  {transaction.type === 'purchase' || transaction.type === 'debit' ? '-' : '+'}
                  ₹{transaction.amount.toLocaleString()}
                </p>
                {transaction.quantity > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {transaction.quantity}L × ₹{transaction.rate}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
