'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Section, Container } from '@/components/UI'
import {
  getCurrentConversation,
  createConversation,
  addMessage,
  getConversations,
  deleteConversation,
  setCurrentConversationId,
  ChatConversation,
} from '@/lib/chat-storage'
import { saveGlucose, saveFood, saveInsulin } from '@/lib/storage'

// ============================================
// FUNÇÕES AUXILIARES PARA STREAM
// ============================================

function estimateCarbsFromItems(items: string[]): number {
  const carbsMap: Record<string, number> = {
    'arroz': 28, 'feijão': 14, 'feijao': 14, 'carne': 0, 'frango': 0, 'peixe': 0,
    'ovo': 0.6, 'ovos': 1.2, 'pão': 30, 'pao': 30, 'paozinho': 15, 'manteiga': 0.1,
    'café': 0, 'cafe': 0, 'leite': 12, 'açucar': 12, 'acucar': 12, 'suco': 22,
    'banana': 23, 'maçã': 21, 'maca': 21, 'laranja': 21, 'batata': 17,
    'macarrão': 30, 'macarrao': 30, 'salada': 5, 'verdura': 5, 'legume': 10,
    'pizza': 33, 'hamburguer': 30, 'hambúrguer': 30, 'feijoada': 25, 'churrasco': 0,
  }
  const total = items.reduce((sum, item) => {
    const normalized = item.toLowerCase().trim()
    return sum + (carbsMap[normalized] || 15)
  }, 0)
  return Math.round(total)
}

function mapMealType(meal?: string): any {
  if (!meal) return undefined
  const map: Record<string, any> = {
    'breakfast': 'breakfast',
    'lunch': 'lunch',
    'dinner': 'dinner',
    'snack': 'snack',
    'general': undefined
  }
  return map[meal] || undefined
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
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
  stream?: {
    events: ClinicalEvent[]
    summary: string
  }
}

interface ClinicalEvent {
  type: 'glucose_event' | 'food_event' | 'insulin_context'
  value?: number
  items?: string[]
  description?: string
  context?: string
  meal?: string
  order?: number
  timestamp?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typewriterRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadConversations()
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current)
    }
  }, [])

  const loadConversations = () => {
    const convs = getConversations()
    setConversations(convs)
    if (convs.length > 0) {
      const current = getCurrentConversation() || convs[0]
      setMessages(current.messages as Message[])
      setCurrentId(current.id)
    }
  }

  const startNewConversation = () => {
    const conv = createConversation()
    setMessages([])
    setCurrentId(conv.id)
    loadConversations()
  }

  const selectConversation = (id: string) => {
    setCurrentConversationId(id)
    const convs = getConversations()
    const conv = convs.find(c => c.id === id)
    if (conv) {
      setMessages(conv.messages as Message[])
      setCurrentId(id)
    }
  }

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversation(id)
    if (id === currentConversationId) {
      setMessages([])
      setCurrentId(null)
    }
    loadConversations()
  }

  const executeActions = async (event: ChatEvent) => {
    console.log('[CHAT] Executando ações do evento:', event)

    // Notificar sistema que dados mudaram
    const notifyDataChange = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glicose-data-changed'))
        console.log('[CHAT] Evento glicose-data-changed disparado')
      }
    }

    // ============================================
    // AÇÃO: processar STREAM DE EVENTOS (prioritário)
    // ============================================
    if (event.stream && event.stream.events.length > 0) {
      console.log('[CHAT] Processando stream de eventos:', event.stream.events.length, 'eventos')

      // Salvar TODAS as glicoses do stream
      const glucoseEvents = event.stream.events.filter(e => e.type === 'glucose_event')
      for (const evt of glucoseEvents) {
        if (evt.value) {
          try {
            const saved = saveGlucose({
              value: evt.value,
              context: evt.context as any,
              timestamp: evt.timestamp || new Date().toISOString(),
              note: `Registrado via chat - evento #${evt.order}`
            })
            console.log('[CHAT] Glicose do stream salva:', evt.value, 'contexto:', evt.context, 'ordem:', evt.order)
          } catch (error) {
            console.error('[CHAT] Erro ao salvar glicose do stream:', error)
          }
        }
      }

      // Salvar TODOS os alimentos do stream
      const foodEvents = event.stream.events.filter(e => e.type === 'food_event')
      for (const evt of foodEvents) {
        if (evt.items && evt.items.length > 0) {
          try {
            const totalCarbs = estimateCarbsFromItems(evt.items)
            // Usar descrição COMPLETA se disponível, senão usar keywords
            const description = (evt as any).description
            const displayItems = description ? [description] : evt.items

            const saved = saveFood({
              items: displayItems.map(name => ({ name, carbs: Math.round(totalCarbs / displayItems.length) })),
              totalCarbs,
              mealType: mapMealType(evt.meal),
              timestamp: evt.timestamp || new Date().toISOString(),
              note: `Registrado via chat - evento #${evt.order}`
            })
            console.log('[CHAT] Refeição do stream salva:', evt.meal, 'itens:', displayItems, 'ordem:', evt.order)
          } catch (error) {
            console.error('[CHAT] Erro ao salvar alimento do stream:', error)
          }
        }
      }

      // Se tem stream, já processou tudo
      if (event.insulin && event.insulin.total > 0) {
        try {
          const lastGlucose = glucoseEvents[glucoseEvents.length - 1]
          const saved = saveInsulin({
            correction: event.insulin.correction,
            meal: event.insulin.meal,
            total: event.insulin.total,
            glucoseValue: lastGlucose?.value,
            timestamp: new Date().toISOString()
          })
          console.log('[CHAT] Insulina salva no localStorage:', saved)
        } catch (error) {
          console.error('[CHAT] Erro ao salvar insulina:', error)
        }
      }

      if (event.ui_update) {
        notifyDataChange()
      }
      return // Sai early, stream já foi processado
    }

    // ============================================
    // FALLBACK: processar evento legado (sem stream)
    // ============================================
    // Ação: save_glucose - SALVAR DIRETAMENTE NO LOCALSTORAGE DO CLIENTE
    if (event.actions.includes('save_glucose') && event.data.glucose) {
      try {
        const saved = saveGlucose({
          value: event.data.glucose,
          context: event.data.context as any,
          timestamp: new Date().toISOString()
        })
        console.log('[CHAT] Glucose salva no localStorage:', saved)
      } catch (error) {
        console.error('[CHAT] Erro ao salvar glicose:', error)
      }
    }

    // Ação: save_food - SALVAR DIRETAMENTE NO LOCALSTORAGE DO CLIENTE
    if (event.actions.includes('save_food') && event.data.meal) {
      try {
        const saved = saveFood({
          items: event.data.meal.map(name => ({ name, carbs: Math.round((event.data.carbs_estimate || 0) / event.data.meal!.length) })),
          totalCarbs: event.data.carbs_estimate || 0,
          mealType: event.data.context as any,
          timestamp: new Date().toISOString()
        })
        console.log('[CHAT] Alimento salvo no localStorage:', saved)
      } catch (error) {
        console.error('[CHAT] Erro ao salvar alimento:', error)
      }
    }

    // Ação: calculate_dose / save_insulin - SALVAR DIRETAMENTE NO LOCALSTORAGE DO CLIENTE
    if (event.insulin && event.insulin.total > 0) {
      try {
        const saved = saveInsulin({
          correction: event.insulin.correction,
          meal: event.insulin.meal,
          total: event.insulin.total,
          glucoseValue: event.data.glucose,
          timestamp: new Date().toISOString()
        })
        console.log('[CHAT] Insulina salva no localStorage:', saved)
      } catch (error) {
        console.error('[CHAT] Erro ao salvar insulina:', error)
      }
    }

    // Ação: log evento - API (opcional, apenas auditoria)
    if (event.actions.length > 0) {
      try {
        const response = await fetch('/api/ai-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: event.event_type,
            actions: event.actions,
            data: event.data,
            insulin: event.insulin,
            timestamp: new Date().toISOString()
          })
        })
        console.log('[CHAT] Evento logado:', await response.json())
      } catch (error) {
        console.error('[CHAT] Erro ao logar evento:', error)
      }
    }

    // Atualizar UI se necessário
    if (event.ui_update) {
      notifyDataChange()
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!currentConversationId) {
      startNewConversation()
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      const data = await response.json()
      console.log('[CHAT] Resposta da API:', data)

      if (data.success && data.event) {
        // Executar ações do evento
        await executeActions(data.event)
      }

      // Adicionar resposta ao histórico
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Erro ao processar mensagem.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      addMessage(currentConversationId, userMessage)
      addMessage(currentConversationId, assistantMessage)

    } catch (error) {
      console.error('[CHAT] Erro:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro de conexão. Tente novamente.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Container>
      <Section title="Chat Glicose AI">
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 'var(--spacing-lg)', height: 'calc(100vh - 200px)' }}>
          {/* Sidebar - Conversas */}
          <Card style={{ overflow: 'auto', height: '100%' }}>
            <Button onClick={startNewConversation} variant="primary" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
              + Nova Conversa
            </Button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    background: conv.id === currentConversationId ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                    color: conv.id === currentConversationId ? '#fff' : 'inherit',
                    padding: 'var(--spacing-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <Card
                    style={{
                      flex: 1,
                      background: 'transparent',
                      padding: 'var(--spacing-sm)'
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title}
                    </span>
                  </Card>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      opacity: 0.6,
                      fontSize: '0.8rem',
                      padding: 'var(--spacing-xs)'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', marginBottom: 'var(--spacing-md)' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 'var(--spacing-md)'
                  }}
                >
                  <Card
                    style={{
                      maxWidth: '70%',
                      background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                      color: msg.role === 'user' ? '#fff' : 'inherit',
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    {msg.content}
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ex: Glicose 250 ao acordar, comi arroz e feijão"
                style={{
                  flex: 1,
                  minHeight: '60px',
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
              <Button
                onClick={sendMessage}
                loading={loading}
                variant="primary"
                disabled={!input.trim()}
              >
                Enviar
              </Button>
            </div>
          </Card>
        </div>
      </Section>
    </Container>
  )
}