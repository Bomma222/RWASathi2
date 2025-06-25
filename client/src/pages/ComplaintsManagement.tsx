import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import type { Complaint, User } from '@shared/schema';

interface ComplaintUpdate {
  status: string;
  assignedTo?: string;
  internalNotes?: string;
}

export default function ComplaintsManagement() {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<ComplaintUpdate>({
    status: '',
    assignedTo: '',
    internalNotes: ''
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch complaints
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['/api/complaints'],
    queryFn: async () => {
      const response = await fetch('/api/complaints');
      if (!response.ok) throw new Error('Failed to fetch complaints');
      return response.json() as Complaint[];
    }
  });

  // Fetch residents for assignment
  const { data: residents = [] } = useQuery({
    queryKey: ['/api/residents'],
    queryFn: async () => {
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json() as User[];
    }
  });

  // Update complaint mutation
  const updateComplaint = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: ComplaintUpdate }) => {
      return apiRequest(`/api/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      closeUpdateDialog();
      toast({
        title: 'Success',
        description: 'Complaint updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update complaint',
        variant: 'destructive'
      });
    }
  });

  const closeUpdateDialog = () => {
    setIsUpdateDialogOpen(false);
    setSelectedComplaint(null);
    setUpdateForm({ status: '', assignedTo: '', internalNotes: '' });
  };

  const openUpdateDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status,
      assignedTo: complaint.assignedTo || '',
      internalNotes: complaint.internalNotes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    updateComplaint.mutate({
      id: selectedComplaint.id,
      updates: {
        ...updateForm,
        ...(updateForm.status === 'resolved' && { resolvedAt: new Date() })
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getResidentName = (flatNumber: string) => {
    const resident = residents.find(r => r.flatNumber === flatNumber);
    return resident?.name || 'Unknown';
  };

  const getStaffOptions = () => {
    return residents.filter(r => r.role === 'watchman' || r.role === 'admin');
  };

  function getTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return past.toLocaleDateString();
  }

  // Filter complaints based on status
  const filteredComplaints = complaints.filter(complaint => {
    if (statusFilter === 'all') return true;
    return complaint.status === statusFilter;
  });

  // Calculate statistics
  const totalComplaints = complaints.length;
  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Complaints Management</h1>
          <p className="text-gray-600">View and manage resident complaints and issues</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="statusFilter">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complaints</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">{totalComplaints}</h3>
              <p className="text-sm text-gray-600">Total Complaints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-600">{openComplaints}</h3>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-600">{inProgressComplaints}</h3>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">{resolvedComplaints}</h3>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-3">
                    <span>{complaint.title}</span>
                    <div className="flex space-x-2">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Flat:</span> {complaint.flatNumber}
                      </div>
                      <div>
                        <span className="font-medium">Resident:</span> {getResidentName(complaint.flatNumber)}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {complaint.category}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {getTimeAgo(complaint.createdAt)}
                      </div>
                      {complaint.assignedTo && (
                        <div>
                          <span className="font-medium">Assigned to:</span> {complaint.assignedTo}
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openUpdateDialog(complaint)}
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Update
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Description:</h4>
                  <p className="text-gray-600 text-sm">{complaint.description}</p>
                </div>
                
                {complaint.internalNotes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Internal Notes:</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{complaint.internalNotes}</p>
                  </div>
                )}
                
                {complaint.resolvedAt && (
                  <div className="text-sm text-green-600">
                    <i className="fas fa-check-circle mr-1"></i>
                    Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <i className="fas fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">
                {statusFilter === 'all' ? 'No complaints found.' : `No ${statusFilter.replace('_', ' ')} complaints found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Complaint Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
            <DialogDescription>
              Update the status and assignment for "{selectedComplaint?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={updateForm.status} 
                onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign to Staff Member</Label>
              <Select 
                value={updateForm.assignedTo} 
                onValueChange={(value) => setUpdateForm(prev => ({ ...prev, assignedTo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {getStaffOptions().map((staff) => (
                    <SelectItem key={staff.id} value={staff.name}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                value={updateForm.internalNotes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                placeholder="Add internal notes about resolution steps, site visits, etc."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeUpdateDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateComplaint.isPending}>
                Update Complaint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}