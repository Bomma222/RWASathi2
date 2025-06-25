import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function BillingModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: bills, isLoading } = useQuery({
    queryKey: ['/api/bills'],
  });

  const updateBillMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/bills/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Bill status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    },
  });

  // Restrict billing access for watchman
  if (user?.role === 'watchman') {
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="font-semibold text-gray-800 mb-2">Access Restricted</h3>
        <p className="text-sm text-gray-600">Billing information is not available for your role.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter bills based on user role
  const userBills = user?.role === 'admin' 
    ? bills 
    : bills?.filter((bill: any) => 
        bill.flatNumber === user?.flatNumber || 
        (user?.role === 'resident' && bill.residentId === user?.id)
      ) || [];

  const filteredBills = userBills.filter((bill: any) => {
    if (filterStatus === 'all') return true;
    return bill.status === filterStatus;
  });

  const collectedAmount = bills?.filter((bill: any) => bill.status === 'paid')
    .reduce((sum: number, bill: any) => sum + parseFloat(bill.amount), 0) || 0;

  const pendingAmount = bills?.filter((bill: any) => bill.status !== 'paid')
    .reduce((sum: number, bill: any) => sum + parseFloat(bill.amount), 0) || 0;

  const handleMarkPaid = (billId: number) => {
    updateBillMutation.mutate({ id: billId, status: 'paid' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('maintenanceBilling')}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation('/bills/detailed')}
            className="text-sm"
          >
            <i className="fas fa-table mr-2"></i>
            Detailed View
          </Button>
          {user?.role === 'admin' && (
            <>
              <Button 
                variant="outline"
                onClick={() => setLocation('/bills/fields')}
                className="text-sm"
              >
                <i className="fas fa-cog mr-2"></i>
                Configure Fields
              </Button>
              <Button className="bg-primary text-white">
                <i className="fas fa-plus mr-2"></i>
                {t('generateBills')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bill Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-card text-center">
          <div className="text-2xl font-bold text-success">₹{collectedAmount.toLocaleString()}</div>
          <div className="text-xs text-gray-600">{t('collectedThisMonth')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-card text-center">
          <div className="text-2xl font-bold text-error">₹{pendingAmount.toLocaleString()}</div>
          <div className="text-xs text-gray-600">{t('pendingCollection')}</div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Bills
          </h3>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allFlats')}</SelectItem>
              <SelectItem value="paid">{t('paid')}</SelectItem>
              <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
              <SelectItem value="overdue">{t('overdue')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredBills.map((bill: any) => (
            <div key={bill.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{bill.flatNumber} - Tower {bill.tower || 'A'}</p>
                <p className="text-sm text-gray-600">Resident #{bill.residentId}</p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(bill.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">₹{parseFloat(bill.totalAmount || bill.amount || '0').toLocaleString()}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}>
                    {getStatusText(bill.status)}
                  </span>
                  {bill.status === 'unpaid' && user?.role === 'admin' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={updateBillMutation.isPending}
                    >
                      Mark Paid
                    </Button>
                  )}
                  {bill.status === 'unpaid' && user?.role === 'resident' && bill.flatNumber === user.flatNumber && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={updateBillMutation.isPending}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredBills.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No bills found for the selected filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'bg-success text-white';
    case 'unpaid': return 'bg-warning text-white';
    case 'overdue': return 'bg-error text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'paid': return t('paid');
    case 'unpaid': return t('unpaid');
    case 'overdue': return t('overdue');
    default: return status;
  }
}
