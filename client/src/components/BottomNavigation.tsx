import { useLocation } from 'wouter';
import { t } from '@/lib/i18n';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: '/', icon: 'fas fa-home', label: t('home') },
    { path: '/bills', icon: 'fas fa-file-invoice', label: t('bills') },
    { path: '/complaints', icon: 'fas fa-exclamation-circle', label: t('issues') },
    { path: '/notices', icon: 'fas fa-bullhorn', label: t('notices') },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2 z-30">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center py-2 px-3 ${
              location === item.path ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
