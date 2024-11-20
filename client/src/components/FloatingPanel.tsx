import React, { useState } from 'react';
import { User, Settings, X, Key, Globe, Mail, Building, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserManagement } from './UserManagement';
import Cookies from 'js-cookie';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Panel: React.FC<PanelProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed left-16 top-0 h-screen w-80 bg-white dark:bg-gray-800 shadow-lg p-4 z-40 transition-transform overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  );
};

const UserSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [encryptKey, setEncryptKey] = useState(Cookies.get('encryptKey') || '');

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleEncryptKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setEncryptKey(newKey);
    Cookies.set('encryptKey', newKey, { expires: 365 });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span>{user?.login}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <Building className="w-4 h-4" />
            <span>{user?.sites.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center space-x-2 mb-1">
            <Globe className="w-4 h-4" />
            <span>Language</span>
          </div>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="nl">Nederlands</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center space-x-2 mb-1">
            <Key className="w-4 h-4" />
            <span>Encryption Key</span>
          </div>
          <input
            type="password"
            value={encryptKey}
            onChange={handleEncryptKeyChange}
            placeholder="Enter encryption key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This key will be used to encrypt private event descriptions
        </p>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export const FloatingPanel: React.FC = () => {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');

  return (
    <>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2 z-50">
        <button
          onClick={() => {
            setIsUserPanelOpen(true);
            setIsAdminPanelOpen(false);
          }}
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="User Settings"
        >
          <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        {isAdmin && (
          <button
            onClick={() => {
              setIsAdminPanelOpen(true);
              setIsUserPanelOpen(false);
            }}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Admin Panel"
          >
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>

      <Panel
        isOpen={isUserPanelOpen}
        onClose={() => setIsUserPanelOpen(false)}
        title="User Settings"
      >
        <UserSettings />
      </Panel>

      <Panel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        title="Admin Panel"
      >
        <UserManagement />
      </Panel>
    </>
  );
};