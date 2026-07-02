import { NextRequest, NextResponse } from 'next/server'
import { saveInsulin, getInsulinEntries, deleteInsulinEntry } from '@/lib/storage'
import { InsulinEntry } from '@/lib/types'

export async function GET() {
  try {
    const entries = getInsulinEntries()
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
        error: 'Failed to fetch insulin entries',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { correction, meal, total, timestamp, glucoseValue, note } = body

    if (typeof correction !== 'number' || typeof total !== 'number') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Correction and total doses are required',
        },
        { status: 400 }
      )
    }

    if (correction < 0 || total < 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Doses cannot be negative',
        },
        { status: 400 }
      )
    }

    const entry: Omit<InsulinEntry, 'id'> = {
      correction,
      meal: meal || 0,
      total,
      timestamp: timestamp || new Date().toISOString(),
      glucoseValue,
      note,
    }

    const saved = saveInsulin(entry)

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

    const deleted = deleteInsulinEntry(id)

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