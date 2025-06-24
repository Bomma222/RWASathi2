import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function DetailedBilling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);

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
  });

  const addBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      return apiRequest('POST', '/api/bills', billData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
      setShowAddForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'cleared': return 'bg-green-500';
      case 'unpaid': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'not_cleared': return 'bg-red-500';
      case 'partially_cleared': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Cleared';
      case 'cleared': return 'Cleared';
      case 'unpaid': return 'Not Cleared';
      case 'overdue': return 'Not Cleared';
      case 'not_cleared': return 'Not Cleared';
      case 'partially_cleared': return 'Partially Cleared';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Monthly Maintenance - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <i className="fas fa-plus mr-2"></i>
            Generate Bill
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-card text-center">
          <div className="text-2xl font-bold text-success">
            ₹{bills?.filter((bill: any) => bill.status === 'paid' || bill.status === 'cleared')
              .reduce((sum: number, bill: any) => sum + parseFloat(bill.totalAmount), 0)
              .toLocaleString() || 0}
          </div>
          <div className="text-xs text-gray-600">Collected</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-card text-center">
          <div className="text-2xl font-bold text-error">
            ₹{bills?.filter((bill: any) => bill.status !== 'paid' && bill.status !== 'cleared')
              .reduce((sum: number, bill: any) => sum + parseFloat(bill.presentDues), 0)
              .toLocaleString() || 0}
          </div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-card text-center">
          <div className="text-2xl font-bold text-primary">
            {bills?.length || 0}
          </div>
          <div className="text-xs text-gray-600">Total Flats</div>
        </div>
      </div>

      {/* Detailed Bills Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Flat No</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Occupancy</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Past Water Reading</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Present Water Reading</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Used Liters</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Water Bill</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">General Maintenance</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Repair Charges</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Previous Dues</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Total Amount</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Present Dues</th>
                <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                {user?.role === 'admin' && (
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills?.map((bill: any) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{bill.flatNumber}</td>
                  <td className="px-3 py-2 text-gray-600">Occupied</td>
                  <td className="px-3 py-2 text-right">{bill.pastWaterReading?.toLocaleString() || 0}</td>
                  <td className="px-3 py-2 text-right">{bill.presentWaterReading?.toLocaleString() || 0}</td>
                  <td className="px-3 py-2 text-right">{bill.usedLiters?.toLocaleString() || 0}</td>
                  <td className="px-3 py-2 text-right">₹{parseFloat(bill.waterBill || '0').toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">₹{parseFloat(bill.generalMaintenance || '0').toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">₹{parseFloat(bill.repairCharges || '0').toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">₹{parseFloat(bill.previousDues || '0').toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">₹{parseFloat(bill.totalAmount).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">
                    {bill.status === 'paid' || bill.status === 'cleared' ? '₹0.00' : `₹${parseFloat(bill.presentDues).toFixed(2)}`}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(bill.status)}`} title={getStatusText(bill.status)}></span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1">
                        {bill.status !== 'paid' && bill.status !== 'cleared' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBillMutation.mutate({ id: bill.id, status: 'partially_cleared' })}
                              disabled={updateBillMutation.isPending}
                              className="text-xs"
                            >
                              Partial
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateBillMutation.mutate({ id: bill.id, status: 'paid' })}
                              disabled={updateBillMutation.isPending}
                              className="text-xs"
                            >
                              Clear
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Payment Instructions</h3>
        <p className="text-blue-700 text-sm mb-2">
          All residents are requested to use <strong>Paytm/PhonePe/GPay</strong> within 15th of each month.
        </p>
        <p className="text-blue-600 text-xs">
          Alternative payment methods: Paytm/PhonePe to 8977194169, GPay to bank account.
        </p>
        <p className="text-blue-600 text-xs">
          Using alternative method, must send payment details to Association on WhatsApp (8977194169)
        </p>
        <p className="text-blue-600 text-xs mt-2">
          <strong>Note:</strong> If any issues/concerns about billing amount, contact - Maintenance Team.
        </p>
      </div>

      {/* Water Consumption Summary */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Water Consumption Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Liters Consumed</div>
            <div className="text-xl font-bold text-blue-600">
              {bills?.reduce((sum: number, bill: any) => sum + (bill.usedLiters || 0), 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Average per Flat</div>
            <div className="text-xl font-bold text-blue-600">
              {bills?.length ? Math.round(bills.reduce((sum: number, bill: any) => sum + (bill.usedLiters || 0), 0) / bills.length).toLocaleString() : 0}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Water Bill Total</div>
            <div className="text-xl font-bold text-blue-600">
              ₹{bills?.reduce((sum: number, bill: any) => sum + parseFloat(bill.waterBill || '0'), 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Rate per Liter</div>
            <div className="text-xl font-bold text-blue-600">₹0.05</div>
          </div>
        </div>
      </div>
    </div>
  );
}