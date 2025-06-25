import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function WatchmanDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['/api/complaints'],
  });

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/complaints/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
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

  // Filter complaints relevant to facility management
  const facilityComplaints = complaints?.filter((complaint: any) => 
    ['plumbing', 'electrical', 'cleaning', 'maintenance', 'security'].includes(complaint.type)
  ) || [];

  const openComplaints = facilityComplaints.filter((c: any) => c.status === 'open');
  const inProgressComplaints = facilityComplaints.filter((c: any) => c.status === 'in_progress');
  const resolvedToday = facilityComplaints.filter((c: any) => 
    c.status === 'resolved' && 
    new Date(c.resolvedAt).toDateString() === new Date().toDateString()
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplaintIcon = (type: string) => {
    switch (type) {
      case 'plumbing': return '🔧';
      case 'electrical': return '⚡';
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔨';
      case 'security': return '🛡️';
      default: return '📋';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const complaintDate = new Date(date);
    const diffHours = Math.floor((now.getTime() - complaintDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800">Facility Management</h2>
        <p className="text-sm text-gray-600">Complaint tracking and resolution</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{openComplaints.length}</div>
            <div className="text-xs text-gray-600">Open Issues</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{inProgressComplaints.length}</div>
            <div className="text-xs text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{resolvedToday.length}</div>
            <div className="text-xs text-gray-600">Resolved Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Complaints */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Active Complaints</h3>
        
        {[...openComplaints, ...inProgressComplaints].map((complaint: any) => (
          <Card key={complaint.id} className="border-l-4 border-l-orange-400">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getComplaintIcon(complaint.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800">{complaint.subject}</h4>
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Flat {complaint.flatNumber}</span>
                      <span>{complaint.type}</span>
                      <span>{getTimeAgo(complaint.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {complaint.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateComplaintMutation.mutate({ id: complaint.id, status: 'in_progress' })}
                      disabled={updateComplaintMutation.isPending}
                      className="text-xs"
                    >
                      Start Work
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => updateComplaintMutation.mutate({ id: complaint.id, status: 'resolved' })}
                    disabled={updateComplaintMutation.isPending}
                    className="text-xs bg-green-600 hover:bg-green-700"
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {[...openComplaints, ...inProgressComplaints].length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold text-gray-800 mb-2">All Caught Up!</h3>
              <p className="text-sm text-gray-600">No active complaints at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Resolutions */}
      {resolvedToday.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Resolved Today</h3>
          
          {resolvedToday.slice(0, 3).map((complaint: any) => (
            <Card key={complaint.id} className="border-l-4 border-l-green-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getComplaintIcon(complaint.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{complaint.subject}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Flat {complaint.flatNumber}</span>
                      <span>Resolved at {new Date(complaint.resolvedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="text-green-600">
                    <i className="fas fa-check-circle"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg mb-1">💧</div>
              <div className="text-xs text-gray-600">Water Issues</div>
              <div className="text-sm font-semibold">
                {facilityComplaints.filter((c: any) => c.type === 'plumbing' && c.status !== 'resolved').length}
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg mb-1">⚡</div>
              <div className="text-xs text-gray-600">Electrical</div>
              <div className="text-sm font-semibold">
                {facilityComplaints.filter((c: any) => c.type === 'electrical' && c.status !== 'resolved').length}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg mb-1">🧹</div>
              <div className="text-xs text-gray-600">Cleaning</div>
              <div className="text-sm font-semibold">
                {facilityComplaints.filter((c: any) => c.type === 'cleaning' && c.status !== 'resolved').length}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg mb-1">🛡️</div>
              <div className="text-xs text-gray-600">Security</div>
              <div className="text-sm font-semibold">
                {facilityComplaints.filter((c: any) => c.type === 'security' && c.status !== 'resolved').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}