import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/storage'
import { getGlucoseStatusLabel } from '@/lib/types'

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
  id: string                         // ID determinístico para auditabilidade
  type: 'glucose_event' | 'food_event' | 'insulin_event' | 'insulin_context'
  version: string                    // Versão do schema (ex: "1.0.0")
  source: 'client' | 'server'        // Origem do evento
  value?: number
  items?: string[]
  description?: string
  insulin?: number
  dose?: number
  context?: string
  meal?: string
  order: number                      // Ordem para associação (ex: insulina -> glicose)
  timestamp: string
  refs?: Record<string, string>      // Referências para outros eventos
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

    // Extrair TODAS as glicoses do texto - SEM DUPLICATAS
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
      let match: RegExpExecArray | null
      while ((match = pattern.exec(message)) !== null) {
        const value = parseInt(match[1], 10)
        if (value >= 20 && value <= 600) {
          // Verificar duplicata por posição E valor
          const exists = allGlucoseMatches.some(m => m.value === value && Math.abs(m.index - match!.index) < 20)
          if (!exists) {
            allGlucoseMatches.push({ value, context, index: match.index })
          }
        }
      }
    }

    // Padrão específico: "estava em XXX mg/dL" - captura glicose com contexto
    const estavaPattern = /(?:estava|ficava|medi)\s+(?:novamente\s+)?(?:e\s+)?(?:estava\s+)?(?:em\s+)?(\d{2,3})\s*(?:mg\/dl)?/gi
    let matchEstava: RegExpExecArray | null
    while ((matchEstava = estavaPattern.exec(message)) !== null) {
      const value = parseInt(matchEstava[1], 10)
      if (value >= 20 && value <= 600) {
        const exists = allGlucoseMatches.some(m => m.value === value && Math.abs(m.index - matchEstava!.index) < 20)
        if (!exists) {
          // Determinar contexto pelo texto anterior
          const beforeText = message.substring(0, matchEstava.index).toLowerCase()
          let ctx = ''
          if (beforeText.includes('depois') || beforeText.includes('apos')) ctx = 'after_meal'
          else if (beforeText.includes('antes')) ctx = 'before_meal'
          else if (beforeText.includes('jejum') || beforeText.includes('acordar')) ctx = 'fasting'

          if (ctx) {
            allGlucoseMatches.push({ value, context: ctx, index: matchEstava.index })
          }
        }
      }
    }

    // Padroes gerais de glicose (fallback)
    for (const pattern of glucosePatterns) {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(message)) !== null) {
        const value = parseInt(match[1], 10)
        if (value >= 20 && value <= 600) {
          // Verificar duplicata por posição E valor (tolerância maior)
          const exists = allGlucoseMatches.some(m => m.value === value && Math.abs(m.index - match!.index) < 20)
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

    const eventTimestamp = new Date().toISOString()
    const eventSource: 'client' | 'server' = 'server'
    const eventVersion = '1.0.0'

    for (const { value, context: ctx, index } of allGlucoseMatches) {
      eventOrder++
      events.push({
        id: `glucose-${Date.now()}-${eventOrder}`,
        type: 'glucose_event',
        version: eventVersion,
        source: eventSource,
        value,
        context: ctx || undefined,
        order: eventOrder,
        timestamp: eventTimestamp
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
      'pedacos', 'pedaço', 'pedaços', 'fatia', 'fatias', 'copo', 'copos', 'xicara', 'xícaras',
      'pacote', 'pacotinho', 'colher', 'colheres', 'chá', 'chazinho', 'sopa', 'canela'
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

    // Segmentar texto por marcadores de refeição - CAPTURAR APENAS ITENS
    // O texto pode ter formato: "No café da manhã eu consumi:\n\n2 pães..."
    // Ou: "No almoço eu consumi:\n\n3 pedaços de frango..."
    const mealSegmentPatterns = [
      // Café da manhã: captura ТОДОС o texto após "café" até próximo marcador
      { pattern: /(?:no\s+)?(?:cafe|café|café da manhã|cafe da manha)\s+(?:eu\s+)?(?:consumi|comi)\s*:?[\s\n]*([\s\S]+?)(?=\bno\s+almoço|\bno\s+almoco|\bantes\s+do\s+almoço|\bapos\s+o\s+almoço|\bdepois\s+do\s+almoço|\balmoco|almoço|janta|jantar|$)/gi, meal: 'breakfast' },
      // Almoço: captura ТОДОС o texto após "almoço" até "depois do almoço"
      { pattern: /(?:no\s+)?(?:almoco|almoço)\s+(?:eu\s+)?(?:consumi|comi)\s*:?[\s\n]*([\s\S]+?)(?=\bdepois\s+do\s+almoço|\bapos\s+o\s+almoço|\bno\s+jantar|\bjanta|$)/gi, meal: 'lunch' },
      // Lanche pós-almoço: com "comi" ou "consumi"
      { pattern: /(?:depois\s+do\s+almoço|apos\s+o\s+almoço)\s+(?:eu\s+)?(?:comi|consumi)\s*:?[\s\n]*([\s\S]+?)(?=\bno\s+jantar|\bjanta|$)/gi, meal: 'snack' },
      // Jantar: captura até fim
      { pattern: /(?:janta|jantar)\s+(?:eu\s+)?(?:consumi|comi)\s*:?[\s\n]*([\s\S]+?)(?=$)/gi, meal: 'dinner' },
    ]

    const allFoods: { items: string[]; meal: string; carbs: number; description: string; insulin?: number }[] = []

    console.log('[STREAM DE EVENTOS] Iniciando extração de alimentos...')
    console.log('[STREAM DE EVENTOS] Mensagem:', message.substring(0, 300))

    for (const { pattern, meal } of mealSegmentPatterns) {
      let match
      while ((match = pattern.exec(message)) !== null) {
        let segment = match[1].trim()

        console.log('[STREAM DE EVENTOS] Match encontrado:', meal, 'segment bruto:', segment)

        // Extrair insulina do segmento (padrão: "(8 unidades de insulina)")
        const segmentInsulinMatch = segment.match(/\((\d+(?:\.\d+)?)\s*(?:unidades|u|ui)\s*(?:de\s*)?(?:insulina|correcao|correção)?\)/i)
        const segmentInsulin = segmentInsulinMatch ? parseFloat(segmentInsulinMatch[1]) : undefined

        if (segmentInsulin) {
          console.log('[STREAM DE EVENTOS] Insulina detectada no segmento:', segmentInsulin, 'U')
        }

        // Limpar segmento: remover prefixos
        segment = segment.replace(/^(?:da\s+manhã|da\s+manha|da\s+tarde|da\s+noite|do\s+almoço|do\s+café|do\s+cafe)\s+/i, '')
        segment = segment.replace(/^(?:eu\s+)?(comi|consumi)\s*[:\-]?\s*/i, '')
        segment = segment.replace(/^no\s+(?:café|cafe|almoço|almoco|janta|jantar)\s+/i, '')
        segment = segment.replace(/^depois\s+do\s+almoço\s+/i, '')
        segment = segment.replace(/^apos\s+o\s+almoço\s+/i, '')

        // Limpar segmento: remover texto após palavras de contexto indesejado
        segment = segment.replace(/\s*(?:no\s+total|antes\s+de|depois\s+de|quero\s+que|como\s+está|minha\s+evolução|se\s+preciso|sobre\s+correcao|sobre\s+correção).*$/i, '')
        // Remover insulina entre parênteses do segmento de descrição
        segment = segment.replace(/\s*\(\d+(?:\.\d+)?\s*(?:unidades|u|ui)\s*(?:de\s*)?(?:insulina|correcao|correção)?\)/g, '')
        segment = segment.replace(/^-+\s*/g, '') // remover bullets no início
        segment = segment.replace(/\n+/g, ' ') // substituir newlines por espaço
        segment = segment.replace(/\s+/g, ' ') // normalizar espaços

        console.log('[STREAM DE EVENTOS] Segment limpo:', segment)

        // Se segmento for muito pequeno (< 3 chars), ignorar
        if (segment.length < 3) {
          console.log('[STREAM DE EVENTOS] Segmento muito curto, ignorando')
          continue
        }

        const foodsInSegment = foodKeywords.filter(kw => {
          const found = segment.toLowerCase().includes(kw)
          if (found) console.log('[STREAM DE EVENTOS] Keyword encontrada:', kw)
          return found
        }).filter(f => !excludeWords.includes(f))

        if (foodsInSegment.length > 0) {
          const uniqueFoods = [...new Set(foodsInSegment)]
          const carbs = estimateCarbs(uniqueFoods, segment)
          // Salvar descrição COMPLETA da refeição (texto bruto limpo)
          const description = segment
          allFoods.push({ items: uniqueFoods, meal, carbs, description, insulin: segmentInsulin })
          console.log('[STREAM DE EVENTOS] Refeição detectada:', meal, 'alimentos:', uniqueFoods, 'carbs:', carbs, 'insulina:', segmentInsulin, 'descricao:', description)
        } else {
          console.log('[STREAM DE EVENTOS] Refeição SEM alimentos detectados:', meal, 'segment:', segment)
        }
      }
    }

    // Criar eventos de alimento (e insulina associada se existir)
    for (const { items, meal, carbs, description, insulin } of allFoods) {
      eventOrder++
      events.push({
        id: `food-${Date.now()}-${eventOrder}`,
        type: 'food_event',
        version: eventVersion,
        source: eventSource,
        items,
        description,
        meal,
        insulin,
        order: eventOrder,
        timestamp: eventTimestamp
      })

      // Se tem insulina associada, cria evento separado de insulina
      if (insulin && insulin > 0) {
        eventOrder++
        events.push({
          id: `insulin-${Date.now()}-${eventOrder}`,
          type: 'insulin_event',
          version: eventVersion,
          source: eventSource,
          dose: insulin,
          meal,
          order: eventOrder,
          timestamp: eventTimestamp
        })
        console.log('[STREAM DE EVENTOS] Evento de insulina criado:', insulin, 'U para', meal)
      }
    }

    // ============================================
    // 3. EXTRATOR DE INSULINA EXPLÍCITA DOS ALIMENTOS
    // ============================================
    // Formato: "2 copos de café (8 unidades de insulina)" ou "(8 unidades de insulina)"
    const insulinInFoodPattern = /\((\d+(?:\.\d+)?)\s*(?:unidades|u|ui)\s*(?:de\s*)?(?:insulina|correcao|correção)?\)/gi
    const explicitInsulins: { dose: number; context: string }[] = []

    let matchInsulin
    while ((matchInsulin = insulinInFoodPattern.exec(message)) !== null) {
      const dose = parseFloat(matchInsulin[1])
      console.log('[MOTOR DE DADOS] Insulina no texto detectada:', dose, 'U')
      explicitInsulins.push({ dose, context: 'meal' })
    }

    // Também buscar padrões soltos de insulina
    let explicitInsulin: number | null = null
    const insulinPatterns = [
      /tomei\s*(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)/i,
      /apliquei\s*(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)/i,
      /(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)\s+(?:para\s+)?(?:esse|essa|o|a|correcao|correção|pos|apos|antes|pre)/i,
      /(\d+(?:\.\d+)?)\s*(?:unidades|u|ui)\s*(?:de\s*)?(?:insulina|correção|correao)/i,
      /insulina\s*(\d+(?:\.\d+)?)\s*(?:unidades|u)?/i,
    ]

    console.log('[MOTOR DE DADOS] Buscando insulina explícita na mensagem:', message.substring(0, 200))

    for (const pattern of insulinPatterns) {
      const match = message.match(pattern)
      console.log('[MOTOR DE DADOS] Testando pattern:', pattern.toString(), 'match:', match)
      if (match) {
        const captured = match[1] || match[2]
        explicitInsulin = parseFloat(captured)
        console.log('[MOTOR DE DADOS] Insulina explícita detectada:', explicitInsulin, 'pattern:', pattern.toString())
        break
      }
    }

    console.log('[MOTOR DE DADOS] Insulinas encontradas:', explicitInsulins.length, 'explícita:', explicitInsulin)

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
    // 5. CALCULAR INSULINA (SEMPRE QUE HAVER GLICOSE > 150)
    // ============================================
    // Calcular automaticamente quando glicose > 150 mg/dL
    // Usuário pode dizer "não quero correção" para ignorar
    const insulinBlockPatterns = [
      /não\s+quero\s+(?:correcao|correção|insulina)/i,
      /nao\s+quero\s+(?:correcao|correção|insulina)/i,
      /sem\s+(?:correcao|correção|insulina)/i,
      /não\s+preciso\s+de\s+(?:insulina|correcao|correção)/i,
    ]

    const isInsulinBlocked = insulinBlockPatterns.some(p => p.test(message))

    // Apenas calcular se glicose > 150 e usuário não bloqueou
    if (glucoseValue && glucoseValue > 150 && !isInsulinBlocked) {
      const correction = calculateInsulinCorrection(glucoseValue, settings.targetGlucose, settings.correctionFactor)

      let mealInsulin = 0
      if (carbsEstimate && carbsEstimate > 0) {
        mealInsulin = Math.round(carbsEstimate / settings.carbRatio)
      }

      const total = correction + mealInsulin

      // Apenas registrar se total >= 1.5U (arredonda para 2U)
      if (total >= 1.5) {
        const roundedTotal = Math.round(total) // 1.5 → 2, 2.3 → 2, 2.7 → 3
        event.insulin = {
          correction,
          meal: mealInsulin,
          total: roundedTotal
        }
        event.actions.push('calculate_dose')
        console.log('[MOTOR DE DADOS] Insulina calculada:', roundedTotal, 'U (total:', total, ')')
      } else {
        console.log('[MOTOR DE DADOS] Insulina NÃO registrada - total', total, 'U < 1.5U')
      }
    } else if (isInsulinBlocked) {
      console.log('[MOTOR DE DADOS] Insulina bloqueada pelo usuário')
    } else if (glucoseValue && glucoseValue <= 150) {
      console.log('[MOTOR DE DADOS] Insulina NÃO calculada - glicose', glucoseValue, '<= 150')
    } else if (!glucoseValue) {
      console.log('[MOTOR DE DADOS] Insulina NÃO calculada - sem glicose')
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
    // 6. RETORNAR EVENTO - SEM PERSISTIR DADOS
    // ============================================
    // O servidor APENAS interpreta input e retorna eventos
    // A persistencia é responsabilidade EXCLUSIVA do cliente (chat/page.tsx)

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
    // 8. RETORNAR EVENTO + RESPOSTA
    // ============================================
    return NextResponse.json({
      success: true,
      event,
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