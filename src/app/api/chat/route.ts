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
    // 1. EXTRATOR DE GLICOSE - REVISADO
    // ============================================
    const glucosePatterns = [
      /glicose\s*[:\-]?\s*(\d{2,3})/i,
      /glicemia\s*[:\-]?\s*(\d{2,3})/i,
      /(?: med(?:ir|i))\s*(?:de\s*)?(?:glicose|glicemia)?\s*(\d{2,3})/i,
      /(\d{2,3})\s*(?:de\s*)?glicose/i,
      /(\d{2,3})\s*(?:de\s*)?glicemia/i,
      /(\d{2,3})\s*mg(?:\/dl)?/i,
      /pra\s*(\d{2,3})\s*(?:de\s*)?glicose/i,
      // Padrão: "antes do almoco: 183" ou "apos cafe: 200"
      /(?:antes|depois|apos|pos|em jejum|jejum)\s+(?:do|da|de)?\s*(?:almoco|almoço|cafe|café|janta|jantar|refeicao|refeição)\s*[:\-]?\s*(\d{2,3})/i,
      // Padrão: número no final da frase após contexto
      /(?:ao\s+acordar|antes\s+do|depois\s+do|apos\s+o|em\s+jejum)\s+(?:.*?)(\d{2,3})\s*(?:mg|mg\/dl)?$/i,
      // Padrão simples: apenas número seguido de contexto
      /^(\d{2,3})\s+(?:ao\s+acordar|antes\s+|apos\s+|depois\s+|em\s+jejum|jejum)/i,
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

    // Prioridade: contextos compostos primeiro
    if (text.includes('antes') && (text.includes('almoço') || text.includes('almoco') || text.includes('janta') || text.includes('jantar') || text.includes('café') || text.includes('cafe') || text.includes('refeição') || text.includes('refeicao') || text.includes('comer'))) {
      context = 'before_meal'
    } else if (text.includes('depois') || text.includes('após') || text.includes('apos') || text.includes('pós') || text.includes('pos')) {
      context = 'after_meal'
    } else if (text.includes('acordar') || text.includes('acordei') || text.includes('jejum')) {
      context = 'fasting'
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
    } else if (text.includes('manhã') || text.includes('manha')) {
      context = 'breakfast'
    }

    // ============================================
    // 3. EXTRATOR DE ALIMENTOS - REVISADO
    // ============================================

    // Palavras-chave de alimentos VALIDAS
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

    // Palavras para EXCLUIR (não são alimentos)
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

    // Padrões que indicam descrição de refeição
    const mealPatterns = [
      /(?:comi|comedo|almocar|almocei|jantei|jantar|lanchei|cafetei|café da manhã|cafe da manha)\s+(.+)/i,
      /(?:tomei|bebi|consume|consumi)\s+(.+)/i,
      /(?:para|no|do|da)\s+(?:cafe|café|almoco|almoço|janta|jantar|lanche)\s*[:\-]?\s*(.+)/i,
    ]

    let foods: string[] = []
    let carbsEstimate: number | undefined = undefined

    // Tentar capturar descrição de refeição
    let mealText = ''
    for (const pattern of mealPatterns) {
      const match = message.match(pattern)
      if (match) {
        mealText = match[1].toLowerCase()
        console.log('[MOTOR DE DADOS] Texto de alimento capturado:', mealText)
        break
      }
    }

    if (mealText) {
      // Extrair palavras-chave de alimentos do texto
      foods = foodKeywords.filter(kw => mealText.includes(kw))

      // Filtrar palavras excluídas
      foods = foods.filter(f => !excludeWords.includes(f))

      // Remover duplicatas
      foods = [...new Set(foods)]

      // Se não encontrou keywords, tenta extrair substantivos
      if (foods.length === 0) {
        const candidates = mealText
          .replace(/[.,:;]/g, ' ')
          .split(/[\s]+/)
          .filter(w => w.length > 3 && !excludeWords.includes(w) && !/^\d+$/.test(w))
        foods = candidates.slice(0, 5)
      }

      if (foods.length > 0) {
        carbsEstimate = estimateCarbs(foods, mealText)
        console.log('[MOTOR DE DADOS] Alimentos detectados:', foods, 'carbs:', carbsEstimate)
      }
    }

    // ============================================
    // 3.5. EXTRATOR DE INSULINA EXPLÍCITA
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