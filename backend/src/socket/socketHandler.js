/**
 * WebSocket Handler
 * 
 * Why: Handle real-time communication via WebSocket
 * How: Manages Socket.IO connections, events, and presence tracking
 * Impact: Enables real-time messaging and presence features
 * 
 * Common Errors:
 * 1. Authentication failed - Invalid or missing token
 * 2. Channel not found - Invalid channel ID
 * 3. User not member - User not member of channel
 * 4. Connection error - Network or server issues
 */

const User = require('../models/User')
const Channel = require('../models/Channel')
const Message = require('../models/Message')
const authService = require('../services/authService')
const messageService = require('../services/messageService')
const { getRedisClient } = require('../config/redis')
const logger = require('../utils/logger')

/**
 * Initialize Socket.IO handler
 * Why: Set up WebSocket server for real-time features
 * How: Configures Socket.IO with authentication and event handlers
 * Impact: Real-time messaging and presence tracking enabled
 * 
 * Flow:
 * 1. Authenticate socket connection
 * 2. Join user to presence room
 * 3. Handle channel join/leave
 * 4. Handle message sending
 * 5. Handle typing indicators
 * 6. Handle disconnection
 */
const socketHandler = (io, redisClient) => {
  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = authService.verifyToken(token)
      const user = await User.findById(decoded.userId)

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.userId = user._id.toString()
      socket.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      }

      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // Handle connection
  io.on('connection', async (socket) => {
    const userId = socket.userId
    const user = socket.user

    logger.info(`User connected: ${user.username} (${userId})`)

    try {
      // Add socket ID to user
      await User.findByIdAndUpdate(userId, {
        $push: { socketIds: socket.id },
        $set: { isOnline: true },
      })

      // Add to Redis presence set (if Redis available)
      if (redisClient) {
        try {
          await redisClient.sAdd('online_users', userId)
        } catch (error) {
          logger.warn('[Redis] Failed to add user to online set:', error.message)
        }
      }

      // Join user's personal room
      socket.join(`user:${userId}`)

      // Emit online status to all users
      io.emit('user:online', {
        userId,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      })

      // Handle channel join
      socket.on('join-channel', async (channelId) => {
        try {
          const channel = await Channel.findById(channelId)

          if (!channel) {
            return socket.emit('error', { message: 'Channel not found' })
          }

          if (!channel.isMember(userId)) {
            return socket.emit('error', { message: 'Not a member of this channel' })
          }

          socket.join(`channel:${channelId}`)
          socket.emit('channel:joined', { channelId })

          // Add to Redis channel presence (if Redis available)
          if (redisClient) {
            try {
              await redisClient.sAdd(`channel:${channelId}:members`, userId)
            } catch (error) {
              logger.warn('[Redis] Failed to add user to channel presence:', error.message)
            }
          }

          logger.info(`User ${user.username} joined channel ${channelId}`)
        } catch (error) {
          logger.error('Error joining channel:', error)
          socket.emit('error', { message: 'Failed to join channel' })
        }
      })

      // Handle channel leave
      socket.on('leave-channel', async (channelId) => {
        try {
          socket.leave(`channel:${channelId}`)
          socket.emit('channel:left', { channelId })

          // Remove from Redis channel presence (if Redis available)
          if (redisClient) {
            try {
              await redisClient.sRem(`channel:${channelId}:members`, userId)
            } catch (error) {
              logger.warn('[Redis] Failed to remove user from channel presence:', error.message)
            }
          }

          logger.info(`User ${user.username} left channel ${channelId}`)
        } catch (error) {
          logger.error('Error leaving channel:', error)
        }
      })

      // Handle send message
      socket.on('send-message', async (messageData) => {
        try {
          const { channelId, content, messageType, attachments, linkPreview, videoEmbed } = messageData

          const message = await messageService.createMessage({
            channelId,
            content,
            messageType: messageType || 'text',
            attachments: attachments || [],
            linkPreview: linkPreview || null,
            videoEmbed: videoEmbed || null,
          }, userId)

          await message.populate('sender', 'username email avatar')
          
          // Set initial status to 'sent'
          message.status = 'sent'
          await message.save()

          // Broadcast to channel immediately for fast delivery
          io.to(`channel:${channelId}`).emit('new-message', { message })

          // Update status to 'delivered' after a short delay
          setTimeout(async () => {
            try {
              const updatedMessage = await Message.findById(message._id)
              if (updatedMessage) {
                updatedMessage.status = 'delivered'
                await updatedMessage.save()
                // Notify sender about delivery
                socket.emit('message-status-update', {
                  messageId: message._id,
                  status: 'delivered',
                })
              }
            } catch (err) {
              logger.error('Error updating message status:', err)
            }
          }, 100)

          logger.info(`Message sent in channel ${channelId} by ${user.username}`)
        } catch (error) {
          logger.error('Error sending message:', error)
          socket.emit('error', { message: 'Failed to send message' })
        }
      })
      
      // Handle message read
      socket.on('message-read', async (data) => {
        try {
          const { messageId } = data
          const message = await Message.findById(messageId)
          
          if (!message) return
          
          // Check if user already read this message
          const alreadyRead = message.readBy.some(
            read => read.userId.toString() === userId
          )
          
          if (!alreadyRead) {
            message.readBy.push({
              userId: userId,
              readAt: new Date(),
            })
            
            // If all recipients have read, update status to 'read'
            const channel = await Channel.findById(message.channel)
            if (channel) {
              const memberCount = channel.members.length
              if (message.readBy.length >= memberCount - 1) { // -1 to exclude sender
                message.status = 'read'
              }
            }
            
            await message.save()
            
            // Notify sender about read status
            io.to(`user:${message.sender}`).emit('message-status-update', {
              messageId: message._id,
              status: message.status,
            })
          }
        } catch (error) {
          logger.error('Error handling message read:', error)
        }
      })

      // Handle typing start
      socket.on('typing-start', async (channelId) => {
        try {
          const channel = await Channel.findById(channelId)

          if (!channel || !channel.isMember(userId)) {
            return
          }

          // Add to typing set in Redis (if Redis available)
          if (redisClient) {
            try {
              await redisClient.sAdd(`channel:${channelId}:typing`, userId)
            } catch (error) {
              logger.warn('[Redis] Failed to add user to typing set:', error.message)
            }
          }

          // Broadcast to channel (except sender)
          socket.to(`channel:${channelId}`).emit('user-typing', {
            channelId,
            userId,
            username: user.username,
          })
        } catch (error) {
          logger.error('Error handling typing start:', error)
        }
      })

      // Handle typing stop
      socket.on('typing-stop', async (channelId) => {
        try {
          // Remove from typing set in Redis (if Redis available)
          if (redisClient) {
            try {
              await redisClient.sRem(`channel:${channelId}:typing`, userId)
            } catch (error) {
              logger.warn('[Redis] Failed to remove user from typing set:', error.message)
            }
          }

          // Broadcast to channel (except sender)
          socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
            channelId,
            userId,
          })
        } catch (error) {
          logger.error('Error handling typing stop:', error)
        }
      })

      // Handle edit message
      socket.on('edit-message', async (messageData) => {
        try {
          const { messageId, content } = messageData

          const message = await messageService.editMessage(messageId, content, userId)
          await message.populate('sender', 'username email avatar')
          await message.populate('conversation', 'participants')

          // Broadcast to channel or conversation
          if (message.channel) {
            // Channel message - broadcast to channel room
            io.to(`channel:${message.channel}`).emit('message-edited', { message })
            logger.info(`Message edited in channel ${message.channel} by ${user.username}`)
          } else if (message.conversation) {
            // Direct message - broadcast to conversation participants
            const Conversation = require('../models/Conversation')
            const conversation = await Conversation.findById(message.conversation)
            if (conversation) {
              // Send to all participants
              conversation.participants.forEach(participantId => {
                const participantIdStr = participantId.toString()
                io.to(`user:${participantIdStr}`).emit('message-edited', { message })
              })
              logger.info(`Direct message edited in conversation ${message.conversation} by ${user.username}`)
            }
          }
        } catch (error) {
          logger.error('Error editing message:', error)
          socket.emit('error', { message: 'Failed to edit message' })
        }
      })

      // Handle delete message
      socket.on('delete-message', async (messageData) => {
        try {
          const { messageId } = messageData

          const message = await messageService.deleteMessage(messageId, userId)
          await message.populate('conversation', 'participants')

          // Broadcast to channel or conversation
          if (message.channel) {
            // Channel message - broadcast to channel room
            io.to(`channel:${message.channel}`).emit('message-deleted', { 
              messageId,
              channelId: message.channel 
            })
            logger.info(`Message deleted in channel ${message.channel} by ${user.username}`)
          } else if (message.conversation) {
            // Direct message - broadcast to conversation participants
            const Conversation = require('../models/Conversation')
            const conversation = await Conversation.findById(message.conversation)
            if (conversation) {
              // Send to all participants
              conversation.participants.forEach(participantId => {
                const participantIdStr = participantId.toString()
                io.to(`user:${participantIdStr}`).emit('message-deleted', { 
                  messageId,
                  conversationId: message.conversation 
                })
              })
              logger.info(`Direct message deleted in conversation ${message.conversation} by ${user.username}`)
            }
          }
        } catch (error) {
          logger.error('Error deleting message:', error)
          socket.emit('error', { message: 'Failed to delete message' })
        }
      })

      // Handle send direct message
      socket.on('send-direct-message', async (messageData) => {
        try {
          const { recipientId, content, messageType, attachments, linkPreview, videoEmbed } = messageData

          const directMessageService = require('../services/directMessageService')
          const message = await directMessageService.sendDirectMessage({
            recipientId,
            content,
            messageType: messageType || 'text',
            attachments: attachments || [],
            linkPreview: linkPreview || null,
            videoEmbed: videoEmbed || null,
          }, userId)

          await message.populate('sender', 'username email avatar')
          
          // Set initial status to 'sent'
          message.status = 'sent'
          await message.save()

          // Send to recipient
          io.to(`user:${recipientId}`).emit('new-direct-message', { message })

          // Also send back to sender for confirmation
          socket.emit('direct-message-sent', { message })

          // Update status to 'delivered' after a short delay
          setTimeout(async () => {
            try {
              const Conversation = require('../models/Conversation')
              const conversation = await Conversation.findOne({
                participants: { $all: [userId, recipientId] }
              })
              
              if (conversation) {
                const updatedMessage = await Message.findById(message._id)
                if (updatedMessage) {
                  updatedMessage.status = 'delivered'
                  await updatedMessage.save()
                  // Notify sender about delivery
                  socket.emit('message-status-update', {
                    messageId: message._id,
                    status: 'delivered',
                  })
                }
              }
            } catch (err) {
              logger.error('Error updating direct message status:', err)
            }
          }, 100)

          logger.info(`Direct message sent from ${user.username} to ${recipientId}`)
        } catch (error) {
          logger.error('Error sending direct message:', error)
          socket.emit('error', { message: 'Failed to send direct message' })
        }
      })

      // Handle direct message typing
      socket.on('direct-message-typing', async (data) => {
        try {
          const { conversationId, recipientId } = data
          
          // Send typing indicator to recipient
          if (recipientId) {
            io.to(`user:${recipientId}`).emit('direct-message-typing', {
              conversationId,
              userId,
              username: user.username,
            })
          }
        } catch (error) {
          logger.error('Error handling direct message typing:', error)
        }
      })

      // Handle direct message typing stop
      socket.on('direct-message-typing-stop', async (data) => {
        try {
          const { conversationId, recipientId } = data
          
          // Send typing stop to recipient
          if (recipientId) {
            io.to(`user:${recipientId}`).emit('direct-message-typing-stop', {
              conversationId,
              userId,
            })
          }
        } catch (error) {
          logger.error('Error handling direct message typing stop:', error)
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          const user = await User.findById(userId)

          if (user) {
            // Remove socket ID
            user.socketIds = user.socketIds.filter(id => id !== socket.id)

            // If no more socket IDs, mark offline
            if (user.socketIds.length === 0) {
              user.isOnline = false
              user.lastSeen = new Date()
              
              // Remove from Redis presence set (if Redis available)
              if (redisClient) {
                try {
                  await redisClient.sRem('online_users', userId)
                } catch (error) {
                  logger.warn('[Redis] Failed to remove user from online set:', error.message)
                }
              }
              
              // Emit offline status to all users
              io.emit('user:offline', { 
                userId,
                user: {
                  _id: user._id,
                  username: user.username,
                  email: user.email,
                  avatar: user.avatar,
                },
              })
            }

            await user.save()

            logger.info(`User disconnected: ${user.username} (${userId}), socketIds remaining: ${user.socketIds.length}`)
          }
        } catch (error) {
          logger.error('Error handling disconnect:', error)
        }
      })

    } catch (error) {
      logger.error('Socket connection error:', error)
      socket.emit('error', { message: 'Connection error' })
    }
  })
}

module.exports = socketHandler

