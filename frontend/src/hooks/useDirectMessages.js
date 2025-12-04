/**
 * Direct Messages Hook
 * 
 * Why: Centralized direct message data fetching with React Query
 * How: Uses React Query for caching and state management
 * Impact: Efficient direct message data management with automatic caching
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getConversations, getConversation, getConversationMessages, sendDirectMessage } from '../services/api'

/**
 * Query key factory
 * Why: Consistent query keys across the application
 * How: Provides functions to generate query keys
 * Impact: Proper cache invalidation and updates
 */
export const directMessageKeys = {
  all: ['direct-messages'],
  conversations: () => [...directMessageKeys.all, 'conversations'],
  conversation: (userId) => [...directMessageKeys.all, 'conversation', userId],
  messages: () => [...directMessageKeys.all, 'messages'],
  conversationMessages: (conversationId) => [...directMessageKeys.messages(), conversationId],
}

/**
 * Get all conversations hook
 * Why: Fetch and cache conversation list
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching, refetching, and error handling
 */
export function useConversations() {
  return useQuery({
    queryKey: directMessageKeys.conversations(),
    queryFn: async () => {
      const response = await getConversations()
      return response.data.conversations
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Get conversation by participant hook
 * Why: Fetch and cache specific conversation
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching and updates
 */
export function useConversation(userId) {
  return useQuery({
    queryKey: directMessageKeys.conversation(userId),
    queryFn: async () => {
      if (!userId) return null
      const response = await getConversation(userId)
      return response.data.conversation
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Get conversation messages hook with infinite scroll
 * Why: Fetch and cache conversation messages with pagination
 * How: Uses React Query useInfiniteQuery hook
 * Impact: Enables infinite scroll for message history
 */
export function useConversationMessages(conversationId) {
  return useInfiniteQuery({
    queryKey: directMessageKeys.conversationMessages(conversationId),
    queryFn: async ({ pageParam }) => {
      const response = await getConversationMessages(conversationId, {
        before: pageParam,
        limit: 50,
      })
      return {
        messages: response.data.messages || [],
        nextCursor: response.data.messages?.length > 0 
          ? response.data.messages[0].timestamp 
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

/**
 * Send direct message mutation hook
 * Why: Send direct message with optimistic updates
 * How: Uses React Query useMutation hook
 * Impact: Automatic cache invalidation after sending
 */
export function useSendDirectMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageData) => {
      const response = await sendDirectMessage(messageData)
      return response.data.message
    },
    onSuccess: (message, variables) => {
      // Invalidate conversation messages
      if (message.conversation) {
        queryClient.invalidateQueries({ 
          queryKey: directMessageKeys.conversationMessages(message.conversation) 
        })
      }
      // Invalidate conversations list
      queryClient.invalidateQueries({ 
        queryKey: directMessageKeys.conversations() 
      })
    },
  })
}

