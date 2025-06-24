import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { useLocation } from 'wouter';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities'],
  });

  if (statsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const quickActions = [
    { 
      icon: 'fas fa-file-invoice-dollar',
      label: t('generateBills'),
      color: 'text-accent',
      action: () => setLocation('/bills')
    },
    { 
      icon: 'fas fa-bullhorn',
      label: t('postNotice'),
      color: 'text-secondary',
      action: () => setLocation('/notices')
    },
    { 
      icon: 'fas fa-users',
      label: t('manageResidents'),
      color: 'text-primary',
      action: () => setLocation('/residents')
    },
    { 
      icon: 'fas fa-chart-line',
      label: t('viewReports'),
      color: 'text-success',
      action: () => setLocation('/reports')
    },
  ];

  const pendingActions = [
    {
      title: `Review ${stats?.openComplaints || 0} pending complaints`,
      urgency: t('highPriority'),
      buttonText: t('review'),
      buttonColor: 'bg-secondary',
      bgColor: 'bg-orange-50 border-orange-200',
      action: () => setLocation('/complaints')
    },
    {
      title: 'Generate March bills',
      urgency: t('dueTomorrow'),
      buttonText: t('generate'),
      buttonColor: 'bg-accent',
      bgColor: 'bg-blue-50 border-blue-200',
      action: () => setLocation('/bills')
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-4 text-white">
        <h2 className="text-lg font-semibold mb-1">{t('welcomeAdmin')}</h2>
        <p className="text-sm opacity-90">{user?.name}</p>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{stats?.totalFlats || 0}</div>
            <div className="text-xs opacity-80">{t('totalFlats')}</div>
          </div>
          <div>
            <div className="text-xl font-bold">₹{stats?.pendingDues?.toLocaleString() || 0}</div>
            <div className="text-xs opacity-80">{t('pendingDues')}</div>
          </div>
          <div>
            <div className="text-xl font-bold">{stats?.openComplaints || 0}</div>
            <div className="text-xs opacity-80">{t('openIssues')}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="bg-white p-4 rounded-lg shadow-card border border-gray-100 text-center hover:shadow-md transition-shadow"
          >
            <i className={`${action.icon} text-2xl ${action.color} mb-2`}></i>
            <div className="text-sm font-medium text-gray-800">{action.label}</div>
          </button>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <i className="fas fa-clock text-gray-600 mr-2"></i>
          {t('recentActivities')}
        </h3>
        <div className="space-y-3">
          {activities?.slice(0, 3).map((activity: any, index: number) => (
            <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className={`fas ${getActivityIcon(activity.type)} text-xs text-blue-600`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                <p className="text-xs text-gray-600">{getTimeAgo(activity.createdAt)}</p>
              </div>
            </div>
          ))}
          {(!activities || activities.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>

      {/* Pending Actions */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <i className="fas fa-tasks text-gray-600 mr-2"></i>
          {t('pendingActions')}
          <span className="ml-auto bg-error text-white text-xs px-2 py-1 rounded-full">
            {pendingActions.length}
          </span>
        </h3>
        <div className="space-y-3">
          {pendingActions.map((action, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${action.bgColor}`}>
              <div>
                <p className="text-sm font-medium text-gray-800">{action.title}</p>
                <p className="text-xs text-gray-600">{action.urgency}</p>
              </div>
              <button 
                onClick={action.action}
                className={`${action.buttonColor} text-white px-3 py-1 rounded text-xs font-medium`}
              >
                {action.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'payment_received':
      return 'fa-rupee-sign';
    case 'complaint_submitted':
      return 'fa-exclamation';
    case 'notice_posted':
      return 'fa-bullhorn';
    case 'bill_generated':
      return 'fa-file-invoice';
    default:
      return 'fa-info';
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
