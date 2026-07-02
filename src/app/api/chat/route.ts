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

    const messageText = message || (messages?.length > 0 ? messages[messages.length - 1].content : null)

    if (!messageText && (!messages || !Array.isArray(messages))) {
      return NextResponse.json(
        { success: false, error: 'Message or messages array is required' },
        { status: 400 }
      )
    }

    // Obter configurações e dados atuais
    const settings = getSettings()
    console.log('=== CHAT API DEBUG ===')
    console.log('Settings:', settings)
    console.log('Incoming message:', messageText)

    const glucoseEntries = getGlucoseEntries()
    console.log('Glucose entries count:', glucoseEntries.length)

    const stats = calculateGlucoseStats(glucoseEntries)
    const trend = calculateTrend(glucoseEntries)
    const lastGlucose = glucoseEntries.length > 0 ? glucoseEntries[glucoseEntries.length - 1] : null
    const foodEntries = getFoodEntries()
    const insulinEntries = getInsulinEntries()

    // PRIMEIRO: Tentar detectar e registrar dados diretamente
    const text = messageText.toLowerCase()
    console.log('Text lowercase:', text)

    let directResponse: { response: string; actions: ChatAction[] } | null = null

    // Detectar glicose com valor numérico
    const glucoseMatch = text.match(/glicose.*?(\d{2,3})|(\d{2,3}).*?mg|ao acordar.*?(\d{2,3})|(\d{2,3}).*?ao acordar/i)
    console.log('Glucose match result:', glucoseMatch)
    const glucoseValue = glucoseMatch?.[1] || glucoseMatch?.[2] || glucoseMatch?.[3] || glucoseMatch?.[4] ?
      parseInt(glucoseMatch?.[1] || glucoseMatch?.[2] || glucoseMatch?.[3] || glucoseMatch?.[4]) : null
    console.log('Glucose value parsed:', glucoseValue)

    // Detectar contexto
    let context = 'other'
    console.log('Checking context in:', text)
    if (text.includes('ao acordar') || text.includes('jejum')) context = 'fasting'
    else if (text.includes('antes')) context = 'before_meal'
    else if (text.includes('depois') || text.includes('após')) context = 'after_meal'
    else if (text.includes('dormir') || text.includes('cama')) context = 'bedtime'
    else if (text.includes('madrugada')) context = 'night'
    else if (text.includes('exercício') || text.includes('treino')) context = 'exercise'
    console.log('Context detected:', context)

    // Detectar insulina/unidades
    const insulinMatch = text.match(/(\d+[.,]?\d*)\s*(unidade|insulina|u)[s]?/i)
    console.log('Insulin match result:', insulinMatch)
    const insulinValue = insulinMatch ? parseFloat(insulinMatch[1].replace(',', '.')) : null
    console.log('Insulin value parsed:', insulinValue)

    // SE tiver glicose E insulina na mesma mensagem -> registrar ambos
    if (glucoseValue && insulinValue) {
      const note = text.replace(/glicose|ao acordar|jejum|\d+/gi, '').trim().substring(0, 50)
      console.log('Detected BOTH - Glucose:', glucoseValue, 'Insulin:', insulinValue, 'Context:', context)

      directResponse = {
        response: `✅ Registrado! Glicose: ${glucoseValue} mg/dL (${context}) e Insulina: ${insulinValue}U de correção.`,
        actions: [
          { type: 'save_glucose', data: { value: glucoseValue, context, note: note || 'Registro via chat' } },
          { type: 'save_insulin', data: { correction: insulinValue, meal: 0, total: insulinValue, glucoseValue, note: note || 'Correção via chat' } },
        ],
      }
    }
    // SE tiver só glicose -> registrar glicose
    else if (glucoseValue) {
      const note = text.replace(/glicose|ao acordar|jejum|\d+/gi, '').trim().substring(0, 50)
      console.log('Detected GLUCOSE ONLY - Value:', glucoseValue, 'Context:', context)

      directResponse = {
        response: `✅ Glicose registrada: ${glucoseValue} mg/dL (${context}). ${glucoseValue > 180 ? '⚠️ Está acima do alvo!' : glucoseValue < 70 ? '⚠️ Está baixo!' : '✓ No alvo!'}`,
        actions: [
          { type: 'save_glucose', data: { value: glucoseValue, context, note: note || 'Registro via chat' } },
        ],
      }
    }
    // SE tiver só insulina -> registrar insulina
    else if (insulinValue) {
      const note = text.replace(/unidade|insulina|\d+/gi, '').trim().substring(0, 50)
      console.log('Detected INSULIN ONLY - Value:', insulinValue)

      directResponse = {
        response: `✅ Insulina registrada: ${insulinValue}U.`,
        actions: [
          { type: 'save_insulin', data: { correction: insulinValue, meal: 0, total: insulinValue, note: note || 'Registro via chat' } },
        ],
      }
    }
    // Detectar carboidratos/comida
    const carbsMatch = text.match(/(\d+)\s*(g|grama|carb)/i) || text.match(/carb.*?(\d+)/i)
    console.log('Carbs match result:', carbsMatch)
    if (carbsMatch && !directResponse) {
      const carbs = parseInt(carbsMatch[1])
      console.log('Detected CARBS - Value:', carbs)
      const mealDose = Math.round((carbs / settings.carbRatio) * 10) / 10

      directResponse = {
        response: `✅ Carboidratos registrados: ${carbs}g. Dose sugerida: ${mealDose}U de insulina.`,
        actions: [
          { type: 'save_food', data: { items: [{ name: 'Refeição', carbs }], totalCarbs: carbs, mealType: 'lunch', note: text.substring(0, 50) } },
        ],
      }
    }

    // Se detectou algo diretamente, retorna sem chamar API
    if (directResponse) {
      console.log('=== DIRECT RESPONSE - SKIPPING AI ===')
      console.log('Response:', directResponse.response)
      return NextResponse.json({
        success: true,
        data: {
          response: directResponse.response,
          actions: directResponse.actions,
          timestamp: new Date().toISOString(),
        },
      })
    }

    console.log('=== NO DIRECT MATCH - CALLING AI ===')

    // SEGUNDO: Se não detectou nada direto, chama a IA para responder perguntas
    const systemPrompt = `Você é um assistente de diabetes. Responda de forma DIRETA e ÚTIL.

DADOS DO USUÁRIO:
- Alvo: ${settings.targetGlucose} mg/dL | Fator: ${settings.correctionFactor} | CarbRatio: ${settings.carbRatio}g/U
- Última glicose: ${lastGlucose ? lastGlucose.value + ' mg/dL' : 'Nenhuma registrada'}
- Média: ${Math.round(stats.average)} mg/dL | Tendência: ${trend.direction === 'up' ? '↗ subindo' : trend.direction === 'down' ? '↘ descendo' : '→ estável'}

REGRAS:
1. Responda em 1-2 frases no máximo. Seja direto.
2. Se perguntarem sobre cálculos, explique a fórmula: (glicose - alvo) / fator
3. NÃO peça para registrar - apenas responda a pergunta
4. Se glicose > 250, alerte sobre risco. Se < 70, alerte sobre hipoglicemia.
5. Use emojis com moderação: ✅ ✉️ ⚠️

EXEMPLO DE RESPOSTA:
User: "qual minha dose pra 200 de glicose?"
Assistant: "Para 200 mg/dL: (200 - ${settings.targetGlucose}) / ${settings.correctionFactor} = ${(200 - settings.targetGlucose) / settings.correctionFactor}U de correção."`

    const msgs: ChatMessage[] = messages || [{ role: 'user' as const, content: messageText }]

    const response = await fetch(NVIDIA_NIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...msgs.slice(-10)
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    console.log('NVIDIA API Response status:', response.status)
    console.log('NVIDIA API Key present:', !!process.env.NVIDIA_NIM_API_KEY)
    console.log('NVIDIA API Key starts with:', process.env.NVIDIA_NIM_API_KEY?.substring(0, 10) + '...')

    if (!response.ok) {
      const errorData = await response.text()
      console.error('NVIDIA API Error:', response.status, errorData)

      // Fallback amistoso
      return NextResponse.json({
        success: true,
        data: {
          response: "Não consegui conectar ao servidor. Para registrar glicose, diga 'glicose 120' ou 'registre 150 de glicose'. Para insulina, diga 'tomei 2 unidades'.",
          actions: [],
          timestamp: new Date().toISOString(),
        },
      })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'Não entendi. Pode reformular?'

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse,
        actions: [],
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}