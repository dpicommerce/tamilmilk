import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, IndianRupee, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  phone: string;
  balance: number;
  milk_rate: number;
}

interface CustomersListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomersList({ customers, onSelectCustomer }: CustomersListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="stat-card animate-slide-up">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        All Customers
      </h3>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-3 max-h-[350px] overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No customers found</p>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => onSelectCustomer(customer)}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{customer.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{customer.customer_id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />
                    {Number(customer.milk_rate).toFixed(2)}/L
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'font-semibold',
                    Number(customer.balance) >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {Number(customer.balance) >= 0 ? '+' : ''}₹{Math.abs(Number(customer.balance)).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(customer.balance) >= 0 ? 'To Receive' : 'To Pay'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
