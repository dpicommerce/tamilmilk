import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Plus, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
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

interface SupplierData {
  id: string;
  supplier_id: string;
  name: string;
  milk_rate: number;
}

interface PurchaseData {
  id: string;
  supplier_id: string;
  supplier_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes: string | null;
  created_at: string;
}

export default function Purchases() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultRate, setDefaultRate] = useState('50');
  const [formData, setFormData] = useState({
    supplierId: '',
    quantity: '',
    rate: '50',
    notes: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const amount = parseFloat(formData.quantity || '0') * parseFloat(formData.rate || '0');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch default purchase rate from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'default_purchase_rate')
        .maybeSingle();

      if (settingsData) {
        setDefaultRate(settingsData.value);
        setFormData(prev => ({ ...prev, rate: settingsData.value }));
      }

      // Fetch suppliers with milk rates (sorted by supplier_id)
      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id, supplier_id, name, milk_rate')
        .order('supplier_id');
      
      if (suppData) setSuppliers(suppData);

      // Fetch today's purchases
      const today = new Date();
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          id, quantity, rate, amount, notes, created_at, supplier_id,
          suppliers (name)
        `)
        .eq('type', 'purchase')
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order('created_at', { ascending: false });

      if (txData) {
        setPurchases(txData.map(tx => ({
          id: tx.id,
          supplier_id: tx.supplier_id || '',
          supplier_name: tx.suppliers?.name || 'Unknown',
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

  const handleAddPurchase = async () => {
    if (!formData.supplierId || !formData.quantity || !formData.rate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const supplier = suppliers.find((s) => s.id === formData.supplierId);
    if (!supplier) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        supplier_id: formData.supplierId,
        type: 'purchase',
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
        description: 'Failed to record purchase',
        variant: 'destructive',
      });
    } else {
      setPurchases([{
        id: data.id,
        supplier_id: formData.supplierId,
        supplier_name: supplier.name,
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate),
        amount: amount,
        notes: formData.notes || null,
        created_at: data.created_at,
      }, ...purchases]);
      
      setFormData({
        supplierId: '',
        quantity: '',
        rate: defaultRate,
        notes: '',
      });
      toast({
        title: 'Success',
        description: 'Purchase recorded successfully',
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Purchases" subtitle="Record milk purchases from suppliers">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Purchases" subtitle="Record milk purchases from suppliers">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="stat-card lg:col-span-1 h-fit animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">New Purchase</h3>
              <p className="text-sm text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) => {
                  const selectedSupplier = suppliers.find(s => s.id === value);
                  setFormData({ 
                    ...formData, 
                    supplierId: value,
                    rate: selectedSupplier?.milk_rate ? String(selectedSupplier.milk_rate) : defaultRate
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.supplier_id})
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
                  placeholder="50"
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

            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-display font-bold text-foreground">
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleAddPurchase} 
              className="w-full" 
              variant="gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Record Purchase
            </Button>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="stat-card lg:col-span-2 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Today's Purchases</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'MMMM d, yyyy')}
            </div>
          </div>

          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No purchases recorded today</p>
              <p className="text-sm">Start by recording a new purchase</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{purchase.supplier_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(purchase.created_at), 'h:mm a')}
                      {purchase.notes && ` • ${purchase.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      -₹{purchase.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.quantity}L × ₹{purchase.rate}
                    </p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Purchased Today</span>
                  <span className="text-xl font-display font-bold text-destructive">
                    ₹{purchases.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
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
