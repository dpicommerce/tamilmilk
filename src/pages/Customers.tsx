import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCustomers } from '@/lib/mockData';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Search, User, Phone, MapPin, Edit, Trash2, Hash } from 'lucide-react';
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

const generateCustomerId = (customers: Customer[]) => {
  const maxId = customers.reduce((max, c) => {
    const num = parseInt(c.customerId.replace('CUST', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `CUST${String(maxId + 1).padStart(3, '0')}`;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const { toast } = useToast();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString(),
      customerId: generateCustomerId(customers),
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      balance: 0,
      createdAt: new Date(),
    };

    setCustomers([...customers, newCustomer]);
    setFormData({ name: '', phone: '', address: '' });
    setIsDrawerOpen(false);
    toast({
      title: 'Success',
      description: `Customer ${newCustomer.customerId} added successfully`,
    });
  };

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
                <span className="font-semibold text-primary">{generateCustomerId(customers)}</span>
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
                  placeholder="Customer address"
                  className="h-12 text-base mt-1"
                />
              </div>
              <Button onClick={handleAddCustomer} className="w-full h-12 text-base" variant="gradient">
                Add Customer
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
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
                      {customer.customerId}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{customer.phone}</span>
                </div>
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
                      customer.balance >= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {customer.balance >= 0 ? '+' : ''}₹{Math.abs(customer.balance).toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Since {format(customer.createdAt, 'MMM yyyy')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
