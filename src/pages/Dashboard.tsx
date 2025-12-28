import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CustomersList } from '@/components/dashboard/CustomersList';
import { SuppliersList } from '@/components/dashboard/SuppliersList';
import { TransactionDetailSheet } from '@/components/dashboard/TransactionDetailSheet';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, TrendingUp, CreditCard, Wallet, Loader2, Users, Truck } from 'lucide-react';
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
  phone: string;
  balance: number;
  milk_rate: number;
}

interface SupplierData {
  id: string;
  supplier_id: string;
  name: string;
  phone: string;
  balance: number;
  milk_rate: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [dailySummary, setDailySummary] = useState({
    totalPurchase: 0,
    totalSales: 0,
    totalCredit: 0,
    totalDebit: 0,
  });
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    milk_rate: number;
    balance: number;
  } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

      // Fetch all customers with balances
      const { data: custData } = await supabase
        .from('customers')
        .select('id, customer_id, name, phone, balance, milk_rate')
        .order('name', { ascending: true });

      if (custData) {
        setCustomers(custData);
      }

      // Fetch all suppliers
      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id, supplier_id, name, phone, balance, milk_rate')
        .order('name', { ascending: true });

      if (suppData) {
        setSuppliers(suppData);
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

  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedEntity({
      id: customer.id,
      name: customer.name,
      type: 'customer',
      milk_rate: customer.milk_rate,
      balance: customer.balance,
    });
    setIsSheetOpen(true);
  };

  const handleSelectSupplier = (supplier: SupplierData) => {
    setSelectedEntity({
      id: supplier.id,
      name: supplier.name,
      type: 'supplier',
      milk_rate: supplier.milk_rate,
      balance: supplier.balance,
    });
    setIsSheetOpen(true);
  };

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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Suppliers"
          value={suppliers.length}
          icon={Truck}
          variant="default"
        />
        <StatCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          variant="accent"
        />
        <StatCard
          title="Total Receivable"
          value={`₹${customers.reduce((sum, c) => sum + Number(c.balance), 0).toLocaleString('en-IN')}`}
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Daily Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
          title="Payment Received"
          value={`₹${dailySummary.totalCredit.toLocaleString('en-IN')}`}
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="Paid Amount"
          value={`₹${dailySummary.totalDebit.toLocaleString('en-IN')}`}
          icon={Wallet}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Suppliers and Customers Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SuppliersList suppliers={suppliers} onSelectSupplier={handleSelectSupplier} />
        <CustomersList customers={customers} onSelectCustomer={handleSelectCustomer} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTransactions} />

      {/* Transaction Detail Sheet */}
      <TransactionDetailSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        entity={selectedEntity}
      />
    </MainLayout>
  );
}
