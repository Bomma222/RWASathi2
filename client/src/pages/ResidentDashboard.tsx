import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { useLocation } from 'wouter';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ['/api/bills', { flatNumber: user?.flatNumber }],
  });

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['/api/notices'],
  });

  const { data: myComplaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['/api/complaints', { residentId: user?.id }],
  });

  if (billsLoading || noticesLoading || complaintsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentBill = bills?.find((bill: any) => bill.status === 'unpaid');
  const openComplaints = myComplaints?.filter((complaint: any) => complaint.status !== 'resolved') || [];

  return (
    <div className="space-y-6">
      {/* Resident Welcome */}
      <div className="bg-gradient-to-r from-accent to-blue-600 rounded-lg p-4 text-white">
        <h2 className="text-lg font-semibold mb-1">{t('welcomeBack')}</h2>
        <p className="text-sm opacity-90">{user?.name}</p>
        <p className="text-xs opacity-80">{user?.flatNumber}, Tower {user?.tower}</p>
        <div className="mt-3 bg-white/20 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">{t('currentBillStatus')}</span>
            <span className="text-lg font-bold">
              {currentBill ? `₹${currentBill.amount} ${t('due')}` : 'No pending bills'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions for Residents */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setLocation('/bills')}
          className="bg-white p-4 rounded-lg shadow-card border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <i className="fas fa-file-invoice text-2xl text-accent mb-2"></i>
          <div className="text-sm font-medium text-gray-800">{t('viewBills')}</div>
          <div className="text-xs text-gray-600">
            {currentBill ? `${t('due')}: ₹${currentBill.amount}` : 'All paid'}
          </div>
        </button>
        <button 
          onClick={() => setLocation('/complaints/submit')}
          className="bg-white p-4 rounded-lg shadow-card border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <i className="fas fa-exclamation-triangle text-2xl text-warning mb-2"></i>
          <div className="text-sm font-medium text-gray-800">{t('reportIssue')}</div>
          <div className="text-xs text-gray-600">Quick support</div>
        </button>
      </div>

      {/* Latest Notices */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <i className="fas fa-bullhorn text-gray-600 mr-2"></i>
          {t('latestNotices')}
        </h3>
        <div className="space-y-3">
          {notices?.slice(0, 3).map((notice: any) => (
            <div key={notice.id} className="border-l-4 border-secondary pl-3 py-2">
              <h4 className="text-sm font-medium text-gray-800">{notice.title}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {notice.description.length > 80 
                  ? `${notice.description.substring(0, 80)}...` 
                  : notice.description
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('posted')} {getTimeAgo(notice.createdAt)}
              </p>
            </div>
          ))}
          {(!notices || notices.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No notices available</p>
          )}
        </div>
      </div>

      {/* My Complaints */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <i className="fas fa-headset text-gray-600 mr-2"></i>
          {t('myComplaints')}
          {openComplaints.length > 0 && (
            <span className="ml-auto bg-warning text-white text-xs px-2 py-1 rounded-full">
              {openComplaints.length}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {myComplaints?.slice(0, 3).map((complaint: any) => (
            <div key={complaint.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${getComplaintBgColor(complaint.status)}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getComplaintIconBg(complaint.status)}`}>
                <i className={`fas fa-wrench text-xs ${getComplaintIconColor(complaint.status)}`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{complaint.subject}</p>
                <p className="text-xs text-gray-600">{t('status')}: {getStatusText(complaint.status)}</p>
                <p className="text-xs text-gray-500">{t('submitted')} {getTimeAgo(complaint.createdAt)}</p>
              </div>
            </div>
          ))}
          {(!myComplaints || myComplaints.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No complaints submitted</p>
          )}
        </div>
      </div>
    </div>
  );
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

function getStatusText(status: string): string {
  switch (status) {
    case 'open': return t('open');
    case 'in_progress': return t('inProgress');
    case 'resolved': return t('resolved');
    default: return status;
  }
}

function getComplaintBgColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-red-50 border-red-200';
    case 'in_progress': return 'bg-yellow-50 border-yellow-200';
    case 'resolved': return 'bg-green-50 border-green-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

function getComplaintIconBg(status: string): string {
  switch (status) {
    case 'open': return 'bg-red-100';
    case 'in_progress': return 'bg-yellow-100';
    case 'resolved': return 'bg-green-100';
    default: return 'bg-gray-100';
  }
}

function getComplaintIconColor(status: string): string {
  switch (status) {
    case 'open': return 'text-red-600';
    case 'in_progress': return 'text-yellow-600';
    case 'resolved': return 'text-green-600';
    default: return 'text-gray-600';
  }
}
