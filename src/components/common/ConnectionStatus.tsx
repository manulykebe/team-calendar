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
    <div className="fixed bottom-16 left-4 z-10">
      <div className="relative">
        {/* Connection Status Button */}
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${
            connected
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
          }`}
          aria-label={connected ? t('connection.connected') : t('connection.disconnected')}
        >
          {connected ? (
            <Wifi className="w-6 h-6" />
          ) : (
            <WifiOff className="w-6 h-6" />
          )}
        </button>

        {/* Animated Tooltip */}
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm font-medium text-white rounded-lg whitespace-nowrap transition-all duration-300 ease-in-out ${
            connected ? 'bg-green-800' : 'bg-red-800'
          } ${
            isHovered 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {connected ? t('connection.connected') : t('connection.disconnected')}
          
          {/* Tooltip Arrow */}
          <div 
            className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent ${
              connected ? 'border-t-green-800' : 'border-t-red-800'
            }`}
          />
        </div>

        {/* Connection Pulse Ring (for disconnected state) */}
        {!connected && (
          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
        )}
      </div>
    </div>
  );
}