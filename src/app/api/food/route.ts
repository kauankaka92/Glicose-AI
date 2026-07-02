import { NextRequest, NextResponse } from 'next/server'
import { saveFood, getFoodEntries, deleteFoodEntry } from '@/lib/storage'
import { FoodEntry } from '@/lib/types'

export async function GET() {
  try {
    const entries = getFoodEntries()
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
        error: 'Failed to fetch food entries',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, totalCarbs, timestamp, mealType, note } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Food items are required',
        },
        { status: 400 }
      )
    }

    if (typeof totalCarbs !== 'number' || totalCarbs < 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Total carbs must be a positive number',
        },
        { status: 400 }
      )
    }

    const entry: Omit<FoodEntry, 'id'> = {
      items,
      totalCarbs,
      timestamp: timestamp || new Date().toISOString(),
      mealType,
      note,
    }

    const saved = await saveFood(entry)

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

    const deleted = deleteFoodEntry(id)

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