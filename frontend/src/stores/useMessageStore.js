/**
 * Message Store (Zustand)
 * 
 * Optimized Discord-style message store
 * - Normalized messages
 * - Prevents infinite loops
 * - Efficient structural sharing
 */

import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

/**
 * Message Store
 * Structure: { channelId: { [messageId]: message } }
 */
export const useMessageStore = create((set, get) => ({
  messages: {},
  
  /**
   * Merge message (real-time or initial load)
   * Content-based no-op: only updates if changed
   */
  mergeMessage: (channelId, msg) => {
    if (!channelId || !msg) return
    
    // Only accept real IDs - no fallback to object itself
    const msgId = msg._id ?? msg.id
    if (!msgId) return
    
    const state = get()
    const channel = state.messages[channelId] || {}
    const existing = channel[String(msgId)]
    
    // Content-based no-op (critical - prevents infinite loops)
    const newUpdatedAt = msg.updatedAt || msg.timestamp || msg.createdAt
    const oldUpdatedAt = existing?.updatedAt || existing?.timestamp || existing?.createdAt
    
    // If unchanged → do nothing → prevents infinite renders
    if (existing && newUpdatedAt === oldUpdatedAt) return
    
    // Structural sharing - only update what changed
    set({
      messages: {
        ...state.messages,
        [channelId]: {
          ...channel,
          [String(msgId)]: msg,
        },
      },
    })
  },
  
  /**
   * Merge batch of messages (history pagination or channel sync)
   */
  mergeMessagesBatch: (channelId, msgs = []) => {
    if (!channelId || !Array.isArray(msgs)) return
    
    const state = get()
    const channel = state.messages[channelId] || {}
    const nextChannel = { ...channel }
    let changed = false
    
    msgs.forEach((msg) => {
      const msgId = msg._id ?? msg.id
      if (!msgId) return // Skip messages without IDs
      
      const existing = nextChannel[String(msgId)]
      const newUpdatedAt = msg.updatedAt || msg.timestamp || msg.createdAt
      const oldUpdatedAt = existing?.updatedAt || existing?.timestamp || existing?.createdAt
      
      if (!existing || newUpdatedAt !== oldUpdatedAt) {
        nextChannel[String(msgId)] = msg
        changed = true
      }
    })
    
    if (!changed) return // prevents useless updates
    
    set({
      messages: {
        ...state.messages,
        [channelId]: nextChannel,
      },
    })
  },
  
  /**
   * Optimistic message insertion (before server confirms)
   */
  addOptimisticMessage: (channelId, tempId, msg) => {
    if (!channelId || !tempId || !msg) return
    
    const state = get()
    const channel = state.messages[channelId] || {}
    
    set({
      messages: {
        ...state.messages,
        [channelId]: {
          ...channel,
          [String(tempId)]: { ...msg, isOptimistic: true },
        },
      },
    })
  },
  
  /**
   * Replace optimistic message with real one from backend
   */
  replaceOptimistic: (channelId, tempId, realMessage) => {
    if (!channelId || !tempId || !realMessage) return
    
    const state = get()
    const channel = state.messages[channelId] || {}
    
    if (!channel[String(tempId)]) return
    
    const realMsgId = realMessage._id ?? realMessage.id
    if (!realMsgId) return
    
    const { [String(tempId)]: removed, ...rest } = channel
    
    set({
      messages: {
        ...state.messages,
        [channelId]: {
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
  updateMessage: (channelId, messageId, updates) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !channelId || !updates) return
    
    const state = get()
    const channelMessages = state.messages[channelId] || {}
    const existing = channelMessages[msgId]
    
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
        [channelId]: {
          ...channelMessages,
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
  deleteMessage: (channelId, messageId) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !channelId) return
    
    const state = get()
    const channelMessages = state.messages[channelId] || {}
    const existing = channelMessages[msgId]
    
    // Skip if already marked as deleted
    if (existing?.isDeleted) return
    
    // Always add/update the deletion marker (even if not in store yet)
    set({
      messages: {
        ...state.messages,
        [channelId]: {
          ...channelMessages,
          [msgId]: existing 
            ? { ...existing, isDeleted: true }
            : { _id: msgId, isDeleted: true }, // Create placeholder for messages only in React Query
        },
      },
    })
  },
  
  /**
   * Remove message completely (cleanup)
   */
  removeMessage: (channelId, messageId) => {
    const msgId = messageId ? String(messageId) : null
    if (!msgId || !channelId) return
    
    const state = get()
    const channelMessages = state.messages[channelId] || {}
    if (!channelMessages[msgId]) return
    
    const { [msgId]: removed, ...rest } = channelMessages
    
    set({
      messages: {
        ...state.messages,
        [channelId]: rest,
      },
    })
  },
  
  /**
   * Clear all messages for a channel
   */
  clearMessages: (channelId) => {
    if (!channelId) return
    
    const state = get()
    const { [channelId]: removed, ...rest } = state.messages
    
    set({ messages: rest })
  },
}))

/**
 * Hook to get channel messages object (NOT sorted)
 * Returns the channel object directly - sorting happens in component
 * Uses shallow comparison for stability
 */
export const useChannelMessages = (channelId) => {
  return useMessageStore(
    (state) => {
      if (!channelId) return {}
      return state.messages[channelId] || {}
    },
    shallow // Critical: shallow comparison prevents unnecessary re-renders
  )
}
