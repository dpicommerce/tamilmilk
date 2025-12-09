import { Plus, ShoppingCart, TrendingUp, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: ShoppingCart, label: 'New Purchase', path: '/purchases', variant: 'default' as const },
    { icon: TrendingUp, label: 'Record Sale', path: '/sales', variant: 'accent' as const },
    { icon: Users, label: 'Add Customer', path: '/customers', variant: 'secondary' as const },
    { icon: FileText, label: 'View Reports', path: '/reports', variant: 'secondary' as const },
  ];

  return (
    <div className="stat-card animate-slide-up">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.path}
            variant={action.variant}
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
