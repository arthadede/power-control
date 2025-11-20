import { NextRequest, NextResponse } from 'next/server';
import { getDeviceByName } from '../../../../../lib/config';
import { checkDeviceConnectivity } from '../../../../../lib/connectivity';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const { name: deviceName } = await params;

    if (!deviceName) {
      return NextResponse.json(
        { error: 'Device name is required' },
        { status: 400 }
      );
    }

    const device = getDeviceByName(deviceName);
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const statusInfo = await checkDeviceConnectivity(device.ssh.host, device.ssh);

    return NextResponse.json({
      device: device.name,
      status: statusInfo.status,
      pingTime: statusInfo.pingTime,
      sshAccessible: statusInfo.sshAccessible,
      message: statusInfo.message,
      lastChecked: statusInfo.lastChecked,
    });
  } catch (error) {
    console.error('Device status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}