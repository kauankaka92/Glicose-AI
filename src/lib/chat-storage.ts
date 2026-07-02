import { ChatAction } from './types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ChatAction[]
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'glicose_ai_chat_history'
const CURRENT_CONVERSATION_KEY = 'glicose_ai_current_conversation'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getStorage(): ChatConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveStorage(conversations: ChatConversation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

// Lock para transações
const chatTransactionLocks: Record<string, boolean> = {}

async function acquireChatLock(timeout = 5000): Promise<boolean> {
  const startTime = Date.now()
  while (chatTransactionLocks['chat']) {
    if (Date.now() - startTime > timeout) {
      console.warn('[chat-storage.ts] Lock timeout expired')
      return false
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  chatTransactionLocks['chat'] = true
  return true
}

function releaseChatLock() {
  delete chatTransactionLocks['chat']
}

export function getCurrentConversationId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_CONVERSATION_KEY)
}

export function setCurrentConversationId(id: string | null): void {
  if (typeof window === 'undefined') return
  if (id) {
    localStorage.setItem(CURRENT_CONVERSATION_KEY, id)
  } else {
    localStorage.removeItem(CURRENT_CONVERSATION_KEY)
  }
}

export function createConversation(title: string = 'Nova conversa'): ChatConversation {
  const id = generateId()
  const now = new Date().toISOString()
  const conversation: ChatConversation = {
    id,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }

  const conversations = getStorage()
  conversations.unshift(conversation)
  saveStorage(conversations)
  setCurrentConversationId(id)

  return conversation
}

export function getCurrentConversation(): ChatConversation | null {
  const currentId = getCurrentConversationId()
  if (!currentId) return null

  const conversations = getStorage()
  return conversations.find(c => c.id === currentId) || null
}

export function getConversations(): ChatConversation[] {
  return getStorage()
}

export async function addMessage(conversationId: string, message: Omit<ChatMessage, 'id'>): Promise<ChatMessage | null> {
  const acquired = await acquireChatLock()
  if (!acquired) return null

  try {
    const conversations = getStorage()
    const conversationIndex = conversations.findIndex(c => c.id === conversationId)

    if (conversationIndex === -1) return null

    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
    }

    conversations[conversationIndex].messages.push(newMessage)
    conversations[conversationIndex].updatedAt = new Date().toISOString()

    saveStorage(conversations)
    return newMessage
  } finally {
    releaseChatLock()
  }
}

export function deleteConversation(id: string): boolean {
  let conversations = getStorage()
  const filtered = conversations.filter(c => c.id !== id)

  if (filtered.length === conversations.length) return false

  conversations = filtered
  saveStorage(conversations)

  if (getCurrentConversationId() === id) {
    setCurrentConversationId(conversations[0]?.id || null)
  }

  return true
}

export function clearAllConversations(): void {
  saveStorage([])
  setCurrentConversationId(null)
}

export function getRecentMessages(limit: number = 20): ChatMessage[] {
  const conversation = getCurrentConversation()
  if (!conversation) return []

  return conversation.messages.slice(-limit)
}