import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { mockDailySummary, mockTransactions, mockCustomers } from '@/lib/mockData';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Reports() {
  // Generate weekly data for chart simulation
  const weeklyData = Array.from({ length: 7 }, (_, i) => ({
    date: subDays(new Date(), 6 - i),
    purchases: Math.floor(Math.random() * 3000) + 1500,
    sales: Math.floor(Math.random() * 5000) + 3000,
  }));

  const totalPurchases = weeklyData.reduce((sum, d) => sum + d.purchases, 0);
  const totalSales = weeklyData.reduce((sum, d) => sum + d.sales, 0);
  const netProfit = totalSales - totalPurchases;

  return (
    <MainLayout title="Reports" subtitle="View business analytics and reports">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Purchases</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                ₹{totalPurchases.toLocaleString()}
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
                ₹{totalSales.toLocaleString()}
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
              <p className="text-2xl font-display font-bold text-success mt-1">
                ₹{netProfit.toLocaleString()}
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
                {mockCustomers.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
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
            {weeklyData.map((day, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground w-20">
                    {format(day.date, 'EEE')}
                  </span>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-500"
                        style={{ width: `${(day.sales / 8000) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right text-success">
                      ₹{day.sales.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="w-20" />
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive/70 rounded-full transition-all duration-500"
                        style={{ width: `${(day.purchases / 8000) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right text-destructive">
                      ₹{day.purchases.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                ₹{mockCustomers
                  .filter((c) => c.balance > 0)
                  .reduce((sum, c) => sum + c.balance, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                From {mockCustomers.filter((c) => c.balance > 0).length} customers
              </p>
            </div>

            <div className="p-6 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="w-6 h-6 text-destructive" />
                <h4 className="font-semibold text-foreground">To Pay</h4>
              </div>
              <p className="text-3xl font-display font-bold text-destructive">
                ₹{Math.abs(
                  mockCustomers
                    .filter((c) => c.balance < 0)
                    .reduce((sum, c) => sum + c.balance, 0)
                ).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                To {mockCustomers.filter((c) => c.balance < 0).length} suppliers
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
