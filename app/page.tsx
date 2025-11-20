'use client';

import { useState, useEffect } from 'react';
import DeviceCard from '../components/DeviceCard';

interface DeviceConfig {
  name: string;
  mac: string;
  broadcast: string;
  ssh: {
    host: string;
    port?: number;
    username: string;
    password: string;
  };
}

export default function Home() {
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/devices');
      const result = await response.json();

      if (response.ok) {
        setDevices(result.devices);
        setError(null);
      } else {
        setError(result.error || 'Failed to load device configurations');
      }
    } catch (err) {
      setError('Failed to load device configurations');
      console.error('Failed to load devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceAction = (deviceName: string, action: 'wake' | 'shutdown') => {
    console.log(`Device ${deviceName}: ${action} action completed`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Power Control
          </h1>
          <p className="text-lg text-gray-600">
            Monitor and control your devices remotely
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Real-time device status with automatic refresh every 30 seconds
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-500 mt-2">Loading device configurations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
            <div className="text-red-600">
              <svg
                className="w-6 h-6 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="font-medium">Configuration Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Device Grid */}
        {!isLoading && !error && (
          <>
            {devices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">No devices configured</p>
                  <p className="text-sm">
                    Please add device configurations to <code className="bg-gray-100 px-2 py-1 rounded text-xs">config/devices.json</code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device, index) => (
                  <DeviceCard
                    key={`${device.name}-${index}`}
                    device={device}
                    onAction={handleDeviceAction}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How to use:</h2>
          <div className="space-y-2 text-blue-800 text-sm">
            <p>• <strong>Status Colors:</strong> 🟢 Online | 🔴 Offline | 🟡 Unknown</p>
            <p>• <strong>Auto-refresh:</strong> Status updates every 30 seconds</p>
            <p>• <strong>Manual refresh:</strong> Click the refresh icon (↻) on each device</p>
            <p>• <strong>Wake Up:</strong> Only shown for devices with MAC/Broadcast configured</p>
            <p>• <strong>Shutdown:</strong> SSH command with 1-minute delay</p>
            <p>• <strong>Configure:</strong> Edit devices in <code className="bg-blue-100 px-2 py-1 rounded text-xs">config/devices.json</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}