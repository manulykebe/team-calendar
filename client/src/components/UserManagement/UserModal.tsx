import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UserFormData {
  id?: string;
  login: string;
  email: string;
  password?: string;
  sites: string[];
  roles: string[];
  isDeleted?: boolean;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  user?: UserFormData;
  mode: 'create' | 'update';
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    login: '',
    email: '',
    password: '',
    sites: ['main'],
    roles: ['team-member']
  });

  useEffect(() => {
    if (user && mode === 'update') {
      setFormData({
        ...user,
        password: '' // Don't show existing password
      });
    }
  }, [user, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const availableRoles = ['admin', 'team-admin', 'team-super-user', 'team-member'];
  const availableSites = ['main', 'secondary', 'remote'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create New User' : 'Update User'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password {mode === 'update' && '(leave empty to keep current)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              required={mode === 'create'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Roles
            </label>
            <div className="space-y-2">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => {
                      const newRoles = e.target.checked
                        ? [...formData.roles, role]
                        : formData.roles.filter(r => r !== role);
                      setFormData({ ...formData, roles: newRoles });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sites
            </label>
            <div className="space-y-2">
              {availableSites.map(site => (
                <label key={site} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.sites.includes(site)}
                    onChange={(e) => {
                      const newSites = e.target.checked
                        ? [...formData.sites, site]
                        : formData.sites.filter(s => s !== site);
                      setFormData({ ...formData, sites: newSites });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{site}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </button>
        </form>
      </div>
    </div>
  );
};