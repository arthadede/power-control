import { readFileSync } from 'fs';
import { join } from 'path';

export interface DeviceConfig {
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

let devices: DeviceConfig[] | null = null;

export function loadDevices(): DeviceConfig[] {
  if (devices) {
    return devices;
  }

  try {
    const configPath = join(process.cwd(), 'config', 'devices.json');
    const configData = readFileSync(configPath, 'utf-8');
    devices = JSON.parse(configData) as DeviceConfig[];
    return devices;
  } catch (error) {
    console.error('Failed to load device configuration:', error);
    return [];
  }
}

export function getDeviceByName(name: string): DeviceConfig | undefined {
  const devices = loadDevices();
  return devices.find(device => device.name === name);
}

export function getAllDevices(): DeviceConfig[] {
  return loadDevices();
}