import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Truck,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DailyData {
  date: Date;
  purchases: number;
  sales: number;
}

export default function Reports() {
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [receiveCount, setReceiveCount] = useState(0);
  const [payCount, setPayCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch weekly transaction data
      const startDate = startOfDay(subDays(new Date(), 6)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      const { data: txData } = await supabase
        .from('transactions')
        .select('type, amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Process weekly data
      const dailyMap = new Map<string, { purchases: number; sales: number }>();
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        dailyMap.set(date, { purchases: 0, sales: 0 });
      }

      txData?.forEach(tx => {
        const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
        const current = dailyMap.get(date) || { purchases: 0, sales: 0 };
        if (tx.type === 'purchase') {
          current.purchases += Number(tx.amount);
        } else if (tx.type === 'sale') {
          current.sales += Number(tx.amount);
        }
        dailyMap.set(date, current);
      });

      setWeeklyData(Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: new Date(date),
        purchases: data.purchases,
        sales: data.sales,
      })));

      // Fetch customer data
      const { data: custData } = await supabase
        .from('customers')
        .select('balance');

      if (custData) {
        setCustomerCount(custData.length);
        const positive = custData.filter(c => Number(c.balance) > 0);
        const negative = custData.filter(c => Number(c.balance) < 0);
        setToReceive(positive.reduce((sum, c) => sum + Number(c.balance), 0));
        setReceiveCount(positive.length);
        setToPay(Math.abs(negative.reduce((sum, c) => sum + Number(c.balance), 0)));
        setPayCount(negative.length);
      }

      // Fetch supplier count
      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id');
      
      if (suppData) {
        setSupplierCount(suppData.length);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const totalPurchases = weeklyData.reduce((sum, d) => sum + d.purchases, 0);
  const totalSales = weeklyData.reduce((sum, d) => sum + d.sales, 0);
  const netProfit = totalSales - totalPurchases;

  if (isLoading) {
    return (
      <MainLayout title="Reports" subtitle="View business analytics and reports">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reports" subtitle="View business analytics and reports">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="stat-card animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Purchases</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                ₹{totalPurchases.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Sales</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                ₹{totalSales.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-2xl font-display font-bold mt-1 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                {customerCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                {supplierCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart Visualization */}
        <div className="stat-card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Weekly Overview</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Purchases</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {weeklyData.map((day, index) => {
              const maxValue = Math.max(...weeklyData.flatMap(d => [d.sales, d.purchases]), 1);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-20">
                      {format(day.date, 'EEE')}
                    </span>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full transition-all duration-500"
                          style={{ width: `${(day.sales / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right text-success">
                        ₹{day.sales.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="w-20" />
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive/70 rounded-full transition-all duration-500"
                          style={{ width: `${(day.purchases / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-24 text-right text-destructive">
                        ₹{day.purchases.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Downloads */}
        <div className="stat-card animate-slide-up">
          <h3 className="font-display font-semibold text-lg mb-6">Generate Reports</h3>

          <div className="space-y-4">
            {[
              { title: 'Daily Summary Report', desc: 'Today\'s purchases, sales, and balance' },
              { title: 'Weekly Transaction Report', desc: 'Last 7 days of all transactions' },
              { title: 'Customer Balance Report', desc: 'All customer balances and dues' },
              { title: 'Monthly P&L Statement', desc: 'Profit and loss for current month' },
            ].map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.title}</p>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="stat-card lg:col-span-2 animate-slide-up">
          <h3 className="font-display font-semibold text-lg mb-6">Outstanding Balances</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-success/5 rounded-xl border border-success/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-success" />
                <h4 className="font-semibold text-foreground">To Receive</h4>
              </div>
              <p className="text-3xl font-display font-bold text-success">
                ₹{toReceive.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                From {receiveCount} customers
              </p>
            </div>

            <div className="p-6 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="w-6 h-6 text-destructive" />
                <h4 className="font-semibold text-foreground">To Pay</h4>
              </div>
              <p className="text-3xl font-display font-bold text-destructive">
                ₹{toPay.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                To {payCount} suppliers
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
