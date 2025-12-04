# 48-Hour Cleanup Documentation

This document explains the comprehensive 48-hour cleanup system for the Chai Tapri application.

## Overview

The cleanup system automatically removes data older than 48 hours to maintain user privacy and prevent data bloat. The cleanup runs every hour and processes multiple types of data.

## What Gets Cleaned

### 1. Messages (Both Channel and Direct Messages)
- **What**: All messages older than 48 hours
- **Why**: Maintain user privacy by removing old conversations
- **How**: Deletes messages from MongoDB where `timestamp < (now - 48 hours)`
- **Impact**: Old messages are permanently removed from database

### 2. Empty Conversations
- **What**: Conversation records with no associated messages
- **Why**: Prevent orphaned conversation records
- **How**: After message deletion, checks if conversations have any messages and deletes empty ones
- **Impact**: Database stays clean without orphaned records

### 3. Redis Presence Data
- **What**: Stale presence data in Redis
  - Online users who are actually offline
  - Channel presence for non-existent channels
  - Channel presence for users no longer in channels
  - Typing indicators without expiration
- **Why**: Prevent Redis memory bloat from stale data
- **How**: 
  - Validates online users against database
  - Validates channel presence against channel members
  - Removes typing indicators without expiration
- **Impact**: Redis memory usage stays optimal

### 4. S3 File Attachments
- **What**: Files in S3 associated with deleted messages
- **Why**: Prevent orphaned files in S3 bucket
- **How**: Extracts S3 keys from message attachments before deletion, then deletes files from S3
- **Impact**: S3 bucket doesn't accumulate orphaned files

## What Does NOT Get Cleaned

### Users
- **Why**: User accounts are preserved for authentication and user management
- **Impact**: Users can always log back in and access their account

### Channels
- **Why**: Channel metadata is preserved for channel management
- **Impact**: Channels remain available even after all messages are deleted

## Cleanup Schedule

- **Frequency**: Every hour
- **Initial Run**: Immediately on server startup
- **Interval**: 60 minutes (3,600,000 milliseconds)

## Cleanup Process Flow

```
1. Calculate cutoff time (48 hours ago)
   ↓
2. Find messages older than cutoff
   ↓
3. Extract S3 keys from message attachments
   ↓
4. Delete messages from MongoDB
   ↓
5. Delete associated S3 files
   ↓
6. Delete empty conversations
   ↓
7. Clean up Redis presence data
   ↓
8. Log cleanup results
```

## Implementation Details

### Message Deletion

```javascript
// Cutoff time calculation
const cutoffTime = new Date()
cutoffTime.setHours(cutoffTime.getHours() - 48)

// Delete messages (both channel and conversation messages)
await Message.deleteMany({
  timestamp: { $lt: cutoffTime }
})
```

### S3 Key Extraction

S3 keys are extracted from `fileUrl` in message attachments:
- **URL Format**: `https://bucket.s3.region.amazonaws.com/uploads/userId/timestamp-filename`
- **S3 Key Format**: `uploads/userId/timestamp-filename`
- **Extraction**: Parses URL and extracts pathname as S3 key

### Empty Conversation Cleanup

```javascript
// Find all conversations
const conversations = await Conversation.find({})

// Check each conversation for messages
for (const conversation of conversations) {
  const messageCount = await Message.countDocuments({
    conversation: conversation._id
  })
  
  // Delete if no messages
  if (messageCount === 0) {
    await Conversation.findByIdAndDelete(conversation._id)
  }
}
```

### Redis Cleanup

1. **Online Users**: Validates against database `isOnline` status
2. **Channel Presence**: Validates against channel members
3. **Typing Indicators**: Removes keys without expiration

## Error Handling

- **MongoDB Errors**: Logged and thrown (prevents silent failures)
- **Redis Errors**: Logged but don't stop cleanup (Redis is optional)
- **S3 Errors**: Logged per file but continue with other files

## Logging

All cleanup operations are logged:
- Success: Number of items deleted/cleaned
- Errors: Detailed error messages
- Warnings: Non-critical issues (e.g., Redis unavailable)

Example logs:
```
[Message Cleanup] Deleted 150 messages older than 48 hours
[Message Cleanup] Deleted 25 files from S3
[Message Cleanup] Deleted 10 empty conversations
[Message Cleanup] Cleaned 5 stale Redis entries
```

## Manual Cleanup

You can manually trigger cleanup by calling:

```javascript
const { runCompleteCleanup } = require('./utils/messageCleanup')

// Run complete cleanup
const results = await runCompleteCleanup()
console.log(results)
```

## Monitoring

Monitor cleanup effectiveness:
1. Check server logs for cleanup messages
2. Monitor MongoDB collection sizes
3. Monitor Redis memory usage
4. Monitor S3 bucket size

## Configuration

Cleanup is configured in `backend/src/utils/messageCleanup.js`:
- **Cutoff Time**: 48 hours (hardcoded)
- **Schedule Interval**: 1 hour (hardcoded)
- **S3 Deletion**: Enabled by default
- **Redis Cleanup**: Enabled if Redis is available

## Privacy Notice

The application displays a privacy notice in chat windows:
> "For privacy, we will be deleting conversation after 48 hours."

This notice informs users that their messages will be automatically deleted after 48 hours.

## Testing

To test cleanup:
1. Create test messages with timestamps older than 48 hours
2. Manually trigger cleanup: `runCompleteCleanup()`
3. Verify messages are deleted
4. Verify S3 files are deleted
5. Verify empty conversations are deleted
6. Verify Redis data is cleaned

## Troubleshooting

### Messages Not Being Deleted
- Check MongoDB connection
- Verify message timestamps are correct
- Check server logs for errors

### S3 Files Not Being Deleted
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Verify S3 key extraction logic

### Redis Cleanup Not Working
- Check Redis connection
- Verify Redis client is initialized
- Check Redis key patterns

### Empty Conversations Not Deleted
- Verify conversation query logic
- Check for messages with conversation reference
- Verify deletion logic

## Future Enhancements

Potential improvements:
1. Configurable cleanup interval (environment variable)
2. Configurable cutoff time (environment variable)
3. Cleanup statistics endpoint
4. Scheduled cleanup reports
5. Selective cleanup (by message type, channel, etc.)

