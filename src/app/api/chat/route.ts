import { NextRequest, NextResponse } from 'next/server'
import { getGlucoseEntries, getFoodEntries, getInsulinEntries, getSettings } from '@/lib/storage'
import { calculateGlucoseStats, calculateTrend } from '@/lib/insights'

const NVIDIA_NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatAction {
  type: 'save_glucose' | 'save_insulin' | 'save_food' | 'save_note' | 'read_data' | 'none'
  data?: Record<string, any>
  confirmed?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId = 'default' } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const settings = getSettings()
    const glucoseEntries = getGlucoseEntries()
    const stats = calculateGlucoseStats(glucoseEntries)
    const trend = calculateTrend(glucoseEntries)
    const lastGlucose = glucoseEntries.length > 0 ? glucoseEntries[glucoseEntries.length - 1] : null

    const systemPrompt = `Você é um assistente especializado em diabetes e monitoramento de glicose.

CONTEXTO DO USUÁRIO:
- Glicose alvo: ${settings.targetGlucose} mg/dL
- Fator de correção: ${settings.correctionFactor} mg/dL por unidade
- Razão de carboidratos: ${settings.carbRatio}g por unidade
- Tempo de insulina ativa: ${settings.activeInsulinTime} horas

DADOS ATUAIS:
- Média de glicose: ${stats.average} mg/dL
- Mínimo: ${stats.min || 'N/A'} mg/dL
- Máximo: ${stats.max || 'N/A'} mg/dL
- Tendência: ${trend.direction === 'up' ? 'subindo' : trend.direction === 'down' ? 'descendo' : 'estável'}
- Últimas ${glucoseEntries.length} medições

REGRAS:
1. Para calcular insulina de correção: (glicose_atual - glicose_alvo) / fator_correcao
2. Para insulina de carboidratos: carboidratos_totais / razao_carboidratos
3. Sempre peça confirmação antes de registrar dados
4. Se glicose < 50 ou > 400 mg/dL, alerte sobre buscar ajuda médica
5. Seja direto e claro, evite jargões médicos complexos
6. Responda em português do Brasil
7. Máximo 3-4 linhas por resposta

FORMATO DA RESPOSTA:
Responda de forma natural. Se detectar uma intenção de salvar dados, inclua no final:
[AÇÃO: tipo_da_acao|dados_em_json]

Tipos de ação:
- save_glucose: {"value": numero, "context": "fasting|before_meal|after_meal|bedtime|night|exercise|other", "note": "texto"}
- save_insulin: {"correction": numero, "meal": numero, "glucoseValue": numero}
- save_food: {"items": [{"name": "nome", "carbs": numero}], "mealType": "breakfast|lunch|dinner|snack"}
- save_note: {"content": "texto"}
- read_data: {"type": "stats|trend|last_reading"}

Exemplo: "Sua dose seria de 2.5 unidades. [AÇÃO: save_insulin|{"correction": 2.5, "glucoseValue": 250}]"`

    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === 'user').pop()
    const recentMessages = messages.slice(-10)

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
    ]

    const apiKey = process.env.NVIDIA_NIM_API_KEY
    const model = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-8b-instruct'

    if (!apiKey) {
      console.warn('NVIDIA_NIM_API_KEY not configured, using fallback NLP')

      // Fallback: NLP local baseado em patterns
      const lastMessage = lastUserMessage?.content || ''
      const text = lastMessage.toLowerCase()

      let response = 'Não consegui conectar ao servidor de IA. Verifique a API Key nas configurações do Vercel.'
      const actions: ChatAction[] = []

      // Detectar glicose
      const glucoseMatch = text.match(/(\d{2,3})\s*(mg|glicose)/)
      if (glucoseMatch) {
        const value = parseInt(glucoseMatch[1])
        response = `Glicose detectada: ${value} mg/dL. Para calcular insulina, preciso do seu fator de correção.`
        actions.push({ type: 'save_glucose', data: { value }, confirmed: false })
      }

      // Detectar pergunta sobre insulina
      if (text.includes('insulina') || text.includes('unidade')) {
        const glucoseMatch2 = text.match(/(\d{2,3})/)
        if (glucoseMatch2) {
          const glucose = parseInt(glucoseMatch2[1])
          const correction = Math.round((glucose - settings.targetGlucose) / settings.correctionFactor * 10) / 10
          if (correction > 0) {
            response = `Para glicose de ${glucose} mg/dL: ${correction}U de correção.`
            actions.push({ type: 'save_insulin', data: { correction, glucoseValue: glucose }, confirmed: false })
          } else {
            response = 'Sua glicose está no alvo. Não precisa de correção.'
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          response,
          actions,
          timestamp: new Date().toISOString(),
          fallback: true,
        },
      })
    }

    const response = await fetch(NVIDIA_NIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: llmMessages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NVIDIA API Error:', errorText)

      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'

    const actions: ChatAction[] = []
    const actionRegex = /\[AÇÃO:\s*(\w+)\|(\{[^}]+\})\]/i
    let match

    const cleanResponse = aiResponse.replace(actionRegex, (_: string, type: string, dataStr: string) => {
      try {
        const parsed = JSON.parse(dataStr)
        actions.push({
          type: type as any,
          data: parsed,
          confirmed: false
        })
      } catch (e) {
        console.error('Failed to parse action:', e)
      }
      return ''
    }).trim()

    return NextResponse.json({
      success: true,
      data: {
        response: cleanResponse,
        actions,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      version: '4.0.0-chat',
    },
  })
}