'use client';

import { useState, useEffect } from 'react';
import PowerButton from './PowerButton';

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

type DeviceStatus = 'online' | 'offline' | 'unknown';

interface DeviceStatusInfo {
  status: DeviceStatus;
  pingTime?: number;
  sshAccessible?: boolean;
  message?: string;
  lastChecked: Date;
}

interface DeviceCardProps {
  device: DeviceConfig;
  onAction?: (deviceName: string, action: 'wake' | 'shutdown') => void;
}

export default function DeviceCard({ device, onAction }: DeviceCardProps) {
  const [lastAction, setLastAction] = useState<'wake' | 'shutdown' | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusInfo>({
    status: 'unknown',
    lastChecked: new Date(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasWakeOnLan = device.mac && device.mac !== 'null' && device.broadcast && device.broadcast !== 'null';

  useEffect(() => {
    checkDeviceStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkDeviceStatus, 30000);
    return () => clearInterval(interval);
  }, [device.name]);

  const checkDeviceStatus = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/devices/${encodeURIComponent(device.name)}/status`);
      const result = await response.json();

      if (response.ok) {
        setDeviceStatus({
          status: result.status,
          pingTime: result.pingTime,
          sshAccessible: result.sshAccessible,
          message: result.message,
          lastChecked: new Date(result.lastChecked),
        });
      } else {
        setDeviceStatus({
          status: 'unknown',
          message: 'Status check failed',
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      setDeviceStatus({
        status: 'unknown',
        message: 'Unable to check status',
        lastChecked: new Date(),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAction = (deviceName: string, action: 'wake' | 'shutdown') => {
    setLastAction(action);
    onAction?.(deviceName, action);

    // Refresh status after action completes
    setTimeout(() => {
      checkDeviceStatus();
      setLastAction(null);
    }, 3000);
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const formatDisplayValue = (value: string | null) => {
    return value && value !== 'null' ? value : 'N/A';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Device Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={checkDeviceStatus}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh status"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(deviceStatus.status)} transition-colors duration-300`}></div>
            <span className="ml-2 text-sm text-gray-600">
              {getStatusText(deviceStatus.status)}
            </span>
          </div>
        </div>
      </div>

  
      {/* Device Information */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-24">MAC:</span>
          <span className="font-mono text-gray-700">{formatDisplayValue(device.mac)}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-24">Broadcast:</span>
          <span className="font-mono text-gray-700">{formatDisplayValue(device.broadcast)}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-24">SSH Host:</span>
          <span className="font-mono text-gray-700">{device.ssh.host}:{device.ssh.port || 22}</span>
        </div>
      </div>

      {/* Action Status */}
      {lastAction && (
        <div className={`mb-4 p-2 rounded text-sm text-center ${
          lastAction === 'wake'
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {lastAction === 'wake'
            ? '✓ Wake-on-LAN packet sent successfully!'
            : '⚠️ Shutdown command sent (1 minute delay)'
          }
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        {hasWakeOnLan && (
          <PowerButton
            device={device}
            type="wake"
            onAction={handleAction}
          />
        )}
        <PowerButton
          device={device}
          type="shutdown"
          onAction={handleAction}
        />
      </div>
    </div>
  );
}