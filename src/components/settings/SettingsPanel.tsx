import { useState } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';

interface SettingsPanelProps {
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${className} settings-panel`}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        aria-label="Open Settings"
      >
        <SettingsIcon className="w-4 h-4 mr-2" />
        Settings
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            {/* Placeholder settings sections */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Display</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Show weekends</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Week starts on Monday</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Push notifications</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Theme</h3>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};