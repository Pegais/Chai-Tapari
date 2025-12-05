# Zustand + React Query Migration Guide

## Overview
This migration converts the codebase to use:
- **React Query**: Only for initial data fetching and persistence
- **Zustand + Socket.io**: For all real-time state management

## Architecture

### Before (React Query for everything)
- React Query used for initial fetch AND real-time updates
- Socket events update React Query cache via `setQueryData`
- Components read from React Query cache

### After (React Query + Zustand)
- React Query: Initial fetch only, persistence
- Zustand: Real-time state (messages, typing, presence)
- Socket events update Zustand stores
- Components merge React Query data with Zustand state

## Key Changes

### 1. Zustand Stores Created
- `frontend/src/stores/useMessageStore.js` - Channel messages
- `frontend/src/stores/useDirectMessageStore.js` - Direct messages  
- `frontend/src/stores/useTypingStore.js` - Typing indicators

### 2. Component Updates

#### ChatWindow.jsx
- ✅ Uses `useMessageStore` for real-time messages
- ✅ Uses `useTypingStore` for typing indicators
- ✅ Initializes Zustand from React Query data on mount
- ✅ Socket handlers update Zustand stores instead of React Query cache

#### DirectMessageWindow.jsx
- ⏳ Needs refactoring (similar to ChatWindow)
- ⏳ Use `useDirectMessageStore` for real-time messages
- ⏳ Use `useTypingStore` for typing indicators

#### MessageInput.jsx
- ⏳ Add optimistic messages to Zustand store
- ⏳ Remove React Query cache updates

### 3. Socket Handlers
All socket event handlers now update Zustand stores:
- `new-message` → `useMessageStore.addMessage()`
- `message-edited` → `useMessageStore.updateMessage()`
- `message-deleted` → `useMessageStore.deleteMessage()`
- `user-typing` → `useTypingStore.addTypingUser()`

## Implementation Pattern

```javascript
// 1. Get initial data from React Query (unchanged)
const { data: messagesData } = useMessages(channelId)
const initialMessages = messagesData?.pages?.flatMap(page => page.messages || []) || []

// 2. Initialize Zustand store with React Query data
useEffect(() => {
  if (channelId && initialMessages.length > 0) {
    initializeMessages(channelId, initialMessages)
  }
}, [channelId, initialMessages, initializeMessages])

// 3. Subscribe to Zustand store for real-time updates
const realTimeMessages = useMessageStore((state) => {
  if (!channelId) return []
  return state.messages.get(channelId) || []
})

// 4. Merge initial + real-time for display
const messages = useMemo(() => {
  return realTimeMessages.length > 0 ? realTimeMessages : initialMessages
}, [realTimeMessages, initialMessages])

// 5. Update Zustand in socket handlers (not React Query)
socket.on('new-message', (data) => {
  addMessage(channelId, data.message)
})
```

## Files to Update

### Completed ✅
- [x] Install Zustand
- [x] Create Zustand stores
- [x] Refactor ChatWindow.jsx

### In Progress ⏳
- [ ] Refactor DirectMessageWindow.jsx
- [ ] Update MessageInput.jsx (channel messages)
- [ ] Update MessageInput.jsx (direct messages)
- [ ] Remove React Query cache updates from socket handlers
- [ ] Update useMessageQueue hook to work with Zustand
- [ ] Test and verify all functionality

## Benefits

1. **Performance**: Zustand updates are faster than React Query cache manipulation
2. **Separation of Concerns**: React Query for server state, Zustand for client state
3. **Simpler Code**: Less complex cache update logic
4. **Better Real-time**: Direct state updates without cache invalidation

## Notes

- React Query still handles initial fetches and background sync
- Zustand stores are cleared on logout/reload
- IndexedDB queue system still works (needs Zustand integration)
- Message deduplication handled in Zustand stores
