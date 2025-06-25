import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { setLanguage, getLanguage, type Language } from '@/lib/i18n';

interface SystemSettings {
  waterRatePerLiter: number;
  defaultMaintenanceAmount: number;
  defaultElectricityCharges: number;
  defaultOtherCharges: number;
  dueDateDays: number;
  currency: string;
  language: Language;
  notificationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    systemAlerts: boolean;
  };
}

export default function SystemConfiguration() {
  const [settings, setSettings] = useState<SystemSettings>({
    waterRatePerLiter: 0.05,
    defaultMaintenanceAmount: 2500,
    defaultElectricityCharges: 800,
    defaultOtherCharges: 300,
    dueDateDays: 15,
    currency: 'INR',
    language: getLanguage(),
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      systemAlerts: true
    }
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch current system settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/system/settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/system/settings');
        if (!response.ok) return settings; // Return defaults if no settings found
        return response.json() as SystemSettings;
      } catch {
        return settings; // Return defaults on error
      }
    },
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
      }
    }
  });

  // Update system settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      return apiRequest('/api/system/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/settings'] });
      toast({
        title: 'Success',
        description: 'System settings updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update system settings',
        variant: 'destructive'
      });
    }
  });

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setSettings(prev => ({ ...prev, language: newLanguage }));
    // Reload the page to apply language changes
    window.location.reload();
  };

  const handleSaveSettings = () => {
    updateSettings.mutate(settings);
  };

  const resetToDefaults = () => {
    const defaultSettings: SystemSettings = {
      waterRatePerLiter: 0.05,
      defaultMaintenanceAmount: 2500,
      defaultElectricityCharges: 800,
      defaultOtherCharges: 300,
      dueDateDays: 15,
      currency: 'INR',
      language: 'en',
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        systemAlerts: true
      }
    };
    setSettings(defaultSettings);
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
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-gray-600">Configure global settings and billing defaults</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
            <i className="fas fa-save mr-2"></i>
            Save Settings
          </Button>
        </div>
      </div>

      {/* Billing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Configuration</CardTitle>
          <CardDescription>Set default amounts and rates for billing calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waterRate">Water Rate per Liter (₹)</Label>
              <Input
                id="waterRate"
                type="number"
                step="0.01"
                value={settings.waterRatePerLiter}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  waterRatePerLiter: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">Rate charged per liter of water consumption</p>
            </div>
            
            <div>
              <Label htmlFor="maintenanceAmount">Default Maintenance Amount (₹)</Label>
              <Input
                id="maintenanceAmount"
                type="number"
                value={settings.defaultMaintenanceAmount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultMaintenanceAmount: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">Default monthly maintenance charge per flat</p>
            </div>
            
            <div>
              <Label htmlFor="electricityCharges">Default Electricity Charges (₹)</Label>
              <Input
                id="electricityCharges"
                type="number"
                value={settings.defaultElectricityCharges}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultElectricityCharges: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">Default electricity charges per flat</p>
            </div>
            
            <div>
              <Label htmlFor="otherCharges">Default Other Charges (₹)</Label>
              <Input
                id="otherCharges"
                type="number"
                value={settings.defaultOtherCharges}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultOtherCharges: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">Default other charges (cleaning, security, etc.)</p>
            </div>
            
            <div>
              <Label htmlFor="dueDateDays">Due Date (Days from bill generation)</Label>
              <Input
                id="dueDateDays"
                type="number"
                value={settings.dueDateDays}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  dueDateDays: parseInt(e.target.value) || 15 
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">Number of days from bill generation to due date</p>
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Configure language and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">System Language</Label>
              <Select 
                value={settings.language} 
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Change the system interface language</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-xs text-gray-500">Send email alerts for important events</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.notificationPreferences.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    emailNotifications: checked
                  }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-xs text-gray-500">Send SMS alerts for critical events</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.notificationPreferences.smsNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    smsNotifications: checked
                  }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts">System Alerts</Label>
                <p className="text-xs text-gray-500">Show in-app notifications and alerts</p>
              </div>
              <Switch
                id="systemAlerts"
                checked={settings.notificationPreferences.systemAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notificationPreferences: {
                    ...prev.notificationPreferences,
                    systemAlerts: checked
                  }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Templates</CardTitle>
          <CardDescription>Manage billing templates and quick actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <i className="fas fa-copy text-lg mb-2"></i>
              <span>Duplicate Last Month's Bills</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <i className="fas fa-file-template text-lg mb-2"></i>
              <span>Create New Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Settings Preview</CardTitle>
          <CardDescription>Preview how these settings will be applied</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Billing Defaults</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Water Rate:</span>
                  <span>₹{settings.waterRatePerLiter}/L</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span>₹{settings.defaultMaintenanceAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Electricity:</span>
                  <span>₹{settings.defaultElectricityCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Charges:</span>
                  <span>₹{settings.defaultOtherCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span>{settings.dueDateDays} days</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">System Settings</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span>{settings.language === 'en' ? 'English' : 'Telugu'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{settings.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email Alerts:</span>
                  <span>{settings.notificationPreferences.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span>SMS Alerts:</span>
                  <span>{settings.notificationPreferences.smsNotifications ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}