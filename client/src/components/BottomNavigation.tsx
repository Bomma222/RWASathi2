import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Role-based navigation
  const getNavigationForRole = (role: string) => {
    const baseNavigation = [
      { name: t('home'), href: '/', icon: 'fas fa-home' },
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseNavigation,
          { name: t('billing'), href: '/billing', icon: 'fas fa-file-invoice-dollar' },
          { name: t('complaints'), href: '/complaints', icon: 'fas fa-exclamation-triangle' },
          { name: t('notices'), href: '/notices', icon: 'fas fa-bullhorn' },
          { name: t('residents'), href: '/flats', icon: 'fas fa-users' },
        ];
      
      case 'resident':
        return [
          ...baseNavigation,
          { name: t('billing'), href: '/billing', icon: 'fas fa-file-invoice-dollar' },
          { name: t('complaints'), href: '/complaints', icon: 'fas fa-exclamation-triangle' },
          { name: t('notices'), href: '/notices', icon: 'fas fa-bullhorn' },
        ];
      
      case 'watchman':
        return [
          ...baseNavigation,
          { name: 'Tasks', href: '/complaints', icon: 'fas fa-tasks' },
          { name: t('notices'), href: '/notices', icon: 'fas fa-bullhorn' },
        ];
      
      default:
        return baseNavigation;
    }
  };

  const navigation = getNavigationForRole(user?.role || 'resident');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.name}
                onClick={() => setLocation(item.href)}
                className={`flex-1 px-3 py-3 text-center ${
                  isActive
                    ? 'text-primary border-t-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`${item.icon} text-lg block mb-1`}></i>
                <span className="text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
