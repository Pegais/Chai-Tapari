/**
 * Messages Hook
 * 
 * Why: Centralized message data fetching with React Query
 * How: Uses React Query for caching and pagination
 * Impact: Efficient message data management with infinite scroll support
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { getMessages, createMessage, editMessage, deleteMessage } from '../services/api'

/**
 * Query key factory
 * Why: Consistent query keys for messages
 * How: Provides functions to generate query keys
 * Impact: Proper cache invalidation and updates
 */
export const messageKeys = {
  all: ['messages'],
  lists: () => [...messageKeys.all, 'list'],
  list: (channelId) => [...messageKeys.lists(), channelId],
}

/**
 * Get messages hook with infinite scroll
 * Why: Fetch messages with pagination support
 * How: Uses React Query useInfiniteQuery hook
 * Impact: Enables infinite scroll and efficient pagination
 */
export function useMessages(channelId, options = {}) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(channelId),
    queryFn: async ({ pageParam }) => {
      const response = await getMessages(channelId, {
        before: pageParam,
        limit: options.limit || 50,
      })
      return {
        messages: response.data.messages,
        nextCursor: response.data.messages.length > 0 
          ? response.data.messages[0].timestamp 
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!channelId,
    initialPageParam: null,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Create message mutation hook
 * Why: Send message with optimistic updates
 * How: Uses React Query useMutation hook
 * Impact: Message appears immediately, then syncs with server
 */
export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ channelId, messageData }) => {
      const response = await createMessage(channelId, messageData)
      return response.data.message
    },
    onSuccess: (data, variables) => {
      // Invalidate messages for the channel
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.list(variables.channelId) 
      })
    },
  })
}

/**
 * Edit message mutation hook
 * Why: Update message with cache updates
 * How: Uses React Query useMutation hook
 * Impact: Message updated in cache immediately
 */
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, content }) => {
      const response = await editMessage(messageId, content)
      return response.data.message
    },
    onSuccess: (data) => {
      // Find and update message in all channel caches
      queryClient.setQueriesData(
        { queryKey: messageKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          // Update message in infinite query pages
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.map(msg => 
                msg._id === data._id ? data : msg
              ),
            })),
          }
        }
      )
    },
  })
}

/**
 * Delete message mutation hook
 * Why: Delete message with cache updates
 * How: Uses React Query useMutation hook
 * Impact: Message removed from cache immediately
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId) => {
      const response = await deleteMessage(messageId)
      return response.data.message
    },
    onSuccess: (data) => {
      // Remove message from all channel caches
      queryClient.setQueriesData(
        { queryKey: messageKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.filter(msg => msg._id !== data._id),
            })),
          }
        }
      )
    },
  })
}

