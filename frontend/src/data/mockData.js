/**
 * Mock Data for UI Development and Testing
 * 
 * Why: Allows frontend development without backend dependency
 * How: Provides realistic sample data matching expected API responses
 * Impact: Enables parallel frontend/backend development and UI testing
 */

// Mock users data - simulates user accounts in the system
export const mockUsers = [
  {
    _id: "user1",
    username: "alice",
    email: "alice@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    _id: "user2",
    username: "bob",
    email: "bob@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  },
  {
    _id: "user3",
    username: "charlie",
    email: "charlie@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
    lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    _id: "user4",
    username: "diana",
    email: "diana@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
    lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
  {
    _id: "user5",
    username: "eve",
    email: "eve@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
    lastSeen: new Date(), // Online now
  },
]

// Mock channels data - simulates chat channels
export const mockChannels = [
  {
    _id: "channel1",
    name: "general",
    description: "General discussion channel",
    members: ["user1", "user2", "user3", "user4", "user5"],
    createdBy: "user1",
    isPrivate: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    memberCount: 5,
  },
  {
    _id: "channel2",
    name: "random",
    description: "Random conversations",
    members: ["user1", "user2", "user5"],
    createdBy: "user2",
    isPrivate: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    memberCount: 3,
  },
  {
    _id: "channel3",
    name: "development",
    description: "Development team discussions",
    members: ["user1", "user3", "user4"],
    createdBy: "user3",
    isPrivate: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    memberCount: 3,
  },
  {
    _id: "channel4",
    name: "design",
    description: "Design team channel",
    members: ["user2", "user4", "user5"],
    createdBy: "user4",
    isPrivate: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    memberCount: 3,
  },
]

// Mock messages data - simulates chat messages in channels
export const mockMessages = {
  channel1: [
    {
      _id: "msg1",
      sender: "user1",
      channel: "channel1",
      content: "Welcome to the general channel! 👋",
      messageType: "text",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg2",
      sender: "user2",
      channel: "channel1",
      content: "Thanks! Happy to be here.",
      messageType: "text",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000),
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg3",
      sender: "user3",
      channel: "channel1",
      content: "Check out this cool project: https://github.com/example/awesome-project",
      messageType: "link",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      linkPreview: {
        url: "https://github.com/example/awesome-project",
        title: "Awesome Project",
        description: "An amazing open source project",
        image: "https://via.placeholder.com/400x200",
        siteName: "GitHub",
      },
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg4",
      sender: "user4",
      channel: "channel1",
      content: "Here's a great video tutorial: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      messageType: "video",
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      videoEmbed: {
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg5",
      sender: "user5",
      channel: "channel1",
      content: "This is a test message that was edited",
      messageType: "text",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      editedAt: new Date(Date.now() - 25 * 60 * 1000), // Edited 25 minutes ago
      isDeleted: false,
    },
    {
      _id: "msg6",
      sender: "user1",
      channel: "channel1",
      content: "File upload test",
      messageType: "file",
      timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      attachments: [
        {
          fileUrl: "https://via.placeholder.com/800x600",
          fileName: "screenshot.png",
          fileType: "image/png",
          fileSize: 245760,
          thumbnailUrl: "https://via.placeholder.com/200x150",
        },
      ],
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg7",
      sender: "user2",
      channel: "channel1",
      content: "Hello everyone!",
      messageType: "text",
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg8",
      sender: "user3",
      channel: "channel1",
      content: "This message was deleted",
      messageType: "text",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      editedAt: null,
      isDeleted: true,
      deletedAt: new Date(Date.now() - 3 * 60 * 1000),
    },
  ],
  channel2: [
    {
      _id: "msg9",
      sender: "user1",
      channel: "channel2",
      content: "Random thoughts here!",
      messageType: "text",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      editedAt: null,
      isDeleted: false,
    },
    {
      _id: "msg10",
      sender: "user2",
      channel: "channel2",
      content: "I agree!",
      messageType: "text",
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      editedAt: null,
      isDeleted: false,
    },
  ],
  channel3: [
    {
      _id: "msg11",
      sender: "user1",
      channel: "channel3",
      content: "Let's discuss the new feature",
      messageType: "text",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      editedAt: null,
      isDeleted: false,
    },
  ],
  channel4: [
    {
      _id: "msg12",
      sender: "user2",
      channel: "channel4",
      content: "Design mockups are ready!",
      messageType: "text",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      editedAt: null,
      isDeleted: false,
    },
  ],
}

// Mock presence data - simulates online/offline status
export const mockPresence = {
  online: ["user1", "user2", "user5"], // Currently online users
  typing: {
    channel1: ["user2"], // Users currently typing in channel1
    channel2: [],
    channel3: [],
    channel4: [],
  },
}

// Current user (simulated logged-in user)
export const mockCurrentUser = {
  _id: "user1",
  username: "alice",
  email: "alice@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
}

/**
 * Helper function to get user by ID
 * Why: Centralized user lookup for components
 * How: Searches mockUsers array
 * Impact: Consistent user data access across components
 */
export function getUserById(userId) {
  return mockUsers.find((user) => user._id === userId) || null
}

/**
 * Helper function to get channel by ID
 * Why: Centralized channel lookup
 * How: Searches mockChannels array
 * Impact: Consistent channel data access
 */
export function getChannelById(channelId) {
  return mockChannels.find((channel) => channel._id === channelId) || null
}

/**
 * Helper function to get messages for a channel
 * Why: Centralized message retrieval
 * How: Returns messages from mockMessages object
 * Impact: Consistent message data access
 */
export function getMessagesByChannel(channelId) {
  return mockMessages[channelId] || []
}

/**
 * Helper function to check if user is online
 * Why: Centralized presence check
 * How: Checks mockPresence.online array
 * Impact: Consistent presence status across UI
 */
export function isUserOnline(userId) {
  return mockPresence.online.includes(userId)
}

/**
 * Helper function to get typing users in a channel
 * Why: Centralized typing indicator data
 * How: Returns typing users from mockPresence.typing
 * Impact: Consistent typing indicator behavior
 */
export function getTypingUsers(channelId) {
  return mockPresence.typing[channelId] || []
}

