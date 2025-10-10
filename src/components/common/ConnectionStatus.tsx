import { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { useTranslation } from '../../context/TranslationContext';

export function ConnectionStatus() {
  const { isConnected } = useWebSocketContext();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  
  const connected = isConnected();

  return (
    <div className="">
      <div className="relative">
        {/* Connection Status Button */}
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`p-0.5 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${
            connected
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
          }`}
          aria-label={connected ? t('connection.connected') : t('connection.disconnected')}
        >
          {connected ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
        </button>

        {/* Animated Tooltip */}


        {/* Connection Pulse Ring (for disconnected state) */}
        {!connected && (
          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
        )}
      </div>
    </div>
  );
}