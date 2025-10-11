import { useState, useEffect } from 'react';
import { X, Server, Activity, Globe } from 'lucide-react';
import versionInfo from '../../version.json';
import { API_URL } from '../../lib/api/config';
import { useTranslation } from '../../context/TranslationContext';
import { ConnectionStatus } from "./ConnectionStatus";

interface BackendHealth {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export function VersionDisplay() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Show version briefly on load
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Hide after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fetchBackendHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }

      const healthData = await response.json();
      setBackendHealth(healthData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('errors.failedToLoadData')
      );
      setBackendHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setIsVisible(!isVisible);
    setShowModal(true);
    fetchBackendHealth();
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'gezond':
      case 'En bonne santé':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'gedegradeerd':
      case 'dégradé':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'ongezond':
      case 'malsain':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[9999] pointer-events-none">
        <div
          className={`flex items-center gap-2 transition-all duration-300 ease-in-out pointer-events-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2 hover:opacity-60'
            }`}
        >
          <button
            onClick={handleClick}
            className="bg-black/10 hover:bg-black/20 backdrop-blur-sm text-zinc-600 text-xs px-2 py-1 rounded-md font-mono transition-all duration-200 hover:scale-105"
            title={`Build: ${new Date(versionInfo.buildDate).toLocaleString()}`}
          >
            v{versionInfo.version}
          </button>

          <ConnectionStatus />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  {t('version.systemInformation')}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Frontend Information */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('version.frontend')}
                </h3>
                <div className="bg-zinc-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">{t('version.version')}</span>
                    <span className="font-mono">v{versionInfo.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">{t('version.buildDate')}</span>
                    <span className="font-mono text-xs">
                      {new Date(versionInfo.buildDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">{t('version.environment')}</span>
                    <span className="font-mono" >
                      {import.meta.env.PROD ? t('version.production') : t('version.development')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Backend Information */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-3 flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  {t('version.backend')}
                </h3>
                <div className="bg-zinc-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">{t('version.targetUrl')}</span>
                    <span className="font-mono text-xs break-all">{API_URL}</span>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mr-2">
                          {t('version.error')}
                        </span>
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    </div>
                  )}

                  {backendHealth && (
                    <>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-zinc-600">{t('version.status')}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(backendHealth.status)}`}>
                          {backendHealth.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">{t('version.version')}</span>
                        <span className="font-mono">v{backendHealth.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">{t('version.environment')}</span>
                        <span className="font-mono">{backendHealth.environment}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">{t('version.uptime')}</span>
                        <span className="font-mono">{formatUptime(backendHealth.uptime)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">{t('version.lastCheck')}</span>
                        <span className="font-mono text-xs">
                          {new Date(backendHealth.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-center">
                <button
                  onClick={fetchBackendHealth}
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {loading ? t('version.checking') : t('version.refreshHealthCheck')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}