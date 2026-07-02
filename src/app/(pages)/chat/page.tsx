'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, Button } from '@/components/UI'
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

  const typeMessage = (fullText: string, messageId: string) => {
    const chars = fullText.split('')
    let currentIndex = 0
    const typingSpeed = 20

    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userId: currentConversationId || 'default'
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        const assistantMessageId = (Date.now() + 1).toString()
        typeMessage(data.data.response, assistantMessageId)

        if (currentConversationId) {
          addMessage(currentConversationId, userMessage)
          addMessage(currentConversationId, {
            role: 'assistant',
            content: data.data.response,
            timestamp: new Date().toISOString(),
          })
        }
      } else {
        const errorMessageId = (Date.now() + 1).toString()
        typeMessage(data.error || 'Erro. Tente novamente.', errorMessageId)
      }
    } catch (error) {
      console.error('Erro:', error)
      const errorMessageId = (Date.now() + 1).toString()
      typeMessage('Erro de conexão. Verifique sua internet.', errorMessageId)
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
            Ex: "glicose 267 ao acordar" ou "tomei 4 unidades"
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
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
              <div style={{ fontSize: '56px', marginBottom: 'var(--spacing-lg)', opacity: 0.2 }}>
                ◐
              </div>
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-tertiary)' }}>
                Digite sua glicose ou insulina para registrar automaticamente
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                Ex: "minha glicose está 267" ou "tomei 3 unidades"
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
              }}
            >
              {message.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Glicose AI
                  </span>
                </div>
              )}
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: message.role === 'user' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-relaxed)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </p>
            </Card>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Card style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', animation: 'pulse-glow 1s ease-in-out infinite 0.2s' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', animation: 'pulse-glow 1s ease-in-out infinite 0.4s' }} />
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
          placeholder='Ex: "glicose 150 antes do almoço"'
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