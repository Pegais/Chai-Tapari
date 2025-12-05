/**
 * Direct Message Store (Zustand)
 * 
 * Optimized Discord-style message store for direct messages
 * - Normalized messages
 * - Prevents infinite loops
 * - Efficient structural sharing
 */

import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

/**
 * Direct Message Store
 * Structure: { conversationId: { [messageId]: message } }
 */
export const useDirectMessageStore = create((set, get) => ({
  messages: {},
  
  /**
   * Merge message (real-time or initial load)
   * Content-based no-op: only updates if changed
   */
  mergeMessage: (conversationId, msg) => {
    if (!conversationId || !msg) return
    
    // Only accept real IDs - no fallback to object itself
    const msgId = msg._id ?? msg.id
    if (!msgId) return
    
    const state = get()
    const conversation = state.messages[conversationId] || {}
    const existing = conversation[String(msgId)]
    
    // Content-based no-op (critical - prevents infinite loops)
    const newUpdatedAt = msg.updatedAt || msg.timestamp || msg.createdAt
    const oldUpdatedAt = existing?.updatedAt || existing?.timestamp || existing?.createdAt
    
    // If unchanged → do nothing → prevents infinite renders
    if (existing && newUpdatedAt === oldUpdatedAt) return
    
    // Structural sharing - only update what changed
    set({
      messages: {
        ...state.messages,
        [conversationId]: {
          ...conversation,
          [String(msgId)]: msg,
        },
      },
    })
  },
  
  /**
   * Merge batch of messages (history pagination)
   */
  mergeMessagesBatch: (conversationId, msgs = []) => {
    if (!conversationId || !Array.isArray(msgs)) return
    
    const state = get()
    const conversation = state.messages[conversationId] || {}
    const nextConversation = { ...conversation }
    let changed = false
    
    msgs.forEach((msg) => {
      const msgId = msg._id ?? msg.id
      if (!msgId) return // Skip messages without IDs
      
      const existing = nextConversation[String(msgId)]
      const newUpdatedAt = msg.updatedAt || msg.timestamp || msg.createdAt
      const oldUpdatedAt = existing?.updatedAt || existing?.timestamp || existing?.createdAt
      
      if (!existing || newUpdatedAt !== oldUpdatedAt) {
        nextConversation[String(msgId)] = msg
        changed = true
      }
    })
    
    if (!changed) return
    
    set({
      messages: {
        ...state.messages,
        [conversationId]: nextConversation,
      },
    })
  },
  
  /**
   * Optimistic message insertion
   */
  addOptimisticMessage: (conversationId, tempId, msg) => {
    if (!conversationId || !tempId || !msg) return
    
    const state = get()
    const conversation = state.messages[conversationId] || {}
    
    set({
      messages: {
        ...state.messages,
        [conversationId]: {
          ...conversation,
          [String(tempId)]: { ...msg, isOptimistic: true },
        },
      },
    })
  },
  
  /**
   * Replace optimistic message with real one
   */
  replaceOptimistic: (conversationId, tempId, realMessage) => {
    if (!conversationId || !tempId || !realMessage) return
    
    const state = get()
    const conversation = state.messages[conversationId] || {}
    
    if (!conversation[String(tempId)]) return
    
    const realMsgId = realMessage._id ?? realMessage.id
    if (!realMsgId) return
    
    const { [String(tempId)]: removed, ...rest } = conversation
    
    set({
      messages: {
        ...state.messages,
        [conversationId]: {
          ...rest,
          [String(realMsgId)]: {
            ...realMessage,
            isOptimistic: false,
          },
        },
      },
    })
  },
  
  /**
   * Update message (edit, status change) - works even if not in store
   */
  updateMessage: (conversationId, messageId, updates) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !conversationId || !updates) return
    
    const state = get()
    const conversationMessages = state.messages[conversationId] || {}
    const existing = conversationMessages[msgId]
    
    // Content-based no-op check (only if message exists)
    if (existing) {
      const newUpdatedAt = updates.updatedAt || updates.timestamp
      const oldUpdatedAt = existing.updatedAt || existing.timestamp || existing.createdAt
      
      if (newUpdatedAt && oldUpdatedAt && newUpdatedAt === oldUpdatedAt) {
        const hasChanges = Object.keys(updates).some(
          key => key !== 'updatedAt' && existing[key] !== updates[key]
        )
        if (!hasChanges) return
      }
    }
    
    // Apply update (create entry if doesn't exist)
    set({
      messages: {
        ...state.messages,
        [conversationId]: {
          ...conversationMessages,
          [msgId]: existing 
            ? { ...existing, ...updates }
            : { _id: msgId, ...updates },
        },
      },
    })
  },
  
  /**
   * Mark message as deleted (works even if message not in store yet)
   */
  deleteMessage: (conversationId, messageId) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !conversationId) return
    
    const state = get()
    const conversationMessages = state.messages[conversationId] || {}
    const existing = conversationMessages[msgId]
    
    // Skip if already marked as deleted
    if (existing?.isDeleted) return
    
    // Always add/update the deletion marker (even if not in store yet)
    set({
      messages: {
        ...state.messages,
        [conversationId]: {
          ...conversationMessages,
          [msgId]: existing 
            ? { ...existing, isDeleted: true }
            : { _id: msgId, isDeleted: true }, // Create placeholder for messages only in React Query
        },
      },
    })
  },
  
  /**
   * Remove message completely
   */
  removeMessage: (conversationId, messageId) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !conversationId) return
    
    const state = get()
    const conversationMessages = state.messages[conversationId] || {}
    if (!conversationMessages[msgId]) return
    
    const { [msgId]: removed, ...rest } = conversationMessages
    
    set({
      messages: {
        ...state.messages,
        [conversationId]: rest,
      },
    })
  },
  
  /**
   * Clear all messages for a conversation
   */
  clearMessages: (conversationId) => {
    if (!conversationId) return
    
    const state = get()
    const { [conversationId]: removed, ...rest } = state.messages
    
    set({ messages: rest })
  },
}))

/**
 * Hook to get conversation messages object (NOT sorted)
 * Returns the conversation object directly - sorting happens in component
 * Uses shallow comparison for stability
 */
export const useConversationMessages = (conversationId) => {
  return useDirectMessageStore(
    (state) => {
      if (!conversationId) return {}
      return state.messages[conversationId] || {}
    },
    shallow // Critical: shallow comparison prevents unnecessary re-renders
  )
}
