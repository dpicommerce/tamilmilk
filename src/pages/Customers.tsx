import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Plus, Search, User, Phone, MapPin, Edit, Trash2, Hash, Loader2 } from 'lucide-react';
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
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  milk_rate: number;
  created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextCustomerId, setNextCustomerId] = useState('CUST001');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    milk_rate: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    milk_rate: '',
  });
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } else {
      setCustomers(data || []);
    }
    setIsLoading(false);
  };

  const fetchNextCustomerId = async () => {
    const { data, error } = await supabase.rpc('generate_customer_id');
    if (!error && data) {
      setNextCustomerId(data);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchNextCustomerId();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      customer.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCustomer = async (reason: string) => {
    if (!customerToDelete || !user) return;

    // First, store the deleted record
    const { error: auditError } = await supabase
      .from('deleted_records')
      .insert([{
        table_name: 'customers' as const,
        record_id: customerToDelete.id,
        record_data: JSON.parse(JSON.stringify(customerToDelete)),
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

    // Then delete the customer
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerToDelete.id);

    if (deleteError) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
      return;
    }

    setCustomers(customers.filter(c => c.id !== customerToDelete.id));
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
    toast({
      title: 'Success',
      description: 'Customer deleted successfully',
    });
  };

  const handleAddCustomer = async () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Please enter customer name',
        variant: 'destructive',
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can add customers',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        customer_id: nextCustomerId,
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        milk_rate: parseFloat(formData.milk_rate) || 0,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error',
        description: error.message.includes('row-level security')
          ? 'Only admins can add customers'
          : 'Failed to add customer',
        variant: 'destructive',
      });
    } else {
      setCustomers([data, ...customers]);
      setFormData({ name: '', phone: '', address: '', milk_rate: '' });
      setIsDrawerOpen(false);
      fetchNextCustomerId();
      toast({
        title: 'Success',
        description: `Customer ${data.customer_id} added successfully`,
      });
    }

    setIsSubmitting(false);
  };

  const handleEditCustomer = (customer: CustomerData) => {
    setCustomerToEdit(customer);
    setEditFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      milk_rate: customer.milk_rate.toString(),
    });
    setIsEditDrawerOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!customerToEdit || !editFormData.name) {
      toast({
        title: 'Error',
        description: 'Please enter customer name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: editFormData.name,
        phone: editFormData.phone || null,
        address: editFormData.address || null,
        milk_rate: parseFloat(editFormData.milk_rate) || 0,
      })
      .eq('id', customerToEdit.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    } else {
      setCustomers(customers.map(c => c.id === data.id ? data : c));
      setIsEditDrawerOpen(false);
      setCustomerToEdit(null);
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Customers" subtitle="Manage your customer database">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Customers" subtitle="Manage your customer database">
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
                Add Customer
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add New Customer</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-4 p-4 pb-8">
                <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Customer ID:</span>
                  <span className="font-semibold text-primary">{nextCustomerId}</span>
                </div>
                <div>
                  <Label htmlFor="name" className="text-base">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Customer name"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base">Mobile Number (Optional)</Label>
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
                    placeholder="Customer address"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="milk_rate" className="text-base">Milk Rate (₹/L) *</Label>
                  <Input
                    id="milk_rate"
                    type="number"
                    step="0.01"
                    value={formData.milk_rate}
                    onChange={(e) => setFormData({ ...formData, milk_rate: e.target.value })}
                    placeholder="e.g. 55.00"
                    className="h-12 text-base mt-1"
                  />
                </div>
                <Button 
                  onClick={handleAddCustomer} 
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
                    'Add Customer'
                  )}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Customer List - Mobile Card View */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="stat-card p-4 animate-slide-up"
            >
              {/* Top Row: Avatar, Name, ID, Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-base sm:text-lg text-foreground truncate">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Hash className="w-3 h-3" />
                      {customer.customer_id}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setCustomerToDelete(customer);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
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
                      Number(customer.balance) >= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {Number(customer.balance) >= 0 ? '+' : ''}₹{Math.abs(Number(customer.balance)).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <p className="font-semibold text-primary">₹{Number(customer.milk_rate).toFixed(2)}/L</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${customerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteCustomer}
      />

      {/* Edit Customer Drawer */}
      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Customer</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 p-4 pb-8">
            <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Customer ID:</span>
              <span className="font-semibold text-primary">{customerToEdit?.customer_id}</span>
            </div>
            <div>
              <Label htmlFor="edit-name" className="text-base">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Customer name"
                className="h-12 text-base mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone" className="text-base">Mobile Number (Optional)</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+91 12345 67890"
                className="h-12 text-base mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-address" className="text-base">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Customer address"
                className="h-12 text-base mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-milk_rate" className="text-base">Milk Rate (₹/L) *</Label>
              <Input
                id="edit-milk_rate"
                type="number"
                step="0.01"
                value={editFormData.milk_rate}
                onChange={(e) => setEditFormData({ ...editFormData, milk_rate: e.target.value })}
                placeholder="e.g. 55.00"
                className="h-12 text-base mt-1"
              />
            </div>
            <Button 
              onClick={handleUpdateCustomer} 
              className="w-full h-12 text-base" 
              variant="gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Customer'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </MainLayout>
  );
}
