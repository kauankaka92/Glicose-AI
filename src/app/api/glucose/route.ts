import { NextRequest, NextResponse } from 'next/server'
import { saveGlucose, getGlucoseEntries, deleteGlucoseEntry } from '@/lib/storage'
import { GlucoseEntry } from '@/lib/types'

export async function GET() {
  try {
    const entries = getGlucoseEntries()
    return NextResponse.json({
      success: true,
      data: entries,
      meta: { count: entries.length },
      error: null,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to fetch glucose entries',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { value, timestamp, context, note } = body

    if (!value || typeof value !== 'number') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Glucose value is required and must be a number',
        },
        { status: 400 }
      )
    }

    if (value < 20 || value > 600) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Glucose value must be between 20 and 600 mg/dL',
        },
        { status: 400 }
      )
    }

    const entry: Omit<GlucoseEntry, 'id'> = {
      value,
      timestamp: timestamp || new Date().toISOString(),
      context,
      note,
    }

    const saved = saveGlucose(entry)

    return NextResponse.json({
      success: true,
      data: saved,
      error: null,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Invalid request body',
      },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'ID is required',
        },
        { status: 400 }
      )
    }

    const deleted = deleteGlucoseEntry(id)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Entry not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to delete entry',
      },
      { status: 500 }
    )
  }
}