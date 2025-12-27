import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  Loader2,
  Trash2,
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
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

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
  customer_name: string;
  supplier_name: string;
}

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
}

interface SupplierData {
  id: string;
  supplier_id: string;
  name: string;
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
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionData | null>(null);
  const [formData, setFormData] = useState({
    entityId: '',
    entityType: 'customer' as 'customer' | 'supplier',
    type: 'sale' as 'purchase' | 'sale' | 'credit' | 'debit',
    quantity: '',
    rate: '',
    amount: '',
    notes: '',
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch transactions with related data
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (name),
          suppliers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (txData) {
        setTransactions(txData.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          quantity: Number(tx.quantity),
          rate: Number(tx.rate),
          notes: tx.notes,
          created_at: tx.created_at,
          customer_id: tx.customer_id,
          supplier_id: tx.supplier_id,
          customer_name: tx.customers?.name || '',
          supplier_name: tx.suppliers?.name || '',
        })));
      }

      // Fetch customers and suppliers
      const { data: custData } = await supabase
        .from('customers')
        .select('id, customer_id, name')
        .order('name');
      if (custData) setCustomers(custData);

      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id, supplier_id, name')
        .order('name');
      if (suppData) setSuppliers(suppData);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const name = transaction.customer_name || transaction.supplier_name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDeleteTransaction = async (reason: string) => {
    if (!transactionToDelete || !user) return;

    const { error: auditError } = await supabase
      .from('deleted_records')
      .insert([{
        table_name: 'transactions' as const,
        record_id: transactionToDelete.id,
        record_data: JSON.parse(JSON.stringify(transactionToDelete)),
        deletion_reason: reason,
        deleted_by: user.id,
      }]);

    if (auditError) {
      toast({
        title: 'Error',
        description: 'Failed to create audit record',
        variant: 'destructive',
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionToDelete.id);

    if (deleteError) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
      return;
    }

    setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
    toast({
      title: 'Success',
      description: 'Transaction deleted successfully',
    });
  };

  const handleAddTransaction = async () => {
    if (!formData.entityId || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const entity = formData.entityType === 'customer'
      ? customers.find((c) => c.id === formData.entityId)
      : suppliers.find((s) => s.id === formData.entityId);
    
    if (!entity) return;

    setIsSubmitting(true);

    const insertData: any = {
      type: formData.type,
      quantity: parseFloat(formData.quantity) || 0,
      rate: parseFloat(formData.rate) || 0,
      amount: parseFloat(formData.amount),
      notes: formData.notes || null,
      created_by: user?.id,
    };

    if (formData.entityType === 'customer') {
      insertData.customer_id = formData.entityId;
    } else {
      insertData.supplier_id = formData.entityId;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to record transaction',
        variant: 'destructive',
      });
    } else {
      setTransactions([{
        id: data.id,
        type: data.type,
        amount: Number(data.amount),
        quantity: Number(data.quantity),
        rate: Number(data.rate),
        notes: data.notes,
        created_at: data.created_at,
        customer_id: data.customer_id,
        supplier_id: data.supplier_id,
        customer_name: formData.entityType === 'customer' ? entity.name : '',
        supplier_name: formData.entityType === 'supplier' ? entity.name : '',
      }, ...transactions]);
      
      setFormData({
        entityId: '',
        entityType: 'customer',
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
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Transactions" subtitle="View and manage all transactions">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value: 'customer' | 'supplier') => 
                      setFormData({ ...formData, entityType: value, entityId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entity">{formData.entityType === 'customer' ? 'Customer' : 'Supplier'} *</Label>
                  <Select
                    value={formData.entityId}
                    onValueChange={(value) => setFormData({ ...formData, entityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${formData.entityType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.entityType === 'customer'
                        ? customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.customer_id})
                            </SelectItem>
                          ))
                        : suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({s.supplier_id})
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'purchase' | 'sale' | 'credit' | 'debit') =>
                      setFormData({ ...formData, type: value })
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
                <Button 
                  onClick={handleAddTransaction} 
                  className="w-full" 
                  variant="gradient"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Record Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transactions List */}
      <div className="stat-card">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const config = typeConfig[transaction.type as keyof typeof typeConfig];
              const Icon = config?.icon || CreditCard;
              const name = transaction.customer_name || transaction.supplier_name || 'Unknown';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-fade-in"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config?.bg)}>
                    <Icon className={cn('w-6 h-6', config?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{name}</p>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          config?.bg,
                          config?.color
                        )}
                      >
                        {config?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy • HH:mm')}
                      {transaction.notes && ` • ${transaction.notes}`}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className={cn('text-lg font-semibold', config?.color)}>
                        {transaction.type === 'purchase' || transaction.type === 'debit' ? '-' : '+'}
                        ₹{transaction.amount.toLocaleString('en-IN')}
                      </p>
                      {transaction.quantity > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.quantity}L × ₹{transaction.rate}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setTransactionToDelete(transaction);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction of ₹${transactionToDelete?.amount.toLocaleString('en-IN')}? This action cannot be undone.`}
        onConfirm={handleDeleteTransaction}
      />
    </MainLayout>
  );
}
