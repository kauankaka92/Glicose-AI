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
    const { message, messages, userId = 'default' } = body

    // Support both single message and conversation formats
    const messageText = message || (messages?.length > 0 ? messages[messages.length - 1].content : null)

    if (!messageText && (!messages || !Array.isArray(messages))) {
      return NextResponse.json(
        { success: false, error: 'Message or messages array is required' },
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

    const recentMessages = messageText ? [{ role: 'user' as const, content: messageText }] : messages.slice(-10)

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
    ]

    const apiKey = process.env.NVIDIA_NIM_API_KEY
    const model = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-8b-instruct'

    if (!apiKey) {
      console.warn('NVIDIA_NIM_API_KEY not configured, using fallback NLP')

      // Fallback: NLP local baseado em patterns
      const lastMessage = messageText || ''
      const text = lastMessage.toLowerCase()

      let response = 'Não consegui conectar ao servidor de IA. Verifique a API Key nas configurações do Vercel.'
      const actions: ChatAction[] = []

      // Detectar contexto
      let context: string = 'other'
      if (text.includes('jejum') || text.includes('acordar')) context = 'fasting'
      else if (text.includes('antes') || text.includes('pré')) context = 'before_meal'
      else if (text.includes('depois') || text.includes('pós') || text.includes('após')) context = 'after_meal'
      else if (text.includes('dormir') || text.includes('cama')) context = 'bedtime'
      else if (text.includes('madrugada') || text.includes('noite')) context = 'night'
      else if (text.includes('exercício') || text.includes('treino')) context = 'exercise'

      // Detectar glicose
      const glucoseMatch = text.match(/(\d{2,3})\s*(mg|glicose)/) || text.match(/glicose.*?(\d{2,3})/)
      if (glucoseMatch) {
        const value = parseInt(glucoseMatch[1])
        const note = lastMessage.match(/[0-9]\s+(.*)/)?.[1] || ''
        response = `Glicose detectada: ${value} mg/dL ${context !== 'other' ? `(${context})` : ''}.`
        actions.push({ type: 'save_glucose', data: { value, context, note }, confirmed: false })

        // Se mencionar insulina também
        if (text.includes('insulina') || text.includes('unidade') || text.includes('aplicar')) {
          const correction = Math.round((value - settings.targetGlucose) / settings.correctionFactor * 10) / 10
          if (correction > 0) {
            response += ` Para correção: ${correction}U.`
            actions.push({ type: 'save_insulin', data: { correction, glucoseValue: value, meal: 0 }, confirmed: false })
          } else {
            response += ' Glicose no alvo, sem correção necessária.'
          }
        }
      }

      // Detectar carboidratos / refeição
      const carbsMatch = text.match(/(\d+)\s*(g|grama|carb)/) || text.match(/carb.*?(\d+)/)
      if (carbsMatch) {
        const carbs = parseInt(carbsMatch[1])
        const mealDose = Math.round((carbs / settings.carbRatio) * 10) / 10
        response = `Para ${carbs}g de carboidratos: ${mealDose}U de insulina.`
        actions.push({ type: 'save_food', data: { items: [{ name: 'Refeição', carbs }], mealType: 'lunch' }, confirmed: false })
        actions.push({ type: 'save_insulin', data: { correction: 0, meal: mealDose }, confirmed: false })
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