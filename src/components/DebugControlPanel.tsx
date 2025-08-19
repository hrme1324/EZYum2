import React, { useEffect, useState } from 'react';
import {
  clearLogs,
  debugLogger,
  disable,
  enable,
  exportLogs,
  getConfig,
  getErrorLogs,
  getLogs,
  getPerformanceLogs,
  setLevel,
  updateConfig,
} from '../utils/debug';

interface DebugControlPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const DebugControlPanel: React.FC<DebugControlPanelProps> = ({ isVisible, onToggle }) => {
  const [config, setConfig] = useState(getConfig());
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'errors' | 'performance'>(
    'config',
  );

  useEffect(() => {
    if (isVisible) {
      refreshLogs();
    }
  }, [isVisible]);

  const refreshLogs = () => {
    setLogs(getLogs());
  };

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfig(newConfig);
  };

  const handleEnable = () => {
    enable();
    setConfig(getConfig());
  };

  const handleDisable = () => {
    disable();
    setConfig(getConfig());
  };

  const handleSetLevel = (level: 'basic' | 'detailed' | 'verbose') => {
    setLevel(level);
    setConfig(getConfig());
  };

  const handleClearLogs = () => {
    clearLogs();
    refreshLogs();
  };

  const handleExportLogs = () => {
    const logData = exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezyum-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getErrorCount = () => getErrorLogs().length;
  const getPerformanceCount = () => getPerformanceLogs().length;

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 w-96 h-screen bg-gray-900 text-white p-4 overflow-y-auto z-50 border-l border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🐛 Debug Control Panel</h2>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1 rounded ${activeTab === 'config' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Config
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1 rounded ${activeTab === 'logs' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`px-3 py-1 rounded ${activeTab === 'errors' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Errors ({getErrorCount()})
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-3 py-1 rounded ${activeTab === 'performance' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Performance ({getPerformanceCount()})
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Debug Logging</span>
            <div className="flex space-x-2">
              <button
                onClick={handleEnable}
                className={`px-3 py-1 rounded ${config.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                Enable
              </button>
              <button
                onClick={handleDisable}
                className={`px-3 py-1 rounded ${!config.enabled ? 'bg-red-600' : 'bg-gray-600'}`}
              >
                Disable
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Log Level</label>
            <select
              value={config.level}
              onChange={(e) => handleSetLevel(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
            >
              <option value="basic">Basic</option>
              <option value="detailed">Detailed</option>
              <option value="verbose">Verbose</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeTiming}
                onChange={(e) => handleConfigChange('includeTiming', e.target.checked)}
                className="mr-2"
              />
              Include Timing
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeStackTraces}
                onChange={(e) => handleConfigChange('includeStackTraces', e.target.checked)}
                className="mr-2"
              />
              Include Stack Traces
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeUserContext}
                onChange={(e) => handleConfigChange('includeUserContext', e.target.checked)}
                className="mr-2"
              />
              Include User Context
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeNetworkDetails}
                onChange={(e) => handleConfigChange('includeNetworkDetails', e.target.checked)}
                className="mr-2"
              />
              Include Network Details
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeStateChanges}
                onChange={(e) => handleConfigChange('includeStateChanges', e.target.checked)}
                className="mr-2"
              />
              Include State Changes
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includePerformance}
                onChange={(e) => handleConfigChange('includePerformance', e.target.checked)}
                className="mr-2"
              />
              Include Performance
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.logToConsole}
                onChange={(e) => handleConfigChange('logToConsole', e.target.checked)}
                className="mr-2"
              />
              Log to Console
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.logToStorage}
                onChange={(e) => handleConfigChange('logToStorage', e.target.checked)}
                className="mr-2"
              />
              Log to Storage
            </label>
          </div>

          <div>
            <label className="block text-sm mb-2">Max Storage Logs</label>
            <input
              type="number"
              value={config.maxStorageLogs}
              onChange={(e) => handleConfigChange('maxStorageLogs', parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              min="100"
              max="10000"
            />
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button onClick={refreshLogs} className="px-3 py-1 bg-blue-600 rounded">
              Refresh
            </button>
            <button onClick={handleClearLogs} className="px-3 py-1 bg-red-600 rounded">
              Clear
            </button>
            <button onClick={handleExportLogs} className="px-3 py-1 bg-green-600 rounded">
              Export
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs
              .slice(-50)
              .reverse()
              .map((log, index) => (
                <div key={index} className="bg-gray-800 p-2 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        log.level === 'error'
                          ? 'bg-red-600'
                          : log.level === 'warn'
                            ? 'bg-yellow-600'
                            : log.level === 'info'
                              ? 'bg-blue-600'
                              : 'bg-gray-600'
                      }`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    <div>
                      [{log.category}] {log.operation}
                    </div>
                    <div className="text-gray-300">{log.message}</div>
                    {log.timing && (
                      <div className="text-green-400">⏱️ {log.timing.duration.toFixed(2)}ms</div>
                    )}
                    {log.details && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-400">Details</summary>
                        <pre className="text-xs mt-1 text-gray-300 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button onClick={refreshLogs} className="px-3 py-1 bg-blue-600 rounded">
              Refresh
            </button>
            <button onClick={handleExportLogs} className="px-3 py-1 bg-green-600 rounded">
              Export Errors
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getErrorLogs()
              .slice(-20)
              .reverse()
              .map((log, index) => (
                <div key={index} className="bg-red-900 p-2 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-red-600 px-2 py-1 rounded text-xs">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-300">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    <div>
                      [{log.category}] {log.operation}
                    </div>
                    <div className="text-red-200">{log.message}</div>
                    {log.stackTrace && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-red-300">Stack Trace</summary>
                        <pre className="text-xs mt-1 text-red-200 overflow-x-auto">
                          {log.stackTrace}
                        </pre>
                      </details>
                    )}
                    {log.details && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-red-300">Details</summary>
                        <pre className="text-xs mt-1 text-red-200 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button onClick={refreshLogs} className="px-3 py-1 bg-blue-600 rounded">
              Refresh
            </button>
            <button onClick={handleExportLogs} className="px-3 py-1 bg-green-600 rounded">
              Export Performance
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getPerformanceLogs()
              .slice(-20)
              .reverse()
              .map((log, index) => (
                <div key={index} className="bg-yellow-900 p-2 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-yellow-600 px-2 py-1 rounded text-xs">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-300">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    <div>
                      [{log.category}] {log.operation}
                    </div>
                    <div className="text-yellow-200">{log.message}</div>
                    {log.timing && (
                      <div className="text-yellow-400">⏱️ {log.timing.duration.toFixed(2)}ms</div>
                    )}
                    {log.performance && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-yellow-300">
                          Performance Data
                        </summary>
                        <pre className="text-xs mt-1 text-yellow-200 overflow-x-auto">
                          {JSON.stringify(log.performance, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              debugLogger.info('debug', 'manual_test', 'Manual test log from debug panel');
              refreshLogs();
            }}
            className="px-3 py-2 bg-blue-600 rounded text-sm"
          >
            Test Log
          </button>
          <button
            onClick={() => {
              debugLogger.error('debug', 'manual_error', 'Manual error test from debug panel', {
                test: true,
              });
              refreshLogs();
            }}
            className="px-3 py-2 bg-red-600 rounded text-sm"
          >
            Test Error
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugControlPanel;
