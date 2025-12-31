import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
  milk_rate: number;
}

interface SaleData {
  id: string;
  customer_id: string | null;
  customer_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes: string | null;
  created_at: string;
}

export default function Sales() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultRate, setDefaultRate] = useState('60');
  const [formData, setFormData] = useState({
    customerId: '',
    quantity: '',
    rate: '60',
    notes: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const amount = parseFloat(formData.quantity || '0') * parseFloat(formData.rate || '0');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch default sales rate from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'default_sales_rate')
        .maybeSingle();

      if (settingsData) {
        setDefaultRate(settingsData.value);
        setFormData(prev => ({ ...prev, rate: settingsData.value }));
      }

      // Fetch customers with their milk rates
      const { data: custData } = await supabase
        .from('customers')
        .select('id, customer_id, name, milk_rate')
        .order('name');
      
      if (custData) setCustomers(custData);

      // Fetch today's sales
      const today = new Date();
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          id, quantity, rate, amount, notes, created_at, customer_id,
          customers (name)
        `)
        .eq('type', 'sale')
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order('created_at', { ascending: false });

      if (txData) {
        setSales(txData.map(tx => ({
          id: tx.id,
          customer_id: tx.customer_id || null,
          customer_name: tx.customers?.name || 'Walk-in Customer',
          quantity: Number(tx.quantity),
          rate: Number(tx.rate),
          amount: Number(tx.amount),
          notes: tx.notes,
          created_at: tx.created_at,
        })));
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const sendSmsNotification = async (phone: string, customerName: string, qty: number, amt: number) => {
    if (!phone) return;
    
    try {
      const message = `Dear ${customerName}, your milk purchase of ${qty}L for ₹${amt.toLocaleString('en-IN')} has been recorded. Thank you!`;
      
      const { error } = await supabase.functions.invoke('send-sms', {
        body: { to: phone, message }
      });
      
      if (error) {
        console.error('SMS send error:', error);
      } else {
        console.log('SMS sent successfully to', phone);
      }
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  };

  const handleAddSale = async () => {
    if (!formData.quantity || !formData.rate) {
      toast({
        title: 'Error',
        description: 'Please enter quantity and rate',
        variant: 'destructive',
      });
      return;
    }

    const customer = formData.customerId ? customers.find((c) => c.id === formData.customerId) : null;
    const customerName = customer ? customer.name : 'Walk-in Customer';

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        customer_id: formData.customerId || null,
        type: 'sale',
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate),
        amount: amount,
        notes: formData.notes || null,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to record sale',
        variant: 'destructive',
      });
    } else {
      setSales([{
        id: data.id,
        customer_id: formData.customerId || null,
        customer_name: customerName,
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate),
        amount: amount,
        notes: formData.notes || null,
        created_at: data.created_at,
      }, ...sales]);
      
      // Send SMS notification to customer (if registered customer with phone)
      if (formData.customerId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', formData.customerId)
          .single();
        
        if (customerData?.phone) {
          sendSmsNotification(customerData.phone, customerName, parseFloat(formData.quantity), amount);
        }
      }
      
      setFormData({
        customerId: '',
        quantity: '',
        rate: defaultRate,
        notes: '',
      });
      toast({
        title: 'Success',
        description: 'Sale recorded successfully',
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Sales" subtitle="Record milk sales to customers">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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
              <Label htmlFor="customer">Customer (Optional - Leave empty for walk-in)</Label>
            <Select
              value={formData.customerId || "walk-in"}
              onValueChange={(value) => {
                const isWalkIn = value === "walk-in";
                const selectedCustomer = !isWalkIn ? customers.find(c => c.id === value) : null;
                setFormData({ 
                  ...formData, 
                  customerId: isWalkIn ? '' : value,
                  rate: selectedCustomer?.milk_rate ? String(selectedCustomer.milk_rate) : defaultRate
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.customer_id})
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
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleAddSale} 
              className="w-full" 
              variant="accent"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
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
                    <p className="font-semibold text-foreground">{sale.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sale.created_at), 'h:mm a')}
                      {sale.notes && ` • ${sale.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">+₹{sale.amount.toLocaleString('en-IN')}</p>
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
                    ₹{sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString('en-IN')}
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
