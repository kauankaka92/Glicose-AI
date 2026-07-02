'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, Badge } from '@/components/UI'
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        actions: data.actions,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (currentConversationId) {
        addMessage(currentConversationId, userMessage)
        addMessage(currentConversationId, assistantMessage)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
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

  const processAction = async (action: ChatAction) => {
    console.log('Processing action:', action)
    alert(`Ação: ${action.type}\nDados: ${JSON.stringify(action.data, null, 2)}`)
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
                }}
              >
                {message.content}
              </p>
              {message.actions && message.actions.length > 0 && (
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
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ))}
        {loading && (
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