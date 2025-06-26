import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Bill, User } from '@shared/schema';

interface PaymentRecord {
  billId: number;
  flatNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  notes?: string;
  status: 'paid' | 'partially_cleared';
}

export default function PaymentManagement() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [paymentDialog, setPaymentDialog] = useState<{ bill: Bill; isOpen: boolean }>({
    bill: {} as Bill,
    isOpen: false
  });
  const [paymentForm, setPaymentForm] = useState<PaymentRecord>({
    billId: 0,
    flatNumber: '',
    amount: 0,
    paymentMethod: 'upi',
    notes: '',
    status: 'paid'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bills for selected month
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['/api/bills', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/bills?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json() as Promise<Bill[]>;
    }
  });

  // Fetch all residents
  const { data: residents = [] } = useQuery({
    queryKey: ['/api/residents'],
    queryFn: async () => {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json() as Promise<User[]>;
    }
  });

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: async (payment: PaymentRecord) => {
      return apiRequest(
        'PUT',
        `/api/bills/${payment.billId}/status`,
        { 
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,
          amount: payment.amount
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setPaymentDialog({ bill: {} as Bill, isOpen: false });
      resetPaymentForm();
      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      });
    }
  });

  // Mark bill as cleared mutation
  const markAsCleared = useMutation({
    mutationFn: async (billId: number) => {
      return apiRequest(
        'PUT',
        `/api/bills/${billId}/status`,
        { status: 'paid' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Success',
        description: 'Bill marked as cleared'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark bill as cleared',
        variant: 'destructive'
      });
    }
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      billId: 0,
      flatNumber: '',
      amount: 0,
      paymentMethod: 'upi',
      notes: '',
      status: 'paid'
    });
  };

  const openPaymentDialog = (bill: Bill) => {
    setPaymentDialog({ bill, isOpen: true });
    setPaymentForm({
      billId: bill.id,
      flatNumber: bill.flatNumber,
      amount: parseFloat(bill.totalAmount.toString()),
      paymentMethod: 'upi',
      notes: '',
      status: 'paid'
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine status based on amount
    const totalAmount = parseFloat(paymentDialog.bill.totalAmount.toString());
    const paidAmount = paymentForm.amount;
    
    const finalPayment = {
      ...paymentForm,
      status: (paidAmount >= totalAmount ? 'paid' : 'partially_cleared') as 'paid' | 'partially_cleared'
    };
    
    recordPayment.mutate(finalPayment);
  };

  const getStatusBadge = (status: string, amount?: number, totalAmount?: number) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'partially_cleared':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getResidentName = (flatNumber: string) => {
    const resident = residents.find(r => r.flatNumber === flatNumber);
    return resident?.name || 'Unknown';
  };

  // Calculate payment statistics
  const totalBills = bills.length;
  const paidBills = bills.filter(b => b.status === 'paid').length;
  const pendingBills = bills.filter(b => b.status === 'pending').length;
  const partialBills = bills.filter(b => b.status === 'partially_cleared').length;
  const totalDues = bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount.toString()), 0);
  const collectedAmount = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, bill) => sum + parseFloat(bill.totalAmount.toString()), 0);
  const pendingAmount = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, bill) => sum + parseFloat(bill.totalAmount.toString()), 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-gray-600">Record payments and manage dues collection</p>
        </div>
        
        <div>
          <Label htmlFor="month">Billing Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-600">{totalBills}</h3>
              <p className="text-xs text-gray-600">Total Bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-600">{paidBills}</h3>
              <p className="text-xs text-gray-600">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-yellow-600">{partialBills}</h3>
              <p className="text-xs text-gray-600">Partial</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-600">{pendingBills}</h3>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-600">₹{collectedAmount.toLocaleString()}</h3>
              <p className="text-xs text-gray-600">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-purple-600">₹{pendingAmount.toLocaleString()}</h3>
              <p className="text-xs text-gray-600">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Record payments received from residents for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
              <div>Flat</div>
              <div>Resident</div>
              <div>Total Amount</div>
              <div>Status</div>
              <div>Paid Date</div>
              <div>Actions</div>
              <div>Quick Actions</div>
            </div>
            
            {bills.map((bill) => (
              <div key={bill.id} className="grid grid-cols-7 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50">
                <div className="font-medium">{bill.flatNumber}</div>
                <div className="text-sm text-gray-600">{getResidentName(bill.flatNumber)}</div>
                <div className="font-medium">₹{bill.totalAmount}</div>
                <div>{getStatusBadge(bill.status)}</div>
                <div className="text-xs text-gray-500">
                  {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'}
                </div>
                <div className="flex space-x-2">
                  {bill.status !== 'paid' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openPaymentDialog(bill)}
                    >
                      <i className="fas fa-rupee-sign mr-1"></i>
                      Record
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  {bill.status !== 'paid' && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => markAsCleared.mutate(bill.id)}
                      disabled={markAsCleared.isPending}
                    >
                      <i className="fas fa-check mr-1"></i>
                      Mark Cleared
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {bills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-file-invoice text-4xl mb-4"></i>
                <p>No bills found for this month.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialog.isOpen} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment received for {paymentDialog.bill.flatNumber} (Total: ₹{paymentDialog.bill.totalAmount})
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount Received *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {paymentForm.amount < parseFloat(paymentDialog.bill.totalAmount?.toString() || '0') ? 
                  'Partial payment - bill will be marked as partially cleared' : 
                  'Full payment - bill will be marked as paid'
                }
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select 
                value={paymentForm.paymentMethod} 
                onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI / Digital Payment</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer / NEFT</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Payment Notes</Label>
              <Textarea
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the payment (optional)"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPaymentDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                <i className="fas fa-save mr-2"></i>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}