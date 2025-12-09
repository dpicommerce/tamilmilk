import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  Milk,
  CreditCard,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Purchases', path: '/purchases' },
  { icon: TrendingUp, label: 'Sales', path: '/sales' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: CreditCard, label: 'Transactions', path: '/transactions' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen sidebar-gradient flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
          <Milk className="w-6 h-6 text-sidebar-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-display font-bold text-sidebar-foreground">
              MilkTrack
            </h1>
            <p className="text-xs text-sidebar-foreground/70">Dairy Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium animate-fade-in">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-4 p-2 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground"
      >
        <ChevronLeft
          className={cn(
            'w-5 h-5 transition-transform duration-300 mx-auto',
            collapsed && 'rotate-180'
          )}
        />
      </button>
    </aside>
  );
}
