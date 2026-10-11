import React, { useState, useEffect } from 'react';

const PwaFeatures = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    // Listen for offline/online events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for beforeinstallprompt for PWA installation
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 px-4 shadow-md text-sm">
          <strong>You are currently offline.</strong> Some features and live data may not be available until you reconnect.
        </div>
      )}
      
      {installPrompt && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 flex flex-col gap-3 max-w-sm">
          <div>
            <h3 className="font-semibold text-gray-800">Install AeroMate</h3>
            <p className="text-sm text-gray-600">Install this app on your device for quick access and a better experience.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setInstallPrompt(null)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Maybe later
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-medium"
            >
              Install App
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaFeatures;
