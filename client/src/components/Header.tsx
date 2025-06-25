import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { user, signOut, switchUser, currentUserIndex, demoUsers } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'resident': return '🏠';
      case 'watchman': return '👮‍♂️';
      default: return '👤';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'resident': return 'Resident';
      case 'watchman': return 'Watchman';
      default: return 'User';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">RWA Sathi</h1>
            <p className="text-xs text-gray-500">
              {getRoleIcon(user?.role)} {getRoleName(user?.role)} - {user?.flatNumber}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <LanguageToggle />
          
          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Switch User Profile"
            >
              <i className="fas fa-user-circle text-lg"></i>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Switch Profile</p>
                </div>
                
                {demoUsers.map((demoUser, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      switchUser(index);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                      currentUserIndex === index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{getRoleIcon(demoUser.role)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{demoUser.name}</div>
                      <div className="text-xs text-gray-500">{getRoleName(demoUser.role)}</div>
                    </div>
                    {currentUserIndex === index && (
                      <i className="fas fa-check text-blue-600"></i>
                    )}
                  </button>
                ))}
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Backdrop */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
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
