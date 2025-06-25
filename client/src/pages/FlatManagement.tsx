import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { User } from '@shared/schema';

interface ResidentForm {
  name: string;
  phoneNumber: string;
  flatNumber: string;
  residentType: 'owner' | 'tenant';
  flatStatus: 'occupied' | 'vacant';
  email?: string;
  emergencyContact?: string;
  moveInDate?: string;
  role: 'resident' | 'admin';
}

export default function FlatManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<User | null>(null);
  const [formData, setFormData] = useState<ResidentForm>({
    name: '',
    phoneNumber: '',
    flatNumber: '',
    residentType: 'owner',
    flatStatus: 'occupied',
    email: '',
    emergencyContact: '',
    moveInDate: '',
    role: 'resident'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all residents
  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['/api/residents'],
    queryFn: async () => {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json() as User[];
    }
  });

  // Create resident mutation
  const createResident = useMutation({
    mutationFn: async (data: ResidentForm) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Resident added successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add resident',
        variant: 'destructive'
      });
    }
  });

  // Update resident mutation
  const updateResident = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ResidentForm> }) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents'] });
      setEditingResident(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Resident updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update resident',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      flatNumber: '',
      residentType: 'owner',
      flatStatus: 'occupied',
      email: '',
      emergencyContact: '',
      moveInDate: '',
      role: 'resident'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingResident) {
      updateResident.mutate({ id: editingResident.id, data: formData });
    } else {
      createResident.mutate(formData);
    }
  };

  const handleEdit = (resident: User) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      phoneNumber: resident.phoneNumber,
      flatNumber: resident.flatNumber,
      residentType: (resident.residentType as 'owner' | 'tenant') || 'owner',
      flatStatus: (resident.flatStatus as 'occupied' | 'vacant') || 'occupied',
      email: resident.email || '',
      emergencyContact: resident.emergencyContact || '',
      moveInDate: resident.moveInDate ? new Date(resident.moveInDate).toISOString().split('T')[0] : '',
      role: resident.role as 'resident' | 'admin'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge variant="default" className="bg-green-100 text-green-800">Occupied</Badge>;
      case 'vacant':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Vacant</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'owner':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Owner</Badge>;
      case 'tenant':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Tenant</Badge>;
      default:
        return <Badge variant="outline">Resident</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'resident':
        return <Badge variant="secondary">Resident</Badge>;
      case 'watchman':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Watchman</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

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
          <h1 className="text-2xl font-bold">{t('residentManagement')}</h1>
          <p className="text-gray-600">Manage residents and flat information</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingResident(null); }}>
              <i className="fas fa-plus mr-2"></i>
              Add Resident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingResident ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
              <DialogDescription>
                {editingResident ? 'Update resident information' : 'Enter details for the new resident'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="flatNumber">Flat Number *</Label>
                  <Input
                    id="flatNumber"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, flatNumber: e.target.value }))}
                    placeholder="A-101"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+91XXXXXXXXXX"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="residentType">Resident Type</Label>
                  <Select value={formData.residentType} onValueChange={(value: 'owner' | 'tenant') => setFormData(prev => ({ ...prev, residentType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="flatStatus">Flat Status</Label>
                  <Select value={formData.flatStatus} onValueChange={(value: 'occupied' | 'vacant') => setFormData(prev => ({ ...prev, flatStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="role">User Role</Label>
                <Select value={formData.role} onValueChange={(value: 'resident' | 'admin') => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="moveInDate">Move-in Date</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createResident.isPending || updateResident.isPending}>
                  {editingResident ? 'Update' : 'Add'} Resident
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">{residents.length}</h3>
              <p className="text-sm text-gray-600">Total Residents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">
                {residents.filter(r => r.flatStatus === 'occupied').length}
              </h3>
              <p className="text-sm text-gray-600">Occupied Flats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-600">
                {residents.filter(r => r.flatStatus === 'vacant').length}
              </h3>
              <p className="text-sm text-gray-600">Vacant Flats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600">
                {residents.filter(r => r.role === 'admin').length}
              </h3>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Residents List */}
      <Card>
        <CardHeader>
          <CardTitle>Residents Directory</CardTitle>
          <CardDescription>Complete list of all residents and their flat information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {residents.map((resident) => (
              <div key={resident.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{resident.name}</h3>
                      <span className="text-gray-500">({resident.flatNumber})</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(resident.flatStatus || 'occupied')}
                      {getTypeBadge(resident.residentType || 'owner')}
                      {getRoleBadge(resident.role)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><i className="fas fa-phone mr-2"></i>{resident.phoneNumber}</p>
                      {resident.email && <p><i className="fas fa-envelope mr-2"></i>{resident.email}</p>}
                      {resident.emergencyContact && <p><i className="fas fa-phone-alt mr-2"></i>{resident.emergencyContact}</p>}
                      {resident.moveInDate && (
                        <p><i className="fas fa-calendar mr-2"></i>
                          Moved in: {new Date(resident.moveInDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        handleEdit(resident);
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {residents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-users text-4xl mb-4"></i>
                <p>No residents found. Add the first resident to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}