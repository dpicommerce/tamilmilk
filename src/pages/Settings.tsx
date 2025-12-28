import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Milk, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultPurchaseRate, setDefaultPurchaseRate] = useState('35');
  const [defaultSalesRate, setDefaultSalesRate] = useState('50');
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['default_purchase_rate', 'default_sales_rate']);

      if (data) {
        data.forEach(setting => {
          if (setting.key === 'default_purchase_rate') {
            setDefaultPurchaseRate(setting.value);
          } else if (setting.key === 'default_sales_rate') {
            setDefaultSalesRate(setting.value);
          }
        });
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSaveRates = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can update rates',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    // Update purchase rate
    const { error: purchaseError } = await supabase
      .from('settings')
      .update({ value: defaultPurchaseRate, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq('key', 'default_purchase_rate');

    // Update sales rate
    const { error: salesError } = await supabase
      .from('settings')
      .update({ value: defaultSalesRate, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq('key', 'default_sales_rate');

    if (purchaseError || salesError) {
      toast({
        title: 'Error',
        description: 'Failed to update rates',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Default rates updated successfully',
      });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your account and preferences">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-3xl space-y-6">
        {/* Business Settings - Default Rates */}
        <div className="stat-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Milk className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Default Rates</h3>
              <p className="text-sm text-muted-foreground">Set default milk purchase and sales rates</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultPurchaseRate">Default Purchase Rate (₹/L)</Label>
                <Input 
                  id="defaultPurchaseRate" 
                  type="number" 
                  step="0.01"
                  value={defaultPurchaseRate}
                  onChange={(e) => setDefaultPurchaseRate(e.target.value)}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground mt-1">Rate paid to suppliers</p>
              </div>
              <div>
                <Label htmlFor="defaultSaleRate">Default Sale Rate (₹/L)</Label>
                <Input 
                  id="defaultSaleRate" 
                  type="number" 
                  step="0.01"
                  value={defaultSalesRate}
                  onChange={(e) => setDefaultSalesRate(e.target.value)}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground mt-1">Rate charged to customers</p>
              </div>
            </div>
            {isAdmin && (
              <Button 
                onClick={handleSaveRates} 
                variant="gradient" 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Default Rates'
                )}
              </Button>
            )}
            {!isAdmin && (
              <p className="text-sm text-muted-foreground text-center">
                Only admins can change default rates
              </p>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Account Settings</h3>
              <p className="text-sm text-muted-foreground">Your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={isAdmin ? 'Admin' : 'User'} disabled />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Notifications</h3>
              <p className="text-sm text-muted-foreground">Configure notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts for transactions</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Daily summary to your email</p>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
          </div>
        </div>

        {/* Admin Info */}
        {isAdmin && (
          <div className="stat-card animate-slide-up border-primary/20" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Admin Access</h3>
                <p className="text-sm text-muted-foreground">You have full admin privileges</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              As an admin, you can manage customers, suppliers, transactions, and default rates.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}