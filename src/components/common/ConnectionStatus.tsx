import { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { useTranslation } from '../../context/TranslationContext';
import { Tooltip } from './Tooltip';

export function ConnectionStatus() {
  const { isConnected } = useWebSocketContext();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  
  const connected = isConnected();

  return (
    <div className="fixed bottom-8 left-8 z-10">
      <div className="relative">
        {/* Connection Status Button */}
        <Tooltip content={connected ? t('connection.connected') : t('connection.disconnected')}>
          <button
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${
              connected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            }`}
          >
            {connected ? (
              <Wifi className="w-6 h-6" />
            ) : (
              <WifiOff className="w-6 h-6" />
            )}
          </button>
        </Tooltip>

        {/* Connection Pulse Ring (for disconnected state) */}
        {!connected && (
          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
        )}
      </div>
    </div>
  );
}