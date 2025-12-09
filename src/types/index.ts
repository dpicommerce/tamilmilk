export interface Customer {
  id: string;
  customerId: string; // Unique customer ID like "CUST001"
  name: string;
  phone: string;
  address: string;
  balance: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'purchase' | 'sale' | 'credit' | 'debit';
  quantity: number;
  rate: number;
  amount: number;
  date: Date;
  notes?: string;
}

export interface DailySummary {
  date: Date;
  totalPurchase: number;
  totalSales: number;
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}
