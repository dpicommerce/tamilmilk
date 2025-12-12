import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Plus, Search, Truck, Phone, MapPin, Edit, Trash2, Hash, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SupplierData {
  id: string;
  supplier_id: string;
  name: string;
  phone: string;
  address: string | null;
  balance: number;
  created_at: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextSupplierId, setNextSupplierId] = useState('SUPP001');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      });
    } else {
      setSuppliers(data || []);
    }
    setIsLoading(false);
  };

  const fetchNextSupplierId = async () => {
    const { data, error } = await supabase.rpc('generate_supplier_id');
    if (!error && data) {
      setNextSupplierId(data);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchNextSupplierId();
  }, []);

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.includes(searchQuery) ||
      supplier.supplier_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can add suppliers',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        supplier_id: nextSupplierId,
        name: formData.name,
        phone: formData.phone,
        address: formData.address || null,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: 'Error',
        description: error.message.includes('row-level security')
          ? 'Only admins can add suppliers'
          : 'Failed to add supplier',
        variant: 'destructive',
      });
    } else {
      setSuppliers([data, ...suppliers]);
      setFormData({ name: '', phone: '', address: '' });
      setIsDrawerOpen(false);
      fetchNextSupplierId();
      toast({
        title: 'Success',
        description: `Supplier ${data.supplier_id} added successfully`,
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Suppliers" subtitle="Manage your milk suppliers">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Suppliers" subtitle="Manage your milk suppliers">
      {/* Header Actions - Mobile Optimized */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        {/* Only show Add button for admins */}
        {isAdmin && (
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="gradient" className="w-full h-12 text-base">
                <Plus className="w-5 h-5 mr-2" />
                Add Supplier
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add New Supplier</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-4 p-4 pb-8">
                <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Supplier ID:</span>
                  <span className="font-semibold text-primary">{nextSupplierId}</span>
                </div>
                <div>
                  <Label htmlFor="name" className="text-base">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Supplier name"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base">Mobile Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 12345 67890"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-base">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Supplier address"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <Button 
                  onClick={handleAddSupplier} 
                  className="w-full h-12 text-base" 
                  variant="gradient"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add Supplier'
                  )}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Supplier List - Mobile Card View */}
      <div className="space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No suppliers found</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="stat-card p-4 animate-slide-up"
            >
              {/* Top Row: Avatar, Name, ID, Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-base sm:text-lg text-foreground truncate">
                      {supplier.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-accent font-medium">
                      <Hash className="w-3 h-3" />
                      {supplier.supplier_id}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{supplier.phone}</span>
                </div>
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Balance Footer */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <p
                    className={cn(
                      'font-semibold text-lg',
                      Number(supplier.balance) >= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {Number(supplier.balance) >= 0 ? '+' : ''}₹{Math.abs(Number(supplier.balance)).toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Since {format(new Date(supplier.created_at), 'MMM yyyy')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
