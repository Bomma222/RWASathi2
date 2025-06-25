import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { User, Bill } from '@shared/schema';

interface WaterReading {
  flatNumber: string;
  residentId: number;
  currentReading: number;
  previousReading: number;
  waterUsage: number;
  waterCharges: number;
}

export default function WaterMeterReading() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [readings, setReadings] = useState<Record<string, WaterReading>>({});
  const [waterRate] = useState(0.05); // ₹0.05 per liter

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all residents
  const { data: residents = [], isLoading: residentsLoading } = useQuery({
    queryKey: ['/api/residents'],
    queryFn: async () => {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json() as User[];
    }
  });

  // Fetch existing bills for selected month
  const { data: existingBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['/api/bills', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/bills?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json() as Bill[];
    }
  });

  // Generate bills mutation
  const generateBills = useMutation({
    mutationFn: async (billsData: any[]) => {
      const promises = billsData.map(bill => 
        apiRequest('/api/bills', {
          method: 'POST',
          body: JSON.stringify(bill)
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Success',
        description: 'Monthly bills generated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate bills',
        variant: 'destructive'
      });
    }
  });

  // Initialize readings when residents or existing bills change
  useState(() => {
    if (residents.length > 0) {
      const newReadings: Record<string, WaterReading> = {};
      
      residents.filter(r => r.flatStatus === 'occupied').forEach(resident => {
        const existingBill = existingBills.find(b => b.flatNumber === resident.flatNumber);
        
        newReadings[resident.flatNumber] = {
          flatNumber: resident.flatNumber,
          residentId: resident.id,
          currentReading: existingBill?.currentReading || 0,
          previousReading: existingBill?.previousReading || 0,
          waterUsage: existingBill?.waterUsage || 0,
          waterCharges: existingBill?.waterCharges || 0
        };
      });
      
      setReadings(newReadings);
    }
  });

  const updateReading = (flatNumber: string, field: keyof WaterReading, value: number) => {
    setReadings(prev => {
      const updated = { ...prev };
      updated[flatNumber] = { ...updated[flatNumber], [field]: value };
      
      // Auto-calculate water usage and charges
      if (field === 'currentReading' || field === 'previousReading') {
        const current = field === 'currentReading' ? value : updated[flatNumber].currentReading;
        const previous = field === 'previousReading' ? value : updated[flatNumber].previousReading;
        const usage = Math.max(0, current - previous);
        const charges = usage * waterRate;
        
        updated[flatNumber].waterUsage = usage;
        updated[flatNumber].waterCharges = Math.round(charges * 100) / 100;
      }
      
      return updated;
    });
  };

  const handleGenerateBills = () => {
    const billsData = Object.values(readings).map(reading => {
      const fixedCharges = {
        maintenanceCharges: 2500.00,
        electricityCharges: 800.00,
        otherCharges: 300.00
      };
      
      const totalAmount = fixedCharges.maintenanceCharges + 
                         fixedCharges.electricityCharges + 
                         fixedCharges.otherCharges + 
                         reading.waterCharges;

      return {
        flatNumber: reading.flatNumber,
        residentId: reading.residentId,
        month: selectedMonth,
        previousReading: reading.previousReading,
        currentReading: reading.currentReading,
        waterUsage: reading.waterUsage,
        maintenanceCharges: fixedCharges.maintenanceCharges,
        waterCharges: reading.waterCharges,
        electricityCharges: fixedCharges.electricityCharges,
        otherCharges: fixedCharges.otherCharges,
        totalAmount,
        presentDues: 0.00,
        status: 'pending',
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 15))
      };
    });

    generateBills.mutate(billsData);
  };

  const totalWaterUsage = Object.values(readings).reduce((sum, reading) => sum + reading.waterUsage, 0);
  const totalWaterCharges = Object.values(readings).reduce((sum, reading) => sum + reading.waterCharges, 0);

  if (residentsLoading || billsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const occupiedFlats = residents.filter(r => r.flatStatus === 'occupied');
  const hasExistingBills = existingBills.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Water Meter Readings</h1>
          <p className="text-gray-600">Enter monthly water meter readings and generate bills</p>
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
          
          <Button 
            onClick={handleGenerateBills}
            disabled={generateBills.isPending || Object.keys(readings).length === 0}
            className="mt-6"
          >
            <i className="fas fa-calculator mr-2"></i>
            {hasExistingBills ? 'Update Bills' : 'Generate Bills'}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">{occupiedFlats.length}</h3>
              <p className="text-sm text-gray-600">Occupied Flats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">{totalWaterUsage.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Total Water Usage (L)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600">₹{totalWaterCharges.toFixed(2)}</h3>
              <p className="text-sm text-gray-600">Total Water Charges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-orange-600">₹{waterRate.toFixed(2)}</h3>
              <p className="text-sm text-gray-600">Rate per Liter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {hasExistingBills && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-yellow-600"></i>
              <p className="text-yellow-800">
                Bills for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
                already exist. Making changes will update the existing bills.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Water Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Water Meter Readings</CardTitle>
          <CardDescription>
            Enter current meter readings for each flat. Water usage and charges will be calculated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
              <div>Flat Number</div>
              <div>Resident</div>
              <div>Previous Reading</div>
              <div>Current Reading</div>
              <div>Usage (Liters)</div>
              <div>Water Charges</div>
              <div>Status</div>
            </div>
            
            {occupiedFlats.map((resident) => {
              const reading = readings[resident.flatNumber] || {
                flatNumber: resident.flatNumber,
                residentId: resident.id,
                currentReading: 0,
                previousReading: 0,
                waterUsage: 0,
                waterCharges: 0
              };
              
              return (
                <div key={resident.flatNumber} className="grid grid-cols-7 gap-4 items-center py-2 border-b border-gray-100">
                  <div className="font-medium">{resident.flatNumber}</div>
                  <div className="text-sm text-gray-600">{resident.name}</div>
                  
                  <div>
                    <Input
                      type="number"
                      value={reading.previousReading}
                      onChange={(e) => updateReading(resident.flatNumber, 'previousReading', parseFloat(e.target.value) || 0)}
                      className="w-24"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="number"
                      value={reading.currentReading}
                      onChange={(e) => updateReading(resident.flatNumber, 'currentReading', parseFloat(e.target.value) || 0)}
                      className="w-24"
                      min="0"
                    />
                  </div>
                  
                  <div className="text-center">
                    <Badge variant={reading.waterUsage > 0 ? "default" : "secondary"}>
                      {reading.waterUsage.toLocaleString()}L
                    </Badge>
                  </div>
                  
                  <div className="text-center font-medium">
                    ₹{reading.waterCharges.toFixed(2)}
                  </div>
                  
                  <div>
                    {existingBills.find(b => b.flatNumber === resident.flatNumber) ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Existing
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            
            {occupiedFlats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-tint text-4xl mb-4"></i>
                <p>No occupied flats found. Please add residents first.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}