import { NextRequest, NextResponse } from 'next/server'

interface AILogEntry {
  id: string
  event_type: string
  actions: string[]
  data: Record<string, unknown>
  insulin?: {
    correction: number
    meal: number
    total: number
  }
  timestamp: string
}

const AI_LOG_KEY = 'glicose_ai_event_log'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function getLogEntries(): AILogEntry[] {
  const storage = getLocalStorage()
  if (!storage) return []
  try {
    const data = storage.getItem(AI_LOG_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * ENDPOINT DE LOG DE EVENTOS DA IA
 *
 * Finalidade:
 * - Auditoria de todas as ações da IA
 * - Histórico completo de decisões
 * - Debug e troubleshooting
 * - Rastreabilidade de dados médicos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, actions, data, insulin, timestamp } = body

    if (!event_type || !actions) {
      return NextResponse.json(
        { success: false, error: 'event_type and actions are required' },
        { status: 400 }
      )
    }

    const entry: AILogEntry = {
      id: generateId(),
      event_type,
      actions,
      data,
      insulin,
      timestamp: timestamp || new Date().toISOString()
    }

    // Salvar no localStorage (client-side)
    // Em produção, isso iria para um banco de dados
    const storage = getLocalStorage()
    if (storage) {
      const entries = getLogEntries()
      entries.push(entry)

      // Manter apenas últimos 1000 eventos para não saturar storage
      const trimmed = entries.slice(-1000)
      storage.setItem(AI_LOG_KEY, JSON.stringify(trimmed))

      console.log('[AI-LOG] Evento registrado:', entry.id)
    }

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Event logged successfully'
    })
  } catch (error) {
    console.error('[AI-LOG] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log event',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const entries = getLogEntries()

    // Ordenar por timestamp (mais recente primeiro)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      data: entries,
      meta: { count: entries.length },
      error: null
    })
  } catch (error) {
    console.error('[AI-LOG] Erro ao buscar logs:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to fetch logs'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const storage = getLocalStorage()
    if (!storage) {
      return NextResponse.json(
        { success: false, error: 'Storage not available' },
        { status: 500 }
      )
    }

    // Suporta deletar um entry específico ou todos
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const entries = getLogEntries()
      const filtered = entries.filter(e => e.id !== id)
      storage.setItem(AI_LOG_KEY, JSON.stringify(filtered))
      console.log('[AI-LOG] Entry deletada:', id)
    } else {
      storage.removeItem(AI_LOG_KEY)
      console.log('[AI-LOG] Todos os logs limpos')
    }

    return NextResponse.json({
      success: true,
      message: id ? 'Entry deleted' : 'All logs cleared'
    })
  } catch (error) {
    console.error('[AI-LOG] Erro ao deletar:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete log'
      },
      { status: 500 }
    )
  }
}