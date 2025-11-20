'use client';

import { useState } from 'react';
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

interface PowerButtonProps {
  device: DeviceConfig;
  type: 'wake' | 'shutdown';
  onAction?: (deviceName: string, action: 'wake' | 'shutdown') => void;
}

export default function PowerButton({ device, type, onAction }: PowerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    const endpoint = type === 'wake' ? '/api/wakeonlan' : '/api/shutdown';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceName: device.name,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(result.message);
        onAction?.(device.name, type);
      } else {
        setError(result.error || 'Failed to execute command');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(`${type} command error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const isWakeButton = type === 'wake';
  const buttonClass = `
    px-4 py-2 rounded-lg font-medium transition-all duration-200
    ${isLoading
      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
      : isWakeButton
        ? 'bg-green-500 hover:bg-green-600 text-white'
        : 'bg-red-500 hover:bg-red-600 text-white'
    }
    ${!isLoading && 'shadow-sm hover:shadow-md'}
  `;

  const buttonText = isLoading
    ? (isWakeButton ? 'Waking...' : 'Shutting Down...')
    : (isWakeButton ? 'Wake Up' : 'Shutdown');

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={buttonClass}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
        )}
        {buttonText}
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}