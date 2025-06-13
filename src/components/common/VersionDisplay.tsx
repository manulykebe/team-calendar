import { useState, useEffect } from 'react';
import versionInfo from '../../version.json';

export function VersionDisplay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show version briefly on load
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Hide after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <div
        className={`transition-all duration-300 ease-in-out pointer-events-auto ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2 hover:opacity-60'
        }`}
      >
        <button
          onClick={handleClick}
          className="bg-black/10 hover:bg-black/20 backdrop-blur-sm text-zinc-600 text-xs px-2 py-1 rounded-md font-mono transition-all duration-200 hover:scale-105"
          title={`Build: ${new Date(versionInfo.buildDate).toLocaleString()}`}
        >
          v{versionInfo.version}
        </button>
      </div>
    </div>
  );
}