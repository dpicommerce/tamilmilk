import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CustomerBalances } from '@/components/dashboard/CustomerBalances';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, TrendingUp, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  quantity: number;
  rate: number;
  notes: string | null;
  created_at: string;
  customer_id: string | null;
  supplier_id: string | null;
  customers: { name: string } | null;
  suppliers: { name: string } | null;
}

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
  balance: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [dailySummary, setDailySummary] = useState({
    totalPurchase: 0,
    totalSales: 0,
    totalCredit: 0,
    totalDebit: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Fetch today's transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (name),
          suppliers (name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData);
        
        // Calculate daily summary
        const summary = txData.reduce((acc, tx) => {
          const amount = Number(tx.amount);
          if (tx.type === 'purchase') acc.totalPurchase += amount;
          else if (tx.type === 'sale') acc.totalSales += amount;
          else if (tx.type === 'credit') acc.totalCredit += amount;
          else if (tx.type === 'debit') acc.totalDebit += amount;
          return acc;
        }, { totalPurchase: 0, totalSales: 0, totalCredit: 0, totalDebit: 0 });
        
        setDailySummary(summary);
      }

      // Fetch customers with balances
      const { data: custData } = await supabase
        .from('customers')
        .select('id, customer_id, name, balance')
        .order('balance', { ascending: false })
        .limit(10);

      if (custData) {
        setCustomers(custData);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Transform transactions for components
  const recentTransactions = transactions.map(tx => ({
    id: tx.id,
    customerId: tx.customer_id || tx.supplier_id || '',
    customerName: tx.customers?.name || tx.suppliers?.name || 'Unknown',
    type: tx.type as 'purchase' | 'sale' | 'credit' | 'debit',
    quantity: Number(tx.quantity),
    rate: Number(tx.rate),
    amount: Number(tx.amount),
    date: new Date(tx.created_at),
    notes: tx.notes || undefined,
  }));

  const customerBalances = customers.map(c => ({
    id: c.id,
    customerId: c.customer_id,
    name: c.name,
    phone: '',
    address: '',
    balance: Number(c.balance),
    createdAt: new Date(),
  }));

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Dashboard"
      subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Purchase"
          value={`₹${dailySummary.totalPurchase.toLocaleString('en-IN')}`}
          icon={ShoppingCart}
          variant="default"
        />
        <StatCard
          title="Today's Sales"
          value={`₹${dailySummary.totalSales.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          variant="accent"
        />
        <StatCard
          title="Credit Received"
          value={`₹${dailySummary.totalCredit.toLocaleString('en-IN')}`}
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="Debit Given"
          value={`₹${dailySummary.totalDebit.toLocaleString('en-IN')}`}
          icon={Wallet}
          variant="warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={recentTransactions} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <CustomerBalances customers={customerBalances} />
        </div>
      </div>
    </MainLayout>
  );
}
