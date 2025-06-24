import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function ComplaintsModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['/api/complaints'],
  });

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/complaints/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredComplaints = complaints?.filter((complaint: any) => {
    if (filterStatus === 'all') return true;
    return complaint.status === filterStatus;
  }) || [];

  const openCount = complaints?.filter((c: any) => c.status === 'open').length || 0;
  const inProgressCount = complaints?.filter((c: any) => c.status === 'in_progress').length || 0;
  const resolvedCount = complaints?.filter((c: any) => c.status === 'resolved').length || 0;

  const handleUpdateStatus = (complaintId: number, status: string) => {
    updateComplaintMutation.mutate({ id: complaintId, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('complaintsManagement')}</h2>
        <div className="flex space-x-2">
          {user?.role === 'resident' && (
            <Button onClick={() => setLocation('/complaints/submit')}>
              <i className="fas fa-plus mr-2"></i>
              {t('submitComplaint')}
            </Button>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">{t('open')}</SelectItem>
              <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
              <SelectItem value="resolved">{t('resolved')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Complaints Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-card text-center">
          <div className="text-lg font-bold text-error">{openCount}</div>
          <div className="text-xs text-gray-600">{t('open')}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-card text-center">
          <div className="text-lg font-bold text-warning">{inProgressCount}</div>
          <div className="text-xs text-gray-600">{t('inProgress')}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-card text-center">
          <div className="text-lg font-bold text-success">{resolvedCount}</div>
          <div className="text-xs text-gray-600">{t('resolved')}</div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint: any) => (
          <div key={complaint.id} className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{complaint.subject}</h4>
                <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                {complaint.photoUrl && (
                  <div className="mt-2">
                    <img 
                      src={complaint.photoUrl} 
                      alt="Complaint" 
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                {getStatusText(complaint.status)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>{complaint.flatNumber} - Resident #{complaint.residentId}</span>
                <span>{getTimeAgo(complaint.createdAt)}</span>
                <span className="capitalize">{complaint.type.replace('_', ' ')}</span>
              </div>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  {complaint.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(complaint.id, 'in_progress')}
                      disabled={updateComplaintMutation.isPending}
                    >
                      {t('markInProgress')}
                    </Button>
                  )}
                  {complaint.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                      disabled={updateComplaintMutation.isPending}
                    >
                      {t('markResolved')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredComplaints.length === 0 && (
          <div className="bg-white rounded-lg shadow-card p-8 text-center text-gray-500">
            No complaints found for the selected filter
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-error text-white';
    case 'in_progress': return 'bg-warning text-white';
    case 'resolved': return 'bg-success text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'open': return t('open');
    case 'in_progress': return t('inProgress');
    case 'resolved': return t('resolved');
    default: return status;
  }
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;
  if (diffDays < 7) return `${diffDays} ${t('daysAgo')}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${t('weekAgo')}`;
  return `${Math.floor(diffDays / 30)} ${t('monthAgo')}`;
}
