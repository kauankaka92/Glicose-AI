import { NextRequest, NextResponse } from 'next/server'
import { interpretNaturalLanguage, searchFood } from '@/lib/ai-engine'
import { getGlucoseEntries, getFoodEntries, getInsulinEntries } from '@/lib/storage'
import { calculateGlucoseStats, calculateTrend, generateInsightText } from '@/lib/insights'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Input text is required',
        },
        { status: 400 }
      )
    }

    const interpretation = interpretNaturalLanguage(input)

    if (interpretation.type === 'query') {
      const glucoseEntries = getGlucoseEntries()
      const stats = calculateGlucoseStats(glucoseEntries)
      const trend = calculateTrend(glucoseEntries)
      const insight = generateInsightText(stats, trend)

      interpretation.summary = insight

      return NextResponse.json({
        success: true,
        data: {
          type: 'query',
          stats,
          trend,
          insight,
          summary: interpretation.summary,
        },
        error: null,
      })
    }

    return NextResponse.json({
      success: true,
      data: interpretation,
      meta: {
        readyToSave: !!(interpretation.glucose || interpretation.meal),
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to process input',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      version: '4.0.0',
    },
    error: null,
  })
}