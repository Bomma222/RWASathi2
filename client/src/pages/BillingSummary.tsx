import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Bill, User } from '@shared/schema';

interface PaymentForm {
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  notes?: string;
}

export default function BillingSummary() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [paymentDialog, setPaymentDialog] = useState<{ bill: Bill; isOpen: boolean }>({
    bill: {} as Bill,
    isOpen: false
  });
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: 0,
    paymentMethod: 'upi',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bills for selected month
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['/api/bills', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/bills?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json() as Bill[];
    }
  });

  // Fetch all residents
  const { data: residents = [] } = useQuery({
    queryKey: ['/api/residents'],
    queryFn: async () => {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json() as User[];
    }
  });

  // Update bill status mutation
  const updateBillStatus = useMutation({
    mutationFn: async ({ billId, status }: { billId: number; status: string }) => {
      return apiRequest(`/api/bills/${billId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setPaymentDialog({ bill: {} as Bill, isOpen: false });
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

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBillStatus.mutate({
      billId: paymentDialog.bill.id,
      status: paymentForm.amount >= paymentDialog.bill.totalAmount ? 'paid' : 'partially_cleared'
    });
  };

  const openPaymentDialog = (bill: Bill) => {
    setPaymentDialog({ bill, isOpen: true });
    setPaymentForm({
      amount: bill.totalAmount,
      paymentMethod: 'upi',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
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

  // Calculate summary statistics
  const totalBills = bills.length;
  const paidBills = bills.filter(b => b.status === 'paid').length;
  const pendingBills = bills.filter(b => b.status === 'pending').length;
  const totalDues = bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount.toString()), 0);
  const collectedAmount = bills
    .filter(b => b.status === 'paid')
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
          <h1 className="text-2xl font-bold">Billing Summary</h1>
          <p className="text-gray-600">Overview of monthly bills and payment status</p>
        </div>
        
        <div className="flex items-center space-x-4">
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
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">{totalBills}</h3>
              <p className="text-sm text-gray-600">Total Bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">{paidBills}</h3>
              <p className="text-sm text-gray-600">Paid Bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-600">{pendingBills}</h3>
              <p className="text-sm text-gray-600">Pending Bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600">₹{totalDues.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Total Dues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-orange-600">₹{collectedAmount.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Collected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Monthly Bills - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <CardDescription>Click on any bill to record payment or view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
              <div>Flat</div>
              <div>Resident</div>
              <div>Water Usage</div>
              <div>Maintenance</div>
              <div>Water Charges</div>
              <div>Total Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            {bills.map((bill) => (
              <div key={bill.id} className="grid grid-cols-8 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50">
                <div className="font-medium">{bill.flatNumber}</div>
                <div className="text-sm text-gray-600">{getResidentName(bill.flatNumber)}</div>
                <div className="text-center">
                  <Badge variant="outline">{bill.waterUsage}L</Badge>
                </div>
                <div className="text-center">₹{bill.maintenanceCharges}</div>
                <div className="text-center">₹{bill.waterCharges}</div>
                <div className="font-medium">₹{bill.totalAmount}</div>
                <div>{getStatusBadge(bill.status)}</div>
                <div className="flex space-x-2">
                  {bill.status !== 'paid' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openPaymentDialog(bill)}
                    >
                      <i className="fas fa-rupee-sign mr-1"></i>
                      Pay
                    </Button>
                  )}
                  {bill.status === 'paid' && bill.paidAt && (
                    <span className="text-xs text-green-600">
                      Paid: {new Date(bill.paidAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {bills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-file-invoice text-4xl mb-4"></i>
                <p>No bills found for this month.</p>
                <p className="text-sm">Generate bills from Water Meter Reading page.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.isOpen} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for {paymentDialog.bill.flatNumber} - ₹{paymentDialog.bill.totalAmount}
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
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentForm.paymentMethod} 
                onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialog(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBillStatus.isPending}>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}