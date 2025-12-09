import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CustomerBalances } from '@/components/dashboard/CustomerBalances';
import { mockTransactions, mockCustomers, mockDailySummary } from '@/lib/mockData';
import { ShoppingCart, TrendingUp, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  return (
    <MainLayout
      title="Dashboard"
      subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Purchase"
          value={`₹${mockDailySummary.totalPurchase.toLocaleString()}`}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
          variant="default"
        />
        <StatCard
          title="Today's Sales"
          value={`₹${mockDailySummary.totalSales.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
          variant="accent"
        />
        <StatCard
          title="Credit Received"
          value={`₹${mockDailySummary.totalCredit.toLocaleString()}`}
          icon={CreditCard}
          trend={{ value: 5, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Debit Given"
          value={`₹${mockDailySummary.totalDebit.toLocaleString()}`}
          icon={Wallet}
          trend={{ value: 3, isPositive: false }}
          variant="warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={mockTransactions} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <CustomerBalances customers={mockCustomers} />
        </div>
      </div>
    </MainLayout>
  );
}
