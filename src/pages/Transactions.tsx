import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTransactions, mockCustomers } from '@/lib/mockData';
import { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
    label: 'Credit',
  },
  debit: {
    icon: Wallet,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Debit',
  },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'sale' as Transaction['type'],
    quantity: '',
    rate: '',
    amount: '',
    notes: '',
  });
  const { toast } = useToast();

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.customerName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddTransaction = () => {
    if (!formData.customerId || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const customer = mockCustomers.find((c) => c.id === formData.customerId);
    if (!customer) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      customerId: formData.customerId,
      customerName: customer.name,
      type: formData.type,
      quantity: parseFloat(formData.quantity) || 0,
      rate: parseFloat(formData.rate) || 0,
      amount: parseFloat(formData.amount),
      date: new Date(),
      notes: formData.notes,
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({
      customerId: '',
      type: 'sale',
      quantity: '',
      rate: '',
      amount: '',
      notes: '',
    });
    setIsDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Transaction recorded successfully',
    });
  };

  return (
    <MainLayout title="Transactions" subtitle="View and manage all transactions">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as Transaction['type'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.type === 'purchase' || formData.type === 'sale') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity (L)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate">Rate (₹/L)</Label>
                      <Input
                        id="rate"
                        type="number"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full" variant="gradient">
                  Record Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transactions List */}
      <div className="stat-card">
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const config = typeConfig[transaction.type];
            const Icon = config.icon;

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-fade-in"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.bg)}>
                  <Icon className={cn('w-6 h-6', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{transaction.customerName}</p>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        config.bg,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(transaction.date, 'MMM dd, yyyy • HH:mm')}
                    {transaction.notes && ` • ${transaction.notes}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-lg font-semibold', config.color)}>
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
    </MainLayout>
  );
}
