/**
 * Stable messages selector hook
 * Prevents infinite loops by ensuring stable array references
 */
import { useMemo } from 'react'

/**
 * Hook to get messages from Zustand store with stable references
 * @param {Function} selector - Zustand selector function
 * @param {string} contextId - Channel ID or conversation ID
 * @returns {Array} Stable array of messages
 */
export function useStableMessages(selector, contextId) {
  const messagesRaw = selector((state) => {
    if (!contextId) return null
    return state.messages.get(contextId)
  })
  
  return useMemo(() => {
    return messagesRaw || []
  }, [messagesRaw])
}

/**
 * Hook to get typing users from Zustand store with stable references
 * @param {Function} selector - Zustand selector function
 * @param {string} contextId - Channel ID or conversation ID
 * @returns {Array} Stable array of typing users
 */
export function useStableTypingUsers(selector, contextId) {
  const usersSet = selector((state) => {
    if (!contextId) return null
    return state.typingUsers.get(contextId)
  })
  
  return useMemo(() => {
    return usersSet ? Array.from(usersSet) : []
  }, [usersSet])
}
