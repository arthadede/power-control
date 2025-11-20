import { NextRequest, NextResponse } from 'next/server';
import { executeShutdown } from '../../../lib/ssh';
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

    const success = await executeShutdown(device.ssh);

    if (success) {
      return NextResponse.json(
        { message: `Shutdown command sent to ${device.name}`, device: device.name },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to execute shutdown command' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SSH shutdown error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}