import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCustomers } from '@/lib/mockData';
import { Transaction } from '@/types';
import { Plus, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Sales() {
  const [sales, setSales] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    quantity: '',
    rate: '60',
    notes: '',
  });
  const { toast } = useToast();

  const amount = parseFloat(formData.quantity || '0') * parseFloat(formData.rate || '0');

  const handleAddSale = () => {
    if (!formData.customerId || !formData.quantity || !formData.rate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const customer = mockCustomers.find((c) => c.id === formData.customerId);
    if (!customer) return;

    const newSale: Transaction = {
      id: Date.now().toString(),
      customerId: formData.customerId,
      customerName: customer.name,
      type: 'sale',
      quantity: parseFloat(formData.quantity),
      rate: parseFloat(formData.rate),
      amount: amount,
      date: new Date(),
      notes: formData.notes,
    };

    setSales([newSale, ...sales]);
    setFormData({
      customerId: '',
      quantity: '',
      rate: '60',
      notes: '',
    });
    toast({
      title: 'Success',
      description: 'Sale recorded successfully',
    });
  };

  return (
    <MainLayout title="Sales" subtitle="Record milk sales to customers">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="stat-card lg:col-span-1 h-fit animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">New Sale</h3>
              <p className="text-sm text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity (Liters) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="rate">Rate (₹/L) *</Label>
                <Input
                  id="rate"
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="60"
                />
              </div>
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

            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-display font-bold text-accent">
                  ₹{amount.toLocaleString()}
                </span>
              </div>
            </div>

            <Button onClick={handleAddSale} className="w-full" variant="accent">
              <Plus className="w-4 h-4 mr-2" />
              Record Sale
            </Button>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="stat-card lg:col-span-2 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Today's Sales</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'MMMM d, yyyy')}
            </div>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sales recorded today</p>
              <p className="text-sm">Start by recording a new sale</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{sale.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(sale.date, 'HH:mm')}
                      {sale.notes && ` • ${sale.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">+₹{sale.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.quantity}L × ₹{sale.rate}
                    </p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Sales Today</span>
                  <span className="text-xl font-display font-bold text-success">
                    ₹{sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
