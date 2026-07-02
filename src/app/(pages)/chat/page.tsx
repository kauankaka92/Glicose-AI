'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Badge } from '@/components/UI'
import { ChatAction } from '@/lib/types'
import {
  getCurrentConversation,
  createConversation,
  addMessage,
  getConversations,
  deleteConversation,
  setCurrentConversationId,
  ChatConversation,
} from '@/lib/chat-storage'
import { saveGlucose, saveInsulin, saveFood, getSettings } from '@/lib/storage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ChatAction[]
  isTyping?: boolean
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
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

    const current = getCurrentConversation()
    if (current) {
      setMessages(current.messages as Message[])
      setCurrentId(current.id)
    } else if (convs.length > 0) {
      setMessages(convs[0].messages as Message[])
      setCurrentId(convs[0].id)
    }
  }

  const startNewConversation = () => {
    const conversation = createConversation()
    setMessages([])
    setCurrentId(conversation.id)
    loadConversations()
    setShowSidebar(false)
  }

  const switchConversation = (id: string) => {
    setCurrentId(id)
    const conversation = getConversations().find((c) => c.id === id)
    if (conversation) {
      setMessages(conversation.messages as Message[])
    }
    setShowSidebar(false)
  }

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (conversations.length === 1) {
      startNewConversation()
    } else {
      deleteConversation(id)
      loadConversations()
      if (id === currentConversationId) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          switchConversation(remaining[0].id)
        }
      }
    }
  }

  const typeMessage = (fullText: string, messageId: string, actions?: ChatAction[]) => {
    const chars = fullText.split('')
    let currentIndex = 0
    const typingSpeed = 15

    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      actions,
      isTyping: true,
    }

    setMessages((prev) => [...prev, assistantMessage])

    typewriterRef.current = setInterval(() => {
      if (currentIndex < chars.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: msg.content + chars[currentIndex] }
              : msg
          )
        )
        currentIndex++
      } else {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current)
          typewriterRef.current = null
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isTyping: false } : msg
          )
        )
      }
    }, typingSpeed)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userInput = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    if (typewriterRef.current) {
      clearInterval(typewriterRef.current)
      typewriterRef.current = null
    }

    // Verificar se é uma confirmação do usuário
    const isConfirmation = /^(sim|sure|yes|ok|okay|claro|com certeza|isso|exato)$/i.test(userInput)

    // Se for confirmação e tiver ações pendentes, executa
    if (isConfirmation && messages.length > 0) {
      const lastAssistantMsg = messages[messages.length - 1]
      if (lastAssistantMsg && lastAssistantMsg.role === 'assistant' && lastAssistantMsg.actions && lastAssistantMsg.actions.length > 0) {
        // Executar todas as ações pendentes
        for (const action of lastAssistantMsg.actions) {
          await processAction({ ...action, confirmed: true }, true)
        }
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          userId: currentConversationId || 'default'
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        const assistantMessageId = (Date.now() + 1).toString()
        typeMessage(data.data.response, assistantMessageId, data.data.actions)

        if (currentConversationId) {
          addMessage(currentConversationId, userMessage)
          const finalAssistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: data.data.response,
            timestamp: new Date().toISOString(),
            actions: data.data.actions,
          }
          addMessage(currentConversationId, finalAssistantMessage)
        }
      } else {
        const errorMessageId = (Date.now() + 1).toString()
        typeMessage(
          data.error || 'Desculpe, ocorreu um erro. Tente novamente.',
          errorMessageId
        )
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessageId = (Date.now() + 1).toString()
      typeMessage('Desculpe, ocorreu um erro. Tente novamente.', errorMessageId)
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

  const processAction = async (action: ChatAction, confirmedByUser = true) => {
    console.log('Processing action:', action, 'Confirmed:', confirmedByUser)

    if (!action.data) return

    // Se não foi confirmado pelo usuário, pede confirmação
    if (!confirmedByUser && !action.confirmed) {
      const confirmed = window.confirm(`Confirmar ação: ${action.type}?`)
      if (!confirmed) return
    }

    try {
      switch (action.type) {
        case 'save_glucose': {
          const settings = getSettings()
          const context = action.data.context || guessContext(action.data.note)
          const entry = saveGlucose({
            value: action.data.value,
            timestamp: new Date().toISOString(),
            context,
            note: action.data.note || '',
          })
          // Adicionar mensagem de confirmação
          const confirmMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Glicose registrada: ${action.data.value} mg/dL`,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, confirmMsg])
          break
        }
        case 'save_insulin': {
          const settings = getSettings()
          const glucose = action.data.glucoseValue || 0
          const correctionDose = action.data.correction || 0
          const mealDose = action.data.meal || 0

          // Calcular dose de refeição se tiver carbs
          let finalMealDose = mealDose
          if (action.data.carbs && settings.carbRatio) {
            finalMealDose = Math.round((action.data.carbs / settings.carbRatio) * 10) / 10
          }

          const totalDose = Math.round((correctionDose + finalMealDose) * 10) / 10

          saveInsulin({
            correction: correctionDose,
            meal: finalMealDose,
            total: totalDose,
            timestamp: new Date().toISOString(),
            glucoseValue: glucose,
            carbsValue: action.data.carbs,
            note: action.data.note || '',
          })
          // Adicionar mensagem de confirmação
          const confirmMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Insulina registrada: ${totalDose}U (correção: ${correctionDose}U, refeição: ${finalMealDose}U)`,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, confirmMsg])
          break
        }
        case 'save_food': {
          const items = action.data.items || []
          const totalCarbs = items.reduce((sum: number, item: any) => sum + (item.carbs || 0), 0)
          saveFood({
            items,
            totalCarbs,
            timestamp: new Date().toISOString(),
            mealType: action.data.mealType || 'lunch',
            note: action.data.note || '',
          })
          // Adicionar mensagem de confirmação
          const confirmMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Refeição registrada: ${totalCarbs}g de carboidratos`,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, confirmMsg])
          break
        }
        default:
          console.log('Ação desconhecida:', action.type)
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error)
    }
  }

  const guessContext = (note?: string): 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'night' | 'exercise' | 'other' => {
    if (!note) return 'other'
    const text = note.toLowerCase()
    if (text.includes('jejum') || text.includes('acordar')) return 'fasting'
    if (text.includes('antes') || text.includes('pré')) return 'before_meal'
    if (text.includes('depois') || text.includes('pós') || text.includes('após')) return 'after_meal'
    if (text.includes('dormir') || text.includes('cama')) return 'bedtime'
    if (text.includes('madrugada') || text.includes('noite')) return 'night'
    if (text.includes('exercício') || text.includes('treino') || text.includes('atividade')) return 'exercise'
    return 'other'
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: 'var(--letter-spacing-tight)',
            }}
          >
            Chat IA
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Cálculos e registros conversacionais
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={startNewConversation}
          style={{
            border: '1px solid var(--color-border)',
          }}
        >
          + Nova
        </Button>
      </div>

      {/* Messages */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          minHeight: '400px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-2xl)',
              }}
            >
              <div
                style={{
                  fontSize: '56px',
                  marginBottom: 'var(--spacing-lg)',
                  opacity: 0.2,
                }}
              >
                ◐
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Comece uma conversa para calcular insulina<br />ou registrar glicoses de forma inteligente
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Card
              style={{
                maxWidth: '85%',
                backgroundColor:
                  message.role === 'user'
                    ? 'var(--color-primary-light)'
                    : 'var(--color-bg-secondary)',
                border:
                  message.role === 'user'
                    ? '1px solid rgba(0, 255, 157, 0.2)'
                    : '1px solid var(--color-border)',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              {message.role === 'assistant' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--color-primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'var(--color-text-inverse)',
                      animation: message.isTyping ? 'biometric-pulse 1s ease-in-out infinite' : 'none',
                    }}
                  >
                    ◐
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Glicose AI
                  </span>
                  {message.isTyping && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-primary)',
                        animation: 'pulse-glow 1s ease-in-out infinite',
                      }}
                    >
                      digitando...
                    </span>
                  )}
                </div>
              )}
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color:
                    message.role === 'user'
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-relaxed)',
                  fontFamily: message.role === 'assistant' && message.isTyping ? 'var(--font-mono)' : 'inherit',
                }}
              >
                {message.content}
                {message.isTyping && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '1em',
                      backgroundColor: 'var(--color-primary)',
                      marginLeft: '2px',
                      animation: 'blink 1s step-end infinite',
                    }}
                  />
                )}
              </p>
              {message.actions && message.actions.length > 0 && !message.isTyping && (
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-md)',
                    flexWrap: 'wrap',
                  }}
                >
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => processAction(action)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(0, 255, 157, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                        e.currentTarget.style.color = 'var(--color-bg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'
                        e.currentTarget.style.color = 'var(--color-primary)'
                      }}
                    >
                      {action.label || action.type}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ))}

        {loading && messages.filter((m) => m.isTyping).length === 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <Card
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    animation: 'pulse-glow 1s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    animation: 'pulse-glow 1s ease-in-out infinite 0.2s',
                  }}
                />
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    animation: 'pulse-glow 1s ease-in-out infinite 0.4s',
                  }}
                />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: registrar glicose 120 antes do almoço"
          style={{
            flex: 1,
            padding: '14px 18px',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
            outline: 'none',
            transition: 'all var(--transition-fast)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)'
            e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <Button
          variant="primary"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          glow
          style={{
            padding: '14px 24px',
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: '18px' }}>→</span>
        </Button>
      </div>
    </>
  )
}