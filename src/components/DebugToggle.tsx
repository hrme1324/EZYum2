import React, { useState } from 'react';
import { getConfig } from '../utils/debug';
import DebugControlPanel from './DebugControlPanel';

export const DebugToggle: React.FC = () => {
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const config = getConfig();

  // Only show in development or when debug is enabled
  if (!import.meta.env.DEV && !config.enabled) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
        className={`fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-200 ${
          isDebugPanelVisible
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title="Toggle Debug Panel"
      >
        {isDebugPanelVisible ? '🐛' : '🐛'}
      </button>

      <DebugControlPanel
        isVisible={isDebugPanelVisible}
        onToggle={() => setIsDebugPanelVisible(false)}
      />
    </>
  );
};

export default DebugToggle;
