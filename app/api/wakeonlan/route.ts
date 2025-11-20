import { NextRequest, NextResponse } from 'next/server';
import { wakeOnLan } from '../../../lib/wakeonlan';
import { getDeviceByName } from '../../../lib/config';

export async function POST(request: NextRequest) {
  try {
    const { deviceName } = await request.json();

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

    const success = await wakeOnLan(device.mac, device.broadcast);

    if (success) {
      return NextResponse.json(
        { message: `Wake-on-LAN packet sent to ${device.name}`, device: device.name },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send Wake-on-LAN packet' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Wake-on-LAN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}