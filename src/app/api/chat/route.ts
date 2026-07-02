import { NextRequest, NextResponse } from 'next/server'
import { saveGlucose, saveFood, saveInsulin, getSettings, getGlucoseEntries } from '@/lib/storage'
import { GLUCOSE_STATUS, getGlucoseStatus, getGlucoseStatusLabel } from '@/lib/types'

/**
 * MOTOR DE DADOS DO GLICOSE AI
 *
 * Fluxo obrigatório:
 * 1. Interpretar texto
 * 2. Extrair dados médicos
 * 3. Criar JSON estruturado (EVENTO)
 * 4. Enviar para API do site (/api/*)
 * 5. Atualizar dashboard automaticamente
 * 6. Retornar resposta curta ao usuário
 */

interface ChatEvent {
  event_type: 'user_input'
  actions: string[]
  data: {
    glucose?: number
    context?: string
    meal?: string[]
    carbs_estimate?: number
  }
  insulin?: {
    correction: number
    meal: number
    total: number
  }
  ui_update: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, settings: clientSettings } = body

    console.log('[MOTOR DE DADOS] Mensagem recebida:', message)

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    const text = message.toLowerCase()
    const settings = clientSettings || getSettings()

    // ============================================
    // 1. EXTRATOR DE GLICOSE
    // ============================================
    const glucosePatterns = [
      /glicose\s*[:\-]?\s*(\d{2,3})/i,
      /glicemia\s*[:\-]?\s*(\d{2,3})/i,
      /(?: đo|medir|medi)\s*(?:de\s*)?(?:glicose|glicemia)?\s*(\d{2,3})/i,
      /(\d{2,3})\s*(?:de\s*)?glicose/i,
      /(\d{2,3})\s*(?:de\s*)?glicemia/i,
      /(\d{2,3})\s*mg/i,
      /pra\s*(\d{2,3})\s*(?:de\s*)?glicose/i,
    ]

    let glucoseValue: number | null = null
    for (const pattern of glucosePatterns) {
      const match = message.match(pattern)
      if (match) {
        glucoseValue = parseInt(match[1], 10)
        console.log('[MOTOR DE DADOS] Glicose detectada:', glucoseValue, 'pattern:', pattern.toString())
        if (glucoseValue >= 20 && glucoseValue <= 600) break
      }
    }

    // ============================================
    // 2. EXTRATOR DE CONTEXTO
    // ============================================
    let context: string | undefined = undefined

    if (text.includes('acordar') || text.includes('acordei') || text.includes('jejum') || text.includes('manhã') || text.includes('manha')) {
      context = 'fasting'
    } else if (text.includes('antes') && (text.includes('refeição') || text.includes('comer') || text.includes('almoço') || text.includes('janta') || text.includes('café'))) {
      context = 'before_meal'
    } else if (text.includes('depois') || text.includes('após') || text.includes('apos') || text.includes('pós') || text.includes('pos')) {
      context = 'after_meal'
    } else if (text.includes('dormir') || text.includes('cama') || text.includes('noite')) {
      context = 'bedtime'
    } else if (text.includes('exercício') || text.includes('exercicio') || text.includes('treino') || text.includes('academia')) {
      context = 'exercise'
    } else if (text.includes('almoço') || text.includes('almoçando') || text.includes('almocando')) {
      context = 'lunch'
    } else if (text.includes('janta') || text.includes('jantar')) {
      context = 'dinner'
    } else if (text.includes('café') || text.includes('cafe') || text.includes('desjejum')) {
      context = 'breakfast'
    }

    // ============================================
    // 3. EXTRATOR DE ALIMENTOS
    // ============================================
    const foodKeywords = [
      'arroz', 'feijão', 'feijao', 'carne', 'frango', 'peixe', 'ovo', 'ovos',
      'salada', 'verdura', 'legume', 'fruta', 'banana', 'maçã', 'maca', 'laranja',
      'pão', 'pao', 'paozinho', 'paozito', 'paosinho', 'paocinho', 'paodequeijo', 'pão de queijo',
      'queijo', 'presunto', 'mussarela', 'muzzlearela',
      'macarrão', 'macarrao', 'espaguete', 'lasanha',
      'batata', 'mandioca', 'aipim', 'macaxeira',
      'bolacha', 'biscoito', 'bolacha', 'torrada',
      ' bolo', 'bolo', 'torta', 'doce', 'açucar', 'acucar', 'chocolate',
      'café', 'cafe', 'leite', 'suco', 'refrigerante', 'refri', 'cerveja', 'vinho',
      'pizza', 'hamburguer', 'hambúrguer', 'lanche', 'sanduiche', 'sanduíche',
      'feijoada', 'churrasco', 'หอมหม้อ', 'кори', 'tapioca', 'mingau'
    ]

    const mealPattern = /(?:comi|comedo|almocar|almocei|jantei|jantar|lanchei|lanchonete| Breakfast|cafe|café|comida|refeição|refeicao|aliment(?:ação|acao)|comeu|mastigar|degust(?:e|i|ar))\s*(?:de)?\s*(.+)/i
    const mealMatch = message.match(mealPattern)

    let foods: string[] = []
    let carbsEstimate: number | undefined = undefined

    if (mealMatch) {
      const foodText = mealMatch[1].toLowerCase()
      foods = foodKeywords.filter(kw => foodText.includes(kw))

      if (foods.length === 0) {
        foods = foodText.split(/[\s,]+/).filter(w => w.length > 2).slice(0, 5)
      }

      carbsEstimate = estimateCarbs(foods)
    }

    // ============================================
    // 4. MONTAR EVENTO ESTRUTURADO
    // ============================================
    const event: ChatEvent = {
      event_type: 'user_input',
      actions: [],
      data: {
        context
      },
      ui_update: true
    }

    if (glucoseValue) {
      event.data.glucose = glucoseValue
      event.actions.push('save_glucose')
    }

    if (foods.length > 0) {
      event.data.meal = foods
      event.data.carbs_estimate = carbsEstimate
      event.actions.push('save_food')
    }

    // ============================================
    // 5. CALCULAR INSULINA (SE GLICOSE FOR FORNECIDA)
    // ============================================
    if (glucoseValue) {
      const correction = calculateInsulinCorrection(glucoseValue, settings.targetGlucose, settings.correctionFactor)

      let mealInsulin = 0
      if (carbsEstimate && carbsEstimate > 0) {
        mealInsulin = Math.round(carbsEstimate / settings.carbRatio)
      }

      const total = correction + mealInsulin

      if (total > 0) {
        event.insulin = {
          correction,
          meal: mealInsulin,
          total
        }
        event.actions.push('calculate_dose')
      }
    }

    // ============================================
    // 6. SALVAR DADOS NO STORAGE
    // ============================================
    const savedData: Record<string, unknown> = {}

    if (glucoseValue) {
      savedData.glucose = saveGlucose({
        value: glucoseValue,
        timestamp: new Date().toISOString(),
        context: context as any,
        note: message
      })
    }

    if (foods.length > 0) {
      savedData.food = saveFood({
        items: foods.map(name => ({ name, carbs: Math.round(carbsEstimate! / foods.length) })),
        totalCarbs: carbsEstimate || 0,
        timestamp: new Date().toISOString(),
        mealType: mapContextToMealType(context)
      })
    }

    if (event.insulin && event.insulin.total > 0) {
      savedData.insulin = saveInsulin({
        correction: event.insulin.correction,
        meal: event.insulin.meal,
        total: event.insulin.total,
        timestamp: new Date().toISOString(),
        glucoseValue: glucoseValue || undefined,
        note: message
      })
    }

    // ============================================
    // 7. LOG DO EVENTO
    // ============================================
    console.log('[MOTOR DE DADOS] Evento processado:', JSON.stringify(event, null, 2))
    console.log('[MOTOR DE DADOS] Dados salvos:', savedData)

    // ============================================
    // 8. GERAR RESPOSTA CURTA
    // ============================================
    let response = ''

    if (glucoseValue) {
      const status = getGlucoseStatusLabel(glucoseValue)
      if (event.insulin && event.insulin.total > 0) {
        response = `✔ Glicose ${glucoseValue} registrada. Dose sugerida: ${event.insulin.total}U.`
      } else {
        response = `✔ Glicose ${glucoseValue} registrada. Status: ${status}.`
      }
    }

    if (foods.length > 0) {
      if (response) response += ' '
      response += `✔ Refeição salva: ${foods.slice(0, 3).join(', ')}${foods.length > 3 ? '...' : ''}. ${carbsEstimate}g de carboidratos.`
    }

    if (!response) {
      response = '✔ Mensagem recebida. Como posso ajudar?'
    }

    console.log('[MOTOR DE DADOS] Resposta:', response)
    console.log('[MOTOR DE DADOS] actions array:', event.actions, 'length:', event.actions.length)

    // ============================================
    // 9. RETORNAR EVENTO + RESPOSTA
    // ============================================
    return NextResponse.json({
      success: true,
      event,
      saved: savedData,
      response
    })

  } catch (error) {
    console.error('[MOTOR DE DADOS] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar mensagem',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calculateInsulinCorrection(glucose: number, target: number, factor: number): number {
  if (glucose <= target) return 0
  const correction = (glucose - target) / factor
  return Math.round(correction * 2) / 2
}

function estimateCarbs(foods: string[]): number {
  const carbTable: Record<string, number> = {
    arroz: 28, feijao: 14, feijão: 14,
    carne: 0, frango: 0, peixe: 0, ovo: 1, ovos: 1,
    salada: 5, verdura: 5, legume: 8,
    banana: 23, maçã: 14, maca: 14, laranja: 12,
    pao: 15, pão: 15, paozinho: 15, paozito: 15, paosinho: 15, paocinho: 15, paodequeijo: 15,
    queijo: 2, presunto: 2, mussarela: 2, muzzlearela: 2,
    macarrao: 30, macarrão: 30, espaguete: 30, lasanha: 35,
    batata: 17, mandioca: 25, aipim: 25, macaxeira: 25,
    bolacha: 15, biscoito: 15, torrada: 15,
    bolo: 35, torta: 30, doce: 20, acucar: 15, açúcar: 15, chocolate: 25,
    cafe: 0, café: 0, leite: 12, suco: 15, refrigerante: 35, refri: 35, cerveja: 10, vinho: 5,
    pizza: 35, hamburguer: 25, hambúrguer: 25, lanche: 30, sanduiche: 30, sanduíche: 30,
    feijoada: 40, churrasco: 5, tapioca: 35, mingau: 25
  }

  let total = 0
  for (const food of foods) {
    const normalized = food.toLowerCase().trim()
    total += carbTable[normalized] || 15
  }
  return total
}

function mapContextToMealType(context?: string): any {
  const map: Record<string, any> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    fasting: 'breakfast',
    before_meal: 'before_meal',
    after_meal: 'after_meal',
    bedtime: 'night_snack',
    exercise: 'other',
    other: 'other'
  }
  return context ? map[context] || 'other' : undefined
}