import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Milk } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <MainLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-3xl space-y-6">
        {/* Business Settings */}
        <div className="stat-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Milk className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Business Settings</h3>
              <p className="text-sm text-muted-foreground">Configure your dairy business details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" defaultValue="MilkTrack Dairy" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+91 98765 43210" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue="123 Dairy Lane, Mumbai" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultPurchaseRate">Default Purchase Rate (₹/L)</Label>
                <Input id="defaultPurchaseRate" type="number" defaultValue="50" />
              </div>
              <div>
                <Label htmlFor="defaultSaleRate">Default Sale Rate (₹/L)</Label>
                <Input id="defaultSaleRate" type="number" defaultValue="60" />
              </div>
            </div>
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
              <p className="text-sm text-muted-foreground">Manage your personal information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Admin User" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@milktrack.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Change Password</Label>
              <Input id="password" type="password" placeholder="Enter new password" />
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

        {/* User Roles Notice */}
        <div className="stat-card animate-slide-up border-primary/20" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Admin & User Roles</h3>
              <p className="text-sm text-muted-foreground">Manage team access levels</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">
            To enable user roles and team management with secure authentication, connect to a database backend.
          </p>
          <Button variant="outline">
            <Database className="w-4 h-4 mr-2" />
            Connect Database
          </Button>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} variant="gradient" size="lg" className="w-full">
          Save Settings
        </Button>
      </div>
    </MainLayout>
  );
}
