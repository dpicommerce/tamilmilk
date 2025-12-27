import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, User, Truck, CreditCard, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DeletedRecord {
  id: string;
  table_name: string;
  record_id: string;
  record_data: any;
  deletion_reason: string;
  deleted_by: string | null;
  deleted_at: string;
}

const tableIcons = {
  customers: User,
  suppliers: Truck,
  transactions: CreditCard,
};

const tableLabels = {
  customers: 'Customer',
  suppliers: 'Supplier',
  transactions: 'Transaction',
};

export default function DeletedRecords() {
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTable, setFilterTable] = useState<string>('all');
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchDeletedRecords = async () => {
      const { data, error } = await supabase
        .from('deleted_records')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (!error && data) {
        setRecords(data);
      }
      setIsLoading(false);
    };

    if (isAdmin) {
      fetchDeletedRecords();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredRecords = records.filter((record) => {
    const matchesTable = filterTable === 'all' || record.table_name === filterTable;
    const recordName = record.record_data?.name || record.record_data?.customer_name || record.record_data?.supplier_name || '';
    const matchesSearch = recordName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.deletion_reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTable && matchesSearch;
  });

  if (isLoading) {
    return (
      <MainLayout title="Deleted Records" subtitle="View audit trail of deleted data">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Deleted Records" subtitle="View audit trail of deleted data">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-full sm:w-48 h-12">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="suppliers">Suppliers</SelectItem>
            <SelectItem value="transactions">Transactions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground stat-card">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No deleted records found</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const Icon = tableIcons[record.table_name as keyof typeof tableIcons] || Trash2;
            const label = tableLabels[record.table_name as keyof typeof tableLabels] || record.table_name;
            const recordName = record.record_data?.name || record.record_data?.customer_name || record.record_data?.supplier_name || 'Unknown';

            return (
              <div key={record.id} className="stat-card p-4 animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{recordName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deleted on {format(new Date(record.deleted_at), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <div className="mt-2 p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">Reason:</p>
                      <p className="text-sm text-muted-foreground mt-1">{record.deletion_reason}</p>
                    </div>
                    {record.table_name === 'transactions' && record.record_data && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Amount:</span> ₹{Number(record.record_data.amount || 0).toLocaleString('en-IN')}
                        {record.record_data.quantity > 0 && (
                          <span className="ml-3">
                            <span className="font-medium">Qty:</span> {record.record_data.quantity}L
                          </span>
                        )}
                      </div>
                    )}
                    {(record.table_name === 'customers' || record.table_name === 'suppliers') && record.record_data && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Balance:</span> ₹{Number(record.record_data.balance || 0).toLocaleString('en-IN')}
                        {record.record_data.phone && (
                          <span className="ml-3">
                            <span className="font-medium">Phone:</span> {record.record_data.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
