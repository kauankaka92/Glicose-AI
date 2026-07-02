'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input } from '@/components/UI'
import { ChatAction, ChatMessage as ChatMessageType } from '@/lib/types'
import {
  getCurrentConversation,
  createConversation,
  addMessage,
  getConversations,
  deleteConversation,
  setCurrentConversationId,
  ChatConversation,
} from '@/lib/chat-storage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ChatAction[]
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadConversations()
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
    setCurrentConversationId(id)
    const conv = conversations.find(c => c.id === id)
    if (conv) {
      setMessages(conv.messages as Message[])
    }
    setShowSidebar(false)
  }

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversation(id)
    loadConversations()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    if (!currentConversationId) {
      const conversation = createConversation(input.trim().substring(0, 30))
      setCurrentId(conversation.id)
      await addMessage(conversation.id, {
        role: 'user',
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      })
    } else {
      await addMessage(currentConversationId, {
        role: 'user',
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      })
    }

    try {
      const conv = getCurrentConversation()
      const messageHistory = conv?.messages || []

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messageHistory, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: data.data.timestamp,
          actions: data.data.actions,
        }

        setMessages(prev => [...prev, assistantMessage])

        if (currentConversationId) {
          await addMessage(currentConversationId, {
            role: 'assistant',
            content: assistantMessage.content,
            timestamp: assistantMessage.timestamp,
            actions: assistantMessage.actions,
          })
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Verifique sua conexão.',
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro de conexão. Tente novamente.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleExecuteAction = async (action: ChatAction, messageId: string) => {
    if (!action.data || !action.type) return

    let success = false
    let message = ''

    try {
      switch (action.type) {
        case 'save_glucose':
          const glucoseRes = await fetch('/api/glucose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              value: action.data.value,
              timestamp: new Date().toISOString(),
              context: action.data.context || 'other',
              note: action.data.note,
            }),
          })
          const glucoseData = await glucoseRes.json()
          success = glucoseData.success
          message = success ? `Glicose ${action.data.value} mg/dL registrada!` : 'Erro ao registrar glicose'
          break

        case 'save_insulin':
          const insulinRes = await fetch('/api/insulin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              correction: action.data.correction,
              meal: action.data.meal || 0,
              glucoseValue: action.data.glucoseValue,
              timestamp: new Date().toISOString(),
            }),
          })
          const insulinData = await insulinRes.json()
          success = insulinData.success
          message = success ? `Insulina ${action.data.correction}U registrada!` : 'Erro ao registrar insulina'
          break

        case 'save_food':
          const foodRes = await fetch('/api/food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: action.data.items,
              mealType: action.data.mealType,
              totalCarbs: action.data.items.reduce((sum: number, item: any) => sum + item.carbs, 0),
              timestamp: new Date().toISOString(),
            }),
          })
          const foodData = await foodRes.json()
          success = foodData.success
          message = success ? 'Alimento registrado!' : 'Erro ao registrar alimento'
          break

        case 'save_note':
          message = 'Anotação salva: ' + action.data.content
          success = true
          break

        default:
          message = 'Ação não implementada'
      }

      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId && msg.actions) {
          return {
            ...msg,
            actions: msg.actions.map(a =>
              a === action ? { ...a, confirmed: true } : a
            ),
          }
        }
        return msg
      })
      setMessages(updatedMessages)

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      if (currentConversationId) {
        await addMessage(currentConversationId, {
          role: 'assistant',
          content: message,
          timestamp: assistantMsg.timestamp,
        })
      }
    } catch {
      console.error('Failed to execute action')
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 'var(--spacing-md)' }}>
      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: showSidebar ? 0 : '-280px',
          top: 80,
          width: '260px',
          height: 'calc(100vh - 160px)',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-md)',
          transition: 'left 0.3s ease',
          zIndex: 100,
          overflowY: 'auto',
          border: '1px solid var(--color-border)',
        }}
      >
        <Button onClick={startNewConversation} size="sm" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
          + Nova conversa
        </Button>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          CONVERSAS
        </div>
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => switchConversation(conv.id)}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              backgroundColor: conv.id === currentConversationId ? 'var(--color-bg-secondary)' : 'transparent',
              marginBottom: 'var(--spacing-xs)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.title}
            </span>
            <button
              onClick={e => handleDeleteConversation(conv.id, e)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '1rem',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              color: 'var(--color-text)',
            }}
          >
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Chat IA</h2>
          <div style={{ width: 24 }} />
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                marginTop: '40px',
              }}
            >
              <p style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>👋 Olá!</p>
              <p>Como posso ajudar com seu diabetes hoje?</p>
              <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-lg)' }}>
                Exemplos:
                <br />
                • "Minha glicose está 250, quanto de insulina?"
                <br />
                • "Comi arroz e feijão no almoço"
                <br />
                • "Registrar glicose 120 em jejum"
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor:
                    msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                }}
              >
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>

                {msg.actions && msg.actions.filter(a => a.type !== 'none').length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                    {msg.actions.filter(a => a.type !== 'none').map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleExecuteAction(action, msg.id)}
                        disabled={action.confirmed}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-primary)',
                          background: action.confirmed ? 'var(--color-success)' : 'transparent',
                          color: action.confirmed ? '#fff' : 'var(--color-primary)',
                          cursor: action.confirmed ? 'default' : 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {action.confirmed ? '✓ Confirmado' : getActionLabel(action)}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.625rem',
                    marginTop: 'var(--spacing-xs)',
                    opacity: 0.7,
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-text-secondary)',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-text-secondary)',
                      animation: 'bounce 1.4s infinite ease-in-out both 0.16s',
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-text-secondary)',
                      animation: 'bounce 1.4s infinite ease-in-out both 0.32s',
                    }}
                  />
                </div>
                <style>{`
                  @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                  }
                `}</style>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 'var(--spacing-sm)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: '1rem',
            }}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function getActionLabel(action: ChatAction): string {
  switch (action.type) {
    case 'save_glucose':
      return `Salvar glicose ${action.data?.value} mg/dL`
    case 'save_insulin':
      return `Salvar ${action.data?.correction}U insulina`
    case 'save_food':
      return 'Salvar alimento'
    case 'save_note':
      return 'Salvar anotação'
    case 'read_data':
      return 'Ver dados'
    default:
      return 'Ação'
  }
}