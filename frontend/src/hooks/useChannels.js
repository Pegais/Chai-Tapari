/**
 * Channels Hook
 * 
 * Why: Centralized channel data fetching with React Query
 * How: Uses React Query for caching and state management
 * Impact: Efficient channel data management with automatic caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChannels, getChannelById, createChannel, joinChannel, leaveChannel } from '../services/api'

/**
 * Query key factory
 * Why: Consistent query keys across the application
 * How: Provides functions to generate query keys
 * Impact: Proper cache invalidation and updates
 */
export const channelKeys = {
  all: ['channels'],
  lists: () => [...channelKeys.all, 'list'],
  list: (filters) => [...channelKeys.lists(), { filters }],
  details: () => [...channelKeys.all, 'detail'],
  detail: (id) => [...channelKeys.details(), id],
}

/**
 * Get all channels hook
 * Why: Fetch and cache channel list
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching, refetching, and error handling
 */
export function useChannels() {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: async () => {
      const response = await getChannels()
      return response.data.channels
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Get channel by ID hook
 * Why: Fetch and cache specific channel
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching and updates
 */
export function useChannel(channelId) {
  return useQuery({
    queryKey: channelKeys.detail(channelId),
    queryFn: async () => {
      const response = await getChannelById(channelId)
      return response.data.channel
    },
    enabled: !!channelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Create channel mutation hook
 * Why: Create new channel with optimistic updates
 * How: Uses React Query useMutation hook
 * Impact: Automatic cache invalidation after creation
 */
export function useCreateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelData) => {
      const response = await createChannel(channelData)
      return response.data.channel
    },
    onSuccess: () => {
      // Invalidate channels list to refetch
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

/**
 * Join channel mutation hook
 * Why: Join channel with cache updates
 * How: Uses React Query useMutation hook
 * Impact: Channel list updated after joining
 */
export function useJoinChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId) => {
      const response = await joinChannel(channelId)
      return response.data.channel
    },
    onSuccess: (data, channelId) => {
      // Update channel in cache
      queryClient.setQueryData(channelKeys.detail(channelId), data)
      // Invalidate channels list
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

/**
 * Leave channel mutation hook
 * Why: Leave channel with cache updates
 * How: Uses React Query useMutation hook
 * Impact: Channel list updated after leaving
 */
export function useLeaveChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId) => {
      const response = await leaveChannel(channelId)
      return response.data.channel
    },
    onSuccess: (data, channelId) => {
      // Update channel in cache
      queryClient.setQueryData(channelKeys.detail(channelId), data)
      // Invalidate channels list
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

