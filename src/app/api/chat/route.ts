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

/**
 * STREAM DE EVENTOS CLÍNICOS
 * Cada input do usuário pode gerar múltiplos eventos independentes
 */
interface ClinicalEvent {
  type: 'glucose_event' | 'food_event' | 'insulin_context'
  value?: number
  items?: string[]
  description?: string
  context?: string
  meal?: string
  order: number
  timestamp?: string
}

interface EventStream {
  events: ClinicalEvent[]
  summary: string
}

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
  stream?: EventStream
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
    // 1. STREAM DE EVENTOS - EXTRACAO MULTIPLA
    // ============================================
    const events: ClinicalEvent[] = []
    let eventOrder = 0

    // ============================================
    // 1A. EXTRATOR DE GLICOSE - STREAM COMPLETO
    // ============================================
    const glucosePatterns = [
      /glicose\s*[:\-]?\s*(\d{2,3})/gi,
      /glicemia\s*[:\-]?\s*(\d{2,3})/gi,
      /(?: med(?:ir|i))\s*(?:de\s*)?(?:glicose|glicemia)?\s*(\d{2,3})/gi,
      /(\d{2,3})\s*(?:de\s*)?glicose/gi,
      /(\d{2,3})\s*(?:de\s*)?glicemia/gi,
      /(\d{2,3})\s*mg(?:\/dl)?/gi,
      /pra\s*(\d{2,3})\s*(?:de\s*)?glicose/gi,
      /(?:antes|depois|apos|pos|em jejum|jejum)\s+(?:do|da|de)?\s*(?:almoco|almoço|cafe|café|janta|jantar|refeicao|refeição)\s*[:\-]?\s*(\d{2,3})/gi,
      /(?:apos|depois)\s+(?:o|a|os|as)?\s*(?:cafe|café|almoco|almoço|janta|jantar)\s+(?:da|do|de)?\s*(manha|manhã|tarde|noite)?\s*[:\-]?\s*(\d{2,3})/gi,
      /(?:ao\s+acordar|antes\s+do|depois\s+do|apos\s+o|em\s+jejum)\s+(?:.*?)(\d{2,3})\s*(?:mg|mg\/dl)?$/gim,
      /^(\d{2,3})\s+(?:ao\s+acordar|antes\s+|apos\s+|depois\s+|em\s+jejum|jejum)/gim,
      /\b(?:ao\s+acordar|antes\s+.*|apos\s+.*|depois\s+.*|em\s+jejum|jejum)\s*[:\-.]?\s*(\d{3})\b/gi,
    ]

    // Extrair TODAS as glicoses do texto
    const allGlucoseMatches: { value: number; context: string; index: number }[] = []

    // Padroes com contexto
    const contextGlucosePatterns = [
      { pattern: /(?:antes\s+(?:do|da|de)\s*(?:almoco|almoço|janta|jantar|cafe|café|refeicao|refeição))\s*[:\-]?\s*(\d{2,3})/gi, context: 'before_meal' },
      { pattern: /(?:depois\s+(?:do|da|de)\s*(?:almoco|almoço|janta|jantar|cafe|café|refeicao|refeição))\s*[:\-]?\s*(\d{2,3})/gi, context: 'after_meal' },
      { pattern: /(?:apos\s+(?:o|a|os|as)\s*(?:almoco|almoço|janta|jantar|cafe|café))\s*[:\-]?\s*(\d{2,3})/gi, context: 'after_meal' },
      { pattern: /(?:ao\s+acordar|em\s+jejum|jejum)\s*[:\-]?\s*(\d{2,3})/gi, context: 'fasting' },
      { pattern: /(?:antes\s+de\s+dormir|ao\s+dormir)\s*[:\-]?\s*(\d{2,3})/gi, context: 'bedtime' },
    ]

    for (const { pattern, context } of contextGlucosePatterns) {
      let match
      while ((match = pattern.exec(message)) !== null) {
        const value = parseInt(match[1], 10)
        if (value >= 20 && value <= 600) {
          allGlucoseMatches.push({ value, context, index: match.index })
        }
      }
    }

    // Padroes gerais de glicose
    for (const pattern of glucosePatterns) {
      let match
      while ((match = pattern.exec(message)) !== null) {
        const value = parseInt(match[1], 10)
        if (value >= 20 && value <= 600) {
          // Verificar se já não foi adicionado
          const exists = allGlucoseMatches.some(m => m.value === value && Math.abs(m.index - match!.index) < 5)
          if (!exists) {
            // Determinar contexto da frase
            const beforeText = message.substring(0, match.index).toLowerCase()
            let ctx = ''

            if (beforeText.includes('antes')) ctx = 'before_meal'
            else if (beforeText.includes('depois') || beforeText.includes('apos')) ctx = 'after_meal'
            else if (beforeText.includes('jejum') || beforeText.includes('acordar')) ctx = 'fasting'
            else if (beforeText.includes('manha') || beforeText.includes('manhã')) ctx = 'breakfast'
            else if (beforeText.includes('tarde')) ctx = 'lunch'
            else if (beforeText.includes('noite')) ctx = 'dinner'

            allGlucoseMatches.push({ value, context: ctx, index: match.index })
          }
        }
      }
    }

    // Ordenar por posição no texto e criar eventos
    allGlucoseMatches.sort((a, b) => a.index - b.index)

    for (const { value, context: ctx, index } of allGlucoseMatches) {
      eventOrder++
      events.push({
        type: 'glucose_event',
        value,
        context: ctx || undefined,
        order: eventOrder,
        timestamp: new Date().toISOString()
      })
      console.log('[STREAM DE EVENTOS] Glicose detectada:', value, 'contexto:', ctx, 'ordem:', eventOrder)
    }

    // ============================================
    // 2. EXTRATOR DE ALIMENTOS - STREAM COMPLETO
    // ============================================
    const foodKeywords = [
      'arroz', 'feijão', 'feijao', 'carne', 'frango', 'peixe', 'ovo', 'ovos',
      'salada', 'verdura', 'legume', 'fruta', 'banana', 'maçã', 'maca', 'laranja',
      'pão', 'pao', 'paozinho', 'paozito', 'paosinho', 'paocinho', 'paodequeijo', 'pão de queijo',
      'queijo', 'presunto', 'mussarela', 'muzzlearela', 'manteiga', 'requeijao', 'requeijão',
      'macarrão', 'macarrao', 'espaguete', 'lasanha',
      'batata', 'mandioca', 'aipim', 'macaxeira',
      'bolacha', 'biscoito', 'torrada',
      'bolo', 'torta', 'doce', 'açucar', 'acucar', 'chocolate',
      'café', 'cafe', 'leite', 'suco', 'refrigerante', 'refri', 'cerveja', 'vinho',
      'pizza', 'hamburguer', 'hambúrguer', 'lanche', 'sanduiche', 'sanduíche',
      'feijoada', 'churrasco', 'tapioca', 'mingau', 'sopa', 'caldo',
      'pedacos', 'pedaço', 'pedaços', 'fatia', 'fatias', 'copo', 'copos', 'xicara', 'xícaras'
    ]

    const excludeWords = [
      'junto', 'tudo', 'isso', 'aquilo', 'nada', 'mais', 'nao', 'não', 'sim',
      'que', 'com', 'para', 'por', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma',
      'uns', 'umas', 'o', 'a', 'os', 'as', 'e', 'ou', 'mas', 'se', 'na', 'no',
      'manha', 'manhã', 'tarde', 'noite', 'dia', 'hoje', 'ontem', 'amanha',
      'cafe', 'café', 'almoco', 'almoço', 'janta', 'jantar', 'lanche',
      'antes', 'depois', 'apos', 'após', 'pos', 'pós',
      'acordar', 'acordei', 'jejum', 'dormir', 'cama', 'exercício', 'exercicio',
      'glicose', 'glicemia', 'medir', 'medi', 'insulina', 'correcao', 'correção',
      'unidades', 'u', 'ui', 'correea', 'corri'
    ]

    // Segmentar texto por marcadores de refeição
    const mealSegmentPatterns = [
      { pattern: /(?:cafe|café|café da manhã|cafe da manha)\s*[:\-]?\s*(.+?)(?=(?:almoco|almoço|janta|jantar|$))/gi, meal: 'breakfast' },
      { pattern: /(?:almoco|almoço)\s*[:\-]?\s*(.+?)(?=(?:janta|jantar|cafe|café|$))/gi, meal: 'lunch' },
      { pattern: /(?:janta|jantar)\s*[:\-]?\s*(.+?)(?=(?:cafe|café|almoco|almoço|$))/gi, meal: 'dinner' },
      { pattern: /(?:comi|almocei|jantei|lanchiei)\s+(.+?)(?=\.|$)/gi, meal: 'general' },
      { pattern: /(?:tomei|bebi)\s+(.+?)(?=\.|$)/gi, meal: 'general' },
    ]

    const allFoods: { items: string[]; meal: string; carbs: number; description: string }[] = []

    for (const { pattern, meal } of mealSegmentPatterns) {
      let match
      while ((match = pattern.exec(message)) !== null) {
        const segment = match[1].toLowerCase()
        const foodsInSegment = foodKeywords.filter(kw => segment.includes(kw))
          .filter(f => !excludeWords.includes(f))

        if (foodsInSegment.length > 0) {
          const uniqueFoods = [...new Set(foodsInSegment)]
          const carbs = estimateCarbs(uniqueFoods, segment)
          // Salvar descrição COMPLETA da refeição (texto bruto)
          const description = match[1].trim()
          allFoods.push({ items: uniqueFoods, meal, carbs, description })
          console.log('[STREAM DE EVENTOS] Refeição detectada:', meal, 'alimentos:', uniqueFoods, 'carbs:', carbs, 'descricao:', description)
        }
      }
    }

    // Criar eventos de alimento
    for (const { items, meal, carbs, description } of allFoods) {
      eventOrder++
      events.push({
        type: 'food_event',
        items,
        description,
        meal,
        order: eventOrder,
        timestamp: new Date().toISOString()
      })
    }

    // ============================================
    // 3. EXTRATOR DE INSULINA EXPLÍCITA
    // ============================================
    let explicitInsulin: number | null = null
    const insulinPatterns = [
      /tomei\s*(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)/i,
      /apliquei\s*(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)/i,
      /(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)\s*(?:de\s*)?(?:insulina|correção|correao)/i,
      /insulina\s*(\d+(?:\.\d+)?)\s*(?:unidades|u)?/i,
    ]

    for (const pattern of insulinPatterns) {
      const match = message.match(pattern)
      if (match) {
        explicitInsulin = parseFloat(match[1])
        console.log('[MOTOR DE DADOS] Insulina explícita detectada:', explicitInsulin, 'pattern:', pattern.toString())
        break
      }
    }

    // Dados consolidados para calculo (ultima glicose detectada)
    const lastGlucose = events.filter(e => e.type === 'glucose_event').pop()
    const firstFood = events.find(e => e.type === 'food_event')
    const glucoseValue = lastGlucose?.value || null
    const foods = firstFood?.items || []
    const carbsEstimate = firstFood ? (firstFood as any).carbs : undefined
    const foodDescription = firstFood ? (firstFood as any).description : undefined

    // ============================================
    // 4. MONTAR EVENTO ESTRUTURADO COM STREAM
    // ============================================
    const event: ChatEvent = {
      event_type: 'user_input',
      actions: [],
      data: {
        context: lastGlucose?.context
      },
      ui_update: true
    }

    // Adicionar stream de eventos ao evento
    if (events.length > 0) {
      event.stream = {
        events,
        summary: `${events.filter(e => e.type === 'glucose_event').length} glicose(s), ${events.filter(e => e.type === 'food_event').length} refeic(oes)`
      }
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

    // Se usuário mencionou insulina explícita (ex: "tomei 5 unidades")
    if (explicitInsulin && explicitInsulin > 0) {
      event.insulin = {
        correction: explicitInsulin,
        meal: 0,
        total: explicitInsulin
      }
      event.actions.push('save_insulin_dose')
    }

    // ============================================
    // 6. SALVAR DADOS NO STORAGE - STREAM
    // ============================================
    const savedData: Record<string, unknown> = {}
    const savedEvents: any[] = []

    // Salvar TODAS as glicoses detectadas
    for (const evt of events.filter(e => e.type === 'glucose_event')) {
      const saved = saveGlucose({
        value: evt.value!,
        timestamp: evt.timestamp || new Date().toISOString(),
        context: evt.context as any,
        note: message
      })
      savedEvents.push({ type: 'glucose', ...saved })
    }

    if (events.some(e => e.type === 'glucose_event')) {
      savedData.glucose = savedEvents.filter(e => e.type === 'glucose')
    }

    // Salvar TODAS as refeicoes detectadas
    const savedFoods: any[] = []
    for (const evt of events.filter(e => e.type === 'food_event')) {
      const foodEvent = evt as ClinicalEvent & { items: string[], meal: string }
      const totalCarbs = estimateCarbs(foodEvent.items, '')
      const saved = saveFood({
        items: foodEvent.items.map(name => ({ name, carbs: Math.round(totalCarbs / foodEvent.items.length) })),
        totalCarbs,
        timestamp: evt.timestamp || new Date().toISOString(),
        mealType: (foodEvent.meal === 'breakfast' || foodEvent.meal === 'lunch' || foodEvent.meal === 'dinner') ? foodEvent.meal : undefined
      })
      savedFoods.push({ type: 'food', ...saved })
    }

    if (savedFoods.length > 0) {
      savedData.food = savedFoods
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

    const glucoseEvents = events.filter(e => e.type === 'glucose_event')
    const foodEvents = events.filter(e => e.type === 'food_event')

    if (glucoseEvents.length > 0) {
      const lastEvent = glucoseEvents[glucoseEvents.length - 1]
      const status = getGlucoseStatusLabel(lastEvent.value!)
      if (event.insulin && event.insulin.total > 0) {
        response = `✔ ${glucoseEvents.length} glicose(s) registrada(s). Última: ${lastEvent.value} (${status}). Dose sugerida: ${event.insulin.total}U.`
      } else {
        response = `✔ ${glucoseEvents.length} glicose(s) registrada(s). Última: ${lastEvent.value} (${status}).`
      }
    }

    if (foodEvents.length > 0) {
      if (response) response += ' '
      const allFoods = foodEvents.flatMap(e => e.items || [])
      const displayFoods = [...new Set(allFoods)].slice(0, 3)
      response += `✔ ${foodEvents.length} refeic(oes) salva(s): ${displayFoods.join(', ')}${allFoods.length > 3 ? '...' : ''}.`
    }

    if (!response) {
      response = '✔ Mensagem recebida. Como posso ajudar?'
    }

    console.log('[MOTOR DE DADOS] Resposta:', response)
    console.log('[MOTOR DE DADOS] actions array:', event.actions, 'length:', event.actions.length)
    console.log('[MOTOR DE DADOS] Stream de eventos:', events.length, 'eventos:', JSON.stringify(events, null, 2))

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

function estimateCarbs(foods: string[], mealText?: string): number {
  const carbTable: Record<string, number> = {
    arroz: 28, feijao: 14, feijão: 14,
    carne: 0, frango: 0, peixe: 0, ovo: 1, ovos: 1,
    salada: 5, verdura: 5, legume: 8,
    banana: 23, maçã: 14, maca: 14, laranja: 12,
    pao: 15, pão: 15, paozinho: 15, paozito: 15, paosinho: 15, paocinho: 15, paodequeijo: 15,
    queijo: 2, presunto: 2, mussarela: 2, muzzlearela: 2, manteiga: 1, requeijao: 3, requeijão: 3,
    macarrao: 30, macarrão: 30, espaguete: 30, lasanha: 35,
    batata: 17, mandioca: 25, aipim: 25, macaxeira: 25,
    bolacha: 15, biscoito: 15, torrada: 15,
    bolo: 35, torta: 30, doce: 20, acucar: 15, açúcar: 15, chocolate: 25,
    cafe: 0, café: 0, leite: 12, suco: 15, refrigerante: 35, refri: 35, cerveja: 10, vinho: 5,
    pizza: 35, hamburguer: 25, hambúrguer: 25, lanche: 30, sanduiche: 30, sanduíche: 30,
    feijoada: 40, churrasco: 5, tapioca: 35, mingau: 25, sopa: 15, caldo: 12,
    pedacos: 5, pedaço: 5, pedaços: 5, fatia: 10, fatias: 10, copo: 15, copos: 15, xicara: 10, xícaras: 10
  }

  // Verificar se tem quantidades no texto
  const quantityMatch = mealText?.match(/(\d+)\s*(?:pedacos|pedaços|pedaço|fatias|fatia|copos|copo|xicaras|xícaras)/i)
  const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1

  let total = 0
  for (const food of foods) {
    const normalized = food.toLowerCase().trim()
    const baseCarbs = carbTable[normalized] || 15
    total += baseCarbs
  }

  // Se tem quantidade, multiplicar
  if (quantity > 1 && foods.length <= 2) {
    total = total * quantity
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