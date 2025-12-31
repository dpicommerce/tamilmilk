import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, User, Truck, IndianRupee, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransactionDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entity: {
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    milk_rate: number;
    balance: number;
  } | null;
}

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
  notes: string | null;
}

interface PeriodSummary {
  period: string;
  startDate: Date;
  endDate: Date;
  totalQuantity: number;
  totalAmount: number;
  creditAmount: number;
  debitAmount: number;
  transactions: Transaction[];
}

export function TransactionDetailSheet({ isOpen, onClose, entity }: TransactionDetailSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [periodSummaries, setPeriodSummaries] = useState<PeriodSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen && entity) {
      fetchTransactions();
    }
  }, [isOpen, entity, selectedMonth]);

  const fetchTransactions = async () => {
    if (!entity) return;
    setIsLoading(true);

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const filterColumn = entity.type === 'customer' ? 'customer_id' : 'supplier_id';
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq(filterColumn, entity.id)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())
      .order('created_at', { ascending: true });

    if (data) {
      // For customers: monthly view only
      // For suppliers: split into 3 periods: 1-10, 11-20, 21-end
      let periods: PeriodSummary[] = [];

      if (entity.type === 'customer') {
        // Single monthly period for customers
        periods = [
          {
            period: format(selectedMonth, 'MMMM yyyy'),
            startDate: monthStart,
            endDate: monthEnd,
            totalQuantity: 0,
            totalAmount: 0,
            creditAmount: 0,
            debitAmount: 0,
            transactions: [],
          },
        ];

        data.forEach((tx) => {
          periods[0].transactions.push(tx);
          
          if (tx.type === 'sale' || tx.type === 'purchase') {
            periods[0].totalQuantity += Number(tx.quantity);
            periods[0].totalAmount += Number(tx.amount);
          } else if (tx.type === 'credit') {
            periods[0].creditAmount += Number(tx.amount);
          } else if (tx.type === 'debit') {
            periods[0].debitAmount += Number(tx.amount);
          }
        });
      } else {
        // Split into 3 periods for suppliers: 1-10, 11-20, 21-end
        periods = [
          {
            period: '1st - 10th',
            startDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
            endDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 10),
            totalQuantity: 0,
            totalAmount: 0,
            creditAmount: 0,
            debitAmount: 0,
            transactions: [],
          },
          {
            period: '11th - 20th',
            startDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 11),
            endDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 20),
            totalQuantity: 0,
            totalAmount: 0,
            creditAmount: 0,
            debitAmount: 0,
            transactions: [],
          },
          {
            period: '21st - ' + format(monthEnd, 'd') + 'th',
            startDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 21),
            endDate: monthEnd,
            totalQuantity: 0,
            totalAmount: 0,
            creditAmount: 0,
            debitAmount: 0,
            transactions: [],
          },
        ];

        data.forEach((tx) => {
          const txDate = new Date(tx.created_at);
          const day = txDate.getDate();
          let periodIndex = 0;
          if (day >= 11 && day <= 20) periodIndex = 1;
          else if (day >= 21) periodIndex = 2;

          periods[periodIndex].transactions.push(tx);
          
          if (tx.type === 'sale' || tx.type === 'purchase') {
            periods[periodIndex].totalQuantity += Number(tx.quantity);
            periods[periodIndex].totalAmount += Number(tx.amount);
          } else if (tx.type === 'credit') {
            periods[periodIndex].creditAmount += Number(tx.amount);
          } else if (tx.type === 'debit') {
            periods[periodIndex].debitAmount += Number(tx.amount);
          }
        });
      }

      setPeriodSummaries(periods);
    }

    setIsLoading(false);
  };

  const getMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date);
    }
    return months;
  };

  // Calculate running total for a period's transactions
  const getTransactionsWithRunningTotal = (transactions: Transaction[], entityType: 'customer' | 'supplier') => {
    let runningTotal = 0;
    return transactions.map((tx, index) => {
      const quantity = tx.type === 'sale' || tx.type === 'purchase' ? Number(tx.quantity) : 0;
      const rate = tx.type === 'sale' || tx.type === 'purchase' ? Number(tx.rate) : 0;
      const credit = tx.type === 'credit' ? Number(tx.amount) : 0;
      const debit = tx.type === 'debit' ? Number(tx.amount) : 0;
      
      // For customers: sales add to balance, credits reduce balance
      // For suppliers: purchases add to what we owe, debits reduce what we owe
      if (entityType === 'customer') {
        if (tx.type === 'sale') runningTotal += Number(tx.amount);
        if (tx.type === 'credit') runningTotal -= Number(tx.amount);
      } else {
        if (tx.type === 'purchase') runningTotal += Number(tx.amount);
        if (tx.type === 'debit') runningTotal -= Number(tx.amount);
      }

      return {
        ...tx,
        serialNo: index + 1,
        quantity,
        rate,
        credit,
        debit,
        runningTotal,
      };
    });
  };

  if (!entity) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              entity.type === 'customer' ? 'bg-primary/10' : 'bg-accent/10'
            )}>
              {entity.type === 'customer' ? (
                <User className="w-5 h-5 text-primary" />
              ) : (
                <Truck className="w-5 h-5 text-accent" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{entity.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Rate: <IndianRupee className="w-3 h-3" />{Number(entity.milk_rate).toFixed(2)}/L
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Current Balance */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className={cn(
            "text-2xl font-bold",
            Number(entity.balance) >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {Number(entity.balance) >= 0 ? '+' : ''}₹{Math.abs(Number(entity.balance)).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Month Selector */}
        <div className="mt-6">
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            Select Month
          </label>
          <select
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {getMonthOptions().map((date) => (
              <option key={format(date, 'yyyy-MM')} value={format(date, 'yyyy-MM')}>
                {format(date, 'MMMM yyyy')}
              </option>
            ))}
          </select>
        </div>

        {/* Period-wise Summary */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="0" className="mt-6">
            {periodSummaries.length > 1 && (
              <TabsList className={cn("w-full grid", `grid-cols-${periodSummaries.length}`)}>
                {periodSummaries.map((period, index) => (
                  <TabsTrigger key={index} value={String(index)} className="text-xs">
                    {period.period}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            {periodSummaries.map((period, index) => {
              const transactionsWithTotal = getTransactionsWithRunningTotal(period.transactions, entity.type);
              
              return (
                <TabsContent key={index} value={String(index)} className="mt-4 space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground">Total Quantity</p>
                      <p className="text-lg font-semibold text-primary">
                        {period.totalQuantity.toFixed(1)} L
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold text-accent">
                        ₹{period.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10">
                      <p className="text-xs text-muted-foreground">Credit Received</p>
                      <p className="text-lg font-semibold text-success">
                        ₹{period.creditAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10">
                      <p className="text-xs text-muted-foreground">Debit/Advance</p>
                      <p className="text-lg font-semibold text-warning">
                        ₹{period.debitAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Transaction Details</p>
                    {period.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No transactions in this period
                      </p>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 text-center">S.No</TableHead>
                              <TableHead className="w-24">Date</TableHead>
                              <TableHead className="w-24">ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Qty (L)</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="text-right text-success">Credit</TableHead>
                              <TableHead className="text-right text-warning">Debit</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactionsWithTotal.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell className="text-center font-medium">{tx.serialNo}</TableCell>
                                <TableCell className="text-xs">
                                  {format(new Date(tx.created_at), 'dd/MM/yy')}
                                </TableCell>
                                <TableCell className="text-xs font-mono">
                                  {tx.id.slice(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "text-xs font-medium capitalize px-2 py-1 rounded",
                                    tx.type === 'credit' && 'bg-success/10 text-success',
                                    tx.type === 'debit' && 'bg-warning/10 text-warning',
                                    tx.type === 'sale' && 'bg-primary/10 text-primary',
                                    tx.type === 'purchase' && 'bg-accent/10 text-accent'
                                  )}>
                                    {tx.type}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {tx.quantity > 0 ? tx.quantity.toFixed(1) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {tx.rate > 0 ? `₹${tx.rate.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-success font-medium">
                                  {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-warning font-medium">
                                  {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                                </TableCell>
                                <TableCell className={cn(
                                  "text-right font-semibold",
                                  tx.runningTotal >= 0 ? 'text-success' : 'text-destructive'
                                )}>
                                  ₹{Math.abs(tx.runningTotal).toLocaleString('en-IN')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
