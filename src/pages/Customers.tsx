import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCustomers } from '@/lib/mockData';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Search, User, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const { toast } = useToast();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
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
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      balance: 0,
      createdAt: new Date(),
    };

    setCustomers([...customers, newCustomer]);
    setFormData({ name: '', phone: '', address: '' });
    setIsDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Customer added successfully',
    });
  };

  return (
    <MainLayout title="Customers" subtitle="Manage your customer database">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 12345 67890"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Customer address"
                />
              </div>
              <Button onClick={handleAddCustomer} className="w-full" variant="gradient">
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="stat-card hover:shadow-elevated transition-shadow animate-slide-up"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {customer.name}
            </h3>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {customer.address}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span
                  className={cn(
                    'font-semibold',
                    customer.balance >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {customer.balance >= 0 ? '+' : ''}₹{customer.balance.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Customer since {format(customer.createdAt, 'MMM yyyy')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
