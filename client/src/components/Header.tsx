import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const closeProfileMenu = () => {
    setShowProfileMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    closeProfileMenu();
  };

  return (
    <>
      <header className="bg-primary text-white px-4 py-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-building text-xl"></i>
            <div>
              <h1 className="text-lg font-semibold">{t('appTitle')}</h1>
              <p className="text-xs opacity-90">Green Valley Apartments</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <button onClick={toggleProfileMenu} className="p-2">
              <i className="fas fa-user-circle text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Menu Overlay */}
      {showProfileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={closeProfileMenu}>
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-elevated p-2 min-w-48" onClick={e => e.stopPropagation()}>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded">
              <i className="fas fa-user mr-3 text-gray-600"></i>
              {t('viewProfile')}
            </button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded">
              <i className="fas fa-language mr-3 text-gray-600"></i>
              {t('language')}: {t('language')}
            </button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded">
              <i className="fas fa-cog mr-3 text-gray-600"></i>
              {t('settings')}
            </button>
            <hr className="my-2" />
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded text-red-600"
            >
              <i className="fas fa-sign-out-alt mr-3"></i>
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
