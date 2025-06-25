import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Bill, User } from '@shared/schema';

export default function ReportsAnalytics() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportType, setReportType] = useState<'monthly' | 'flatwise' | 'analytics'>('monthly');

  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  // Fetch bills for selected month
  const { data: bills = [], isLoading: billsLoading } = useQuery({
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

  // Calculate analytics data
  const totalFlats = residents.filter(r => r.flatStatus === 'occupied').length;
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
  
  const collectionRate = totalDues > 0 ? (collectedAmount / totalDues) * 100 : 0;
  const complianceRate = totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

  const getResidentName = (flatNumber: string) => {
    const resident = residents.find(r => r.flatNumber === flatNumber);
    return resident?.name || 'Unknown';
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive'
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Report exported successfully'
    });
  };

  const exportMonthlySummary = () => {
    const summaryData = [
      {
        'Month': new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        'Total Flats': totalFlats,
        'Bills Generated': totalBills,
        'Bills Paid': paidBills,
        'Bills Pending': pendingBills,
        'Bills Partial': partialBills,
        'Total Dues': `₹${totalDues.toLocaleString()}`,
        'Amount Collected': `₹${collectedAmount.toLocaleString()}`,
        'Amount Pending': `₹${pendingAmount.toLocaleString()}`,
        'Collection Rate': `${collectionRate.toFixed(1)}%`,
        'Compliance Rate': `${complianceRate.toFixed(1)}%`
      }
    ];
    exportToCSV(summaryData, `monthly-summary-${selectedMonth}`);
  };

  const exportFlatwiseReport = () => {
    const flatwiseData = bills.map(bill => ({
      'Flat Number': bill.flatNumber,
      'Resident Name': getResidentName(bill.flatNumber),
      'Month': selectedMonth,
      'Maintenance Charges': `₹${bill.maintenanceCharges}`,
      'Water Usage (L)': bill.waterUsage,
      'Water Charges': `₹${bill.waterCharges}`,
      'Electricity Charges': `₹${bill.electricityCharges}`,
      'Other Charges': `₹${bill.otherCharges}`,
      'Total Amount': `₹${bill.totalAmount}`,
      'Status': bill.status,
      'Due Date': new Date(bill.dueDate).toLocaleDateString(),
      'Paid Date': bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : 'Not Paid'
    }));
    exportToCSV(flatwiseData, `flatwise-report-${selectedMonth}`);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Access restricted to administrators only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (billsLoading) {
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
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Generate reports and analyze billing trends</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="month">Report Month</Label>
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
          
          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Summary</SelectItem>
                <SelectItem value="flatwise">Flat-wise Report</SelectItem>
                <SelectItem value="analytics">Analytics Dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download reports in Excel-compatible CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportMonthlySummary} className="w-full">
              <i className="fas fa-download mr-2"></i>
              Export Monthly Summary
            </Button>
            <Button onClick={exportFlatwiseReport} variant="outline" className="w-full">
              <i className="fas fa-file-excel mr-2"></i>
              Export Flat-wise Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      {reportType === 'analytics' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-600">{complianceRate.toFixed(1)}%</h3>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600">{collectionRate.toFixed(1)}%</h3>
                  <p className="text-sm text-gray-600">Collection Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-purple-600">₹{(collectedAmount / (paidBills || 1)).toFixed(0)}</h3>
                  <p className="text-sm text-gray-600">Avg. Bill Amount</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-orange-600">{totalFlats - totalBills}</h3>
                  <p className="text-sm text-gray-600">Unbilled Flats</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collection Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Analysis</CardTitle>
              <CardDescription>Payment status breakdown for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{paidBills}</div>
                  <div className="text-sm text-gray-600">Paid Bills</div>
                  <div className="text-xs text-green-600">₹{collectedAmount.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{partialBills}</div>
                  <div className="text-sm text-gray-600">Partial Payments</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{pendingBills}</div>
                  <div className="text-sm text-gray-600">Pending Bills</div>
                  <div className="text-xs text-red-600">₹{pendingAmount.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{totalFlats - totalBills}</div>
                  <div className="text-sm text-gray-600">Not Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Monthly Summary */}
      {reportType === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary Report</CardTitle>
            <CardDescription>
              Comprehensive summary for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Bill Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Flats:</span>
                    <span className="font-medium">{totalFlats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bills Generated:</span>
                    <span className="font-medium">{totalBills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bills Paid:</span>
                    <span className="font-medium text-green-600">{paidBills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bills Pending:</span>
                    <span className="font-medium text-red-600">{pendingBills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partial Payments:</span>
                    <span className="font-medium text-yellow-600">{partialBills}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Financial Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Dues:</span>
                    <span className="font-medium">₹{totalDues.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Collected:</span>
                    <span className="font-medium text-green-600">₹{collectedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Pending:</span>
                    <span className="font-medium text-red-600">₹{pendingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection Rate:</span>
                    <span className="font-medium">{collectionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance Rate:</span>
                    <span className="font-medium">{complianceRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flat-wise Report */}
      {reportType === 'flatwise' && (
        <Card>
          <CardHeader>
            <CardTitle>Flat-wise Payment Report</CardTitle>
            <CardDescription>Detailed breakdown by flat for audit purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                <div>Flat</div>
                <div>Resident</div>
                <div>Total Amount</div>
                <div>Status</div>
                <div>Water Usage</div>
                <div>Due Date</div>
                <div>Paid Date</div>
                <div>Notes</div>
              </div>
              
              {bills.map((bill) => (
                <div key={bill.id} className="grid grid-cols-8 gap-4 items-center py-2 border-b border-gray-100 text-sm">
                  <div className="font-medium">{bill.flatNumber}</div>
                  <div>{getResidentName(bill.flatNumber)}</div>
                  <div>₹{bill.totalAmount}</div>
                  <div>
                    <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'}>
                      {bill.status}
                    </Badge>
                  </div>
                  <div>{bill.waterUsage}L</div>
                  <div>{new Date(bill.dueDate).toLocaleDateString()}</div>
                  <div>{bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'}</div>
                  <div className="text-xs text-gray-500">
                    {bill.status === 'paid' ? 'Completed' : 'Pending payment'}
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
      )}
    </div>
  );
}