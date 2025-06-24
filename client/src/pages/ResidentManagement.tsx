import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ResidentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    flatNumber: '',
    tower: 'A',
    role: 'resident',
  });

  const { data: residents, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Resident updated successfully",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update resident",
        variant: "destructive",
      });
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
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

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      flatNumber: '',
      tower: 'A',
      role: 'resident',
    });
    setEditingResident(null);
    setShowForm(false);
  };

  const handleEdit = (resident: any) => {
    setFormData({
      name: resident.name,
      phoneNumber: resident.phoneNumber,
      flatNumber: resident.flatNumber,
      tower: resident.tower || 'A',
      role: resident.role,
    });
    setEditingResident(resident);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phoneNumber || !formData.flatNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingResident) {
      updateUserMutation.mutate({
        id: editingResident.id,
        data: formData,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('manageResidents')}</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus mr-2"></i>
          Add Resident
        </Button>
      </div>

      {/* Resident Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flatNumber">Flat Number *</Label>
                  <Input
                    id="flatNumber"
                    type="text"
                    placeholder="e.g., 301"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, flatNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tower">Tower</Label>
                  <select
                    id="tower"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.tower}
                    onChange={(e) => setFormData(prev => ({ ...prev, tower: e.target.value }))}
                  >
                    <option value="A">Tower A</option>
                    <option value="B">Tower B</option>
                    <option value="C">Tower C</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="resident">Resident</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? t('loading') : (editingResident ? 'Update' : 'Add') + ' Resident'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Residents List */}
      <div className="grid gap-4">
        {residents?.map((resident: any) => (
          <Card key={resident.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{resident.name}</h3>
                  <p className="text-sm text-gray-600">
                    {resident.flatNumber}, Tower {resident.tower} • {resident.phoneNumber}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resident.role === 'admin' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {resident.role === 'admin' ? 'Admin' : 'Resident'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resident.isActive 
                        ? 'bg-green-200 text-green-700' 
                        : 'bg-red-200 text-red-700'
                    }`}>
                      {resident.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(resident)}
                >
                  <i className="fas fa-edit mr-1"></i>
                  {t('edit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!residents || residents.length === 0) && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No residents found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
