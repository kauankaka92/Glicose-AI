import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'Sync endpoint ready',
      localFirst: true,
      cloudReady: false,
    },
    error: null,
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'Sync not yet implemented - using local storage',
    },
    error: null,
  })
}