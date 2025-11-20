import { NextRequest, NextResponse } from 'next/server';
import { getAllDevices } from '../../../lib/config';

export async function GET() {
  try {
    const devices = getAllDevices();
    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Failed to load devices:', error);
    return NextResponse.json(
      { error: 'Failed to load device configurations' },
      { status: 500 }
    );
  }
}