import * as ping from 'ping';
import { createConnection } from 'net';
import { SshConfig } from './ssh';

export type DeviceStatus = 'online' | 'offline' | 'unknown';

export interface DeviceStatusInfo {
  status: DeviceStatus;
  pingTime?: number;
  sshAccessible?: boolean;
  lastChecked: Date;
  message?: string;
}

export async function checkDeviceConnectivity(host: string, sshConfig?: SshConfig): Promise<DeviceStatusInfo> {
  const statusInfo: DeviceStatusInfo = {
    status: 'unknown',
    lastChecked: new Date(),
  };

  try {
    // Check ping connectivity
    const pingResult = await checkPing(host);
    if (pingResult.alive) {
      statusInfo.status = 'online';
      statusInfo.pingTime = pingResult.time;
      statusInfo.message = `Device reachable via ping`;
    }

    // If ping failed, try SSH port check
    if (statusInfo.status === 'unknown' && sshConfig) {
      const sshAccessible = await checkSshPort(sshConfig);
      if (sshAccessible) {
        statusInfo.status = 'online';
        statusInfo.sshAccessible = true;
        statusInfo.message = 'SSH port accessible';
      }
    }

    // If both checks failed, mark as offline
    if (statusInfo.status === 'unknown') {
      statusInfo.status = 'offline';
      statusInfo.message = 'Device unreachable';
    }

  } catch (error) {
    console.error(`Error checking connectivity for ${host}:`, error);
    statusInfo.status = 'unknown';
    statusInfo.message = 'Check failed';
  }

  return statusInfo;
}

async function checkPing(host: string): Promise<{ alive: boolean; time?: number }> {
  return new Promise((resolve) => {
    ping.sys.probe(host, (isAlive, pingTime) => {
      resolve({
        alive: !!isAlive,
        time: pingTime || undefined,
      });
    }, {
      timeout: 3, // 3 seconds timeout
    });
  });
}

async function checkSshPort(sshConfig: SshConfig): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({
      host: sshConfig.host,
      port: sshConfig.port || 22,
      timeout: 3000, // 3 seconds timeout
    });

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export function isValidMacAddress(mac: string): boolean {
  if (!mac || mac === 'null' || mac === 'undefined') return false;
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

export function isValidBroadcastAddress(broadcast: string): boolean {
  if (!broadcast || broadcast === 'null' || broadcast === 'undefined') return false;
  // Simple IP address validation
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(broadcast)) return false;

  // Check if it's a valid broadcast address (last octet is 255 or x.x.x.255)
  const parts = broadcast.split('.');
  const lastOctet = parseInt(parts[3]);
  return lastOctet === 255;
}