/**
 * Message Queue Hook
 * 
 * Why: Restore pending messages from IndexedDB queue on page load
 * How: Fetches pending messages and adds them back to React Query cache
 * Impact: Failed messages persist across page reloads
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getPendingMessages } from '../services/indexedDBQueue'
import { messageKeys } from './useMessages'
import { directMessageKeys } from './useDirectMessages'
import { useAuth } from '../context/AuthContext'

/**
 * Hook to restore pending messages from queue
 * @param {string} channelId - Channel ID (for channel messages)
 * @param {string} conversationId - Conversation ID (for direct messages)
 */
export const useRestorePendingMessages = (channelId = null, conversationId = null) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    const restoreMessages = async () => {
      try {
        let pendingMessages = []

        if (channelId) {
          pendingMessages = await getPendingMessages(channelId, null)
          
          // Restore channel messages
          pendingMessages.forEach(queueMsg => {
            const optimisticMessage = {
              _id: queueMsg.optimisticId || queueMsg.id,
              sender: queueMsg.sender || (user ? {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
              } : {}),
              channel: channelId,
              content: queueMsg.content || "",
              messageType: queueMsg.messageType || 'text',
              attachments: queueMsg.attachments,
              videoEmbed: queueMsg.videoEmbed,
              timestamp: new Date(queueMsg.timestamp),
              createdAt: new Date(queueMsg.timestamp),
              isOptimistic: true,
              status: queueMsg.status,
              queueId: queueMsg.id,
            }

            // Add to React Query cache if not already present
            queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
              if (!oldData) return oldData

              // Check if message already exists
              const exists = oldData.pages.some(page =>
                page.messages.some(msg => 
                  msg._id === optimisticMessage._id || 
                  (msg.queueId && msg.queueId === queueMsg.id)
                )
              )

              if (exists) return oldData

              // Add to last page
              const lastPageIndex = oldData.pages.length - 1
              return {
                ...oldData,
                pages: oldData.pages.map((page, index) => {
                  if (index === lastPageIndex) {
                    return {
                      ...page,
                      messages: [...page.messages, optimisticMessage],
                    }
                  }
                  return page
                }),
              }
            })
          })
        } else if (conversationId) {
          pendingMessages = await getPendingMessages(null, conversationId)
          
          // Restore direct messages
          pendingMessages.forEach(queueMsg => {
            const optimisticMessage = {
              _id: queueMsg.optimisticId || queueMsg.id,
              sender: queueMsg.sender || (user ? {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
              } : {}),
              conversation: conversationId,
              content: queueMsg.content || "",
              messageType: queueMsg.messageType || 'text',
              attachments: queueMsg.attachments,
              videoEmbed: queueMsg.videoEmbed,
              timestamp: new Date(queueMsg.timestamp),
              createdAt: new Date(queueMsg.timestamp),
              isOptimistic: true,
              status: queueMsg.status,
              queueId: queueMsg.id,
            }

            // Add to React Query cache if not already present
            queryClient.setQueryData(directMessageKeys.conversationMessages(conversationId), (oldData) => {
              if (!oldData) return oldData

              // Check if message already exists
              const exists = oldData.pages.some(page =>
                page.messages.some(msg => 
                  msg._id === optimisticMessage._id || 
                  (msg.queueId && msg.queueId === queueMsg.id)
                )
              )

              if (exists) return oldData

              // Add to last page
              const lastPageIndex = oldData.pages.length - 1
              return {
                ...oldData,
                pages: oldData.pages.map((page, index) => {
                  if (index === lastPageIndex) {
                    return {
                      ...page,
                      messages: [...page.messages, optimisticMessage],
                    }
                  }
                  return page
                }),
              }
            })
          })
        }
      } catch (error) {
        console.error('[useRestorePendingMessages] Error restoring messages:', error)
      }
    }

    if ((channelId || conversationId) && user) {
      restoreMessages()
    }
  }, [channelId, conversationId, queryClient, user])
}
