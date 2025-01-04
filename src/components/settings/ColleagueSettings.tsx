import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, updateUser } from '../../lib/api';
import { User } from '../../types/user';
import { X } from 'lucide-react';

const DEFAULT_COLORS = [
  '#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090',
  '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'
];

interface ColleagueSettingsProps {
  onClose: () => void;
}

export function ColleagueSettings({ onClose }: ColleagueSettingsProps) {
  const { token } = useAuth();
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const users = await getUsers(token);
        setColleagues(users.filter((u: User) => u.id !== currentUser?.id));
        setCurrentUser(users.find((u: User) => u.email === localStorage.getItem('userEmail')));
      } catch (err) {
        setError('Failed to load colleagues');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleColorChange = async (colleagueId: string, color: string) => {
    if (!currentUser || !token) return;

    const settings = {
      ...currentUser.settings,
      colleagues: {
        ...currentUser.settings?.colleagues,
        [colleagueId]: {
          ...currentUser.settings?.colleagues?.[colleagueId],
          color
        }
      }
    };

    try {
      await updateUser(token, currentUser.id, {
        ...currentUser,
        settings
      });
      setCurrentUser({ ...currentUser, settings });
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const handleAbbrevChange = async (colleagueId: string, abbrev: string) => {
    if (!currentUser || !token) return;

    const settings = {
      ...currentUser.settings,
      colleagues: {
        ...currentUser.settings?.colleagues,
        [colleagueId]: {
          ...currentUser.settings?.colleagues?.[colleagueId],
          abbrev: abbrev.slice(0, 3)
        }
      }
    };

    try {
      await updateUser(token, currentUser.id, {
        ...currentUser,
        settings
      });
      setCurrentUser({ ...currentUser, settings });
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const getColleagueSettings = (colleagueId: string) => {
    return currentUser?.settings?.colleagues?.[colleagueId] || {
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      abbrev: ''
    };
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Colleague Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-4 text-red-600 bg-red-50">
            {error}
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {colleagues.map((colleague) => {
              const settings = getColleagueSettings(colleague.id);
              return (
                <div key={colleague.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: settings.color }}
                    >
                      {settings.abbrev || colleague.firstName[0] + colleague.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {colleague.firstName} {colleague.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{colleague.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Abbreviation
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={settings.abbrev || ''}
                        onChange={(e) => handleAbbrevChange(colleague.id, e.target.value)}
                        className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="ABC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(colleague.id, color)}
                            className={`w-6 h-6 rounded-full ${
                              settings.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}