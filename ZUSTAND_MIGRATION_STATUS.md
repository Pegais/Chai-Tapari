# Zustand Migration Status

## ✅ Completed

1. **Zustand Installation**
   - ✅ Installed `zustand` package

2. **Zustand Stores Created**
   - ✅ `frontend/src/stores/useMessageStore.js` - Channel messages store
   - ✅ `frontend/src/stores/useDirectMessageStore.js` - Direct messages store  
   - ✅ `frontend/src/stores/useTypingStore.js` - Typing indicators store

3. **Components Refactored**
   - ✅ `frontend/src/components/Chat/ChatWindow.jsx` - Fully migrated to Zustand
     - Uses `useMessageStore` for real-time messages
     - Uses `useTypingStore` for typing indicators
     - Socket handlers update Zustand stores
     - React Query only for initial fetch

## ⏳ Remaining Work

### High Priority

1. **DirectMessageWindow.jsx** (~1288 lines)
   - Needs full refactor similar to ChatWindow
   - Replace React Query cache updates with Zustand store updates
   - Use `useDirectMessageStore` for real-time messages
   - Use `useTypingStore` for typing indicators

2. **MessageInput.jsx** (Channel messages)
   - Add optimistic messages to `useMessageStore` instead of React Query cache
   - Remove `queryClient.setQueryData` calls

3. **Direct Message Input** (in DirectMessageWindow.jsx)
   - Add optimistic messages to `useDirectMessageStore` instead of React Query cache
   - Remove `queryClient.setQueryData` calls

### Medium Priority

4. **useMessageQueue Hook**
   - Update to restore messages into Zustand stores
   - Ensure queue cleanup works with Zustand

5. **MessageItem Component**
   - No changes needed (already works with messages from props)

6. **MessageList Component**
   - No changes needed (already works with messages from props)

## Migration Pattern

### Pattern Used in ChatWindow (Apply to DirectMessageWindow):

```javascript
// 1. Import Zustand stores
import { useMessageStore } from "../../stores/useMessageStore"
import { useTypingStore } from "../../stores/useTypingStore"

// 2. Get store actions and state
const initializeMessages = useMessageStore((state) => state.initializeMessages)
const addMessage = useMessageStore((state) => state.addMessage)
const updateMessage = useMessageStore((state) => state.updateMessage)
const deleteMessage = useMessageStore((state) => state.deleteMessage)
const realTimeMessages = useMessageStore((state) => {
  if (!channelId) return []
  return state.messages.get(channelId) || []
})

// 3. Initialize Zustand from React Query on mount
useEffect(() => {
  if (channelId && initialMessages.length > 0) {
    initializeMessages(channelId, initialMessages)
  }
}, [channelId, initialMessages, initializeMessages])

// 4. Merge initial + real-time for display
const messages = useMemo(() => {
  return realTimeMessages.length > 0 ? realTimeMessages : initialMessages
}, [realTimeMessages, initialMessages])

// 5. Update Zustand in socket handlers (NOT React Query)
socket.on('new-message', (data) => {
  addMessage(channelId, data.message)
})
```

## Files to Update

### Priority 1 (Critical)
- [ ] `frontend/src/components/DirectMessages/DirectMessageWindow.jsx` - Full refactor
- [ ] `frontend/src/components/Chat/MessageInput.jsx` - Add to Zustand store

### Priority 2 (Important)
- [ ] `frontend/src/hooks/useMessageQueue.js` - Restore to Zustand

### Priority 3 (Nice to have)
- [ ] Remove all remaining `queryClient.setQueryData` calls for real-time updates
- [ ] Update tests if any exist

## Notes

- React Query is still used for:
  - Initial data fetching
  - Background sync/refetch
  - Server state persistence
  
- Zustand is used for:
  - Real-time state (messages, typing)
  - Client-side optimistic updates
  - Fast UI updates without cache manipulation

- Both work together:
  - React Query provides initial data
  - Zustand handles all real-time updates
  - Components merge both for display

## Testing Checklist

- [ ] Channel messages appear instantly
- [ ] Direct messages appear instantly
- [ ] Optimistic messages work
- [ ] Message edits update in real-time
- [ ] Message deletes update in real-time
- [ ] Typing indicators work
- [ ] Message queue restoration works
- [ ] No duplicate messages
- [ ] Messages persist after page reload (React Query)
