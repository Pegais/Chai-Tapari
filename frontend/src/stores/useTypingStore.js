/**
 * Typing Indicator Store (Zustand)
 * 
 * Why: Real-time state management for typing indicators
 * How: Zustand store with Socket.io integration
 * Impact: Fast real-time typing indicators without React Query
 */

import { create } from 'zustand'
import { EMPTY_ARRAY } from './constants'

/**
 * Typing Store
 * Manages real-time typing indicators
 */
export const useTypingStore = create((set, get) => ({
  // State: Map of channelId/conversationId -> Set of usernames
  typingUsers: new Map(), // channelId/conversationId -> Set of usernames
  
  // Actions
  
  /**
   * Add typing user
   */
  addTypingUser: (contextId, username) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      const users = newTypingUsers.get(contextId) || new Set()
      users.add(username)
      newTypingUsers.set(contextId, users)
      return { typingUsers: newTypingUsers }
    })
  },
  
  /**
   * Remove typing user
   */
  removeTypingUser: (contextId, username) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      const users = newTypingUsers.get(contextId)
      if (users) {
        users.delete(username)
        if (users.size === 0) {
          newTypingUsers.delete(contextId)
        } else {
          newTypingUsers.set(contextId, users)
        }
      }
      return { typingUsers: newTypingUsers }
    })
  },
  
  /**
   * Clear typing users for a context
   */
  clearTypingUsers: (contextId) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      newTypingUsers.delete(contextId)
      return { typingUsers: newTypingUsers }
    })
  },
  
  /**
   * Get typing users for a context (helper function)
   */
  getTypingUsers: (contextId) => {
    const state = get()
    if (!contextId) return []
    const users = state.typingUsers.get(contextId)
    return users ? Array.from(users) : []
  },
}))

/**
 * Hook to get typing users for a context
 * Returns stable empty array reference to prevent infinite loops
 */
export const useTypingUsers = (contextId) => {
  return useTypingStore((state) => {
    if (!contextId) return EMPTY_ARRAY
    const users = state.typingUsers.get(contextId)
    return users ? Array.from(users) : EMPTY_ARRAY
  }, (a, b) => {
    // Custom equality check - only re-render if typing users actually changed
    if (a.length !== b.length) return false
    return a.every((user, idx) => user === b[idx])
  })
}
