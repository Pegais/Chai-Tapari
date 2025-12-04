/**
 * Users Hook
 * 
 * Why: Centralized user data fetching with React Query
 * How: Uses React Query for caching and state management
 * Impact: Efficient user data management
 */

import { useQuery } from '@tanstack/react-query'
import { getUsers, getOnlineUsers, getUserById } from '../services/api'

/**
 * Query key factory
 * Why: Consistent query keys for users
 * How: Provides functions to generate query keys
 * Impact: Proper cache invalidation and updates
 */
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  online: () => [...userKeys.all, 'online'],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
}

/**
 * Get all users hook
 * Why: Fetch and cache user list
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching and updates
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await getUsers()
      return response.data.users
    },
    staleTime: 30 * 1000, // 30 seconds - shorter to get fresh isOnline status
    refetchInterval: 60 * 1000, // Refetch every minute as fallback
    refetchOnWindowFocus: true,
  })
}

/**
 * Get online users hook
 * Why: Fetch and cache online users list
 * How: Uses React Query useQuery hook with polling
 * Impact: Real-time online user updates
 */
export function useOnlineUsers() {
  return useQuery({
    queryKey: userKeys.online(),
    queryFn: async () => {
      const response = await getOnlineUsers()
      return response.data.users
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Get user by ID hook
 * Why: Fetch and cache specific user
 * How: Uses React Query useQuery hook
 * Impact: Automatic caching and updates
 */
export function useUser(userId) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const response = await getUserById(userId)
      return response.data.user
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

