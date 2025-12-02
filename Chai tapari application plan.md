Chai Tapri Team Chat Application - Initial Design Document

This document outlines the complete design, architecture, and implementation plan for the Chai Tapri team chat application before development begins.

1. Application Overview

1.1 Purpose
Build a full-stack Slack-like team chat application with real-time messaging, channels, user presence, file sharing, link previews, and video embedding capabilities.

1.2 Core Features
- User authentication with session management
- Real-time messaging via WebSockets
- Channel management (create, join, leave)
- Online/offline presence tracking
- Message history with pagination
- File upload and sharing
- Link preview generation
- Video embedding in iframe (WhatsApp-style)
- Typing indicators
- Message editing and deletion
- Performance optimizations and latency management

1.3 Technology Stack

1.3.1 Frontend
- React (Create React App)
- React Bits patterns for component architecture
- Material-UI or Chakra UI for UI components
- Socket.io-client for WebSocket communication
- Axios for REST API calls
- React Window for virtualized lists
- Framer Motion for animations
- React Query for data fetching and caching

1.3.2 Backend
- Node.js with Express.js
- Socket.io for WebSocket server
- MongoDB with Mongoose for database
- Redis for presence tracking and caching
- Multer for file upload handling
- Express-session with Redis store
- Link preview library (link-preview-js or oembed-parser)
- Image processing (sharp or jimp)

1.3.3 Infrastructure
- MongoDB Atlas or Neon (PostgreSQL alternative)
- Redis Cloud or Railway Redis
- Cloudinary or AWS S3 for file storage
- API Gateway (Nginx or Express Gateway for production)
- CDN for static assets

2. System Architecture

2.1 High-Level Architecture

React Frontend (REST + WebSockets)
    |
    v
Load Balancer / API Gateway
    |
    v
Node.js Backend (Express + Socket.io)
    |
    +-----------+-----------+-----------+
    |           |           |           |
    v           v           v           v
MongoDB    Redis      File Storage  Message Queue
(users,    (presence,  (Cloudinary/  (optional for
channels,  sessions,   S3)          future scaling)
messages)  cache)

2.2 API Gateway Architecture

2.2.1 Why API Gateway
- Single entry point for all client requests
- Request routing and load balancing
- Authentication and authorization middleware
- Rate limiting and DDoS protection
- Request/response transformation
- API versioning
- WebSocket connection management
- Request logging and monitoring

2.2.2 API Gateway Implementation Options

Option 1: Nginx as Reverse Proxy
- Configure Nginx as reverse proxy
- Route REST API requests to Express backend
- Proxy WebSocket connections to Socket.io server
- Handle SSL/TLS termination
- Serve static files from CDN
- Rate limiting with nginx rate limit module

Option 2: Express Gateway
- Express-based API gateway
- Built-in plugins for authentication, rate limiting
- WebSocket support
- Easier configuration for Node.js ecosystem
- Good for microservices architecture

Option 3: Cloud Provider Gateway
- AWS API Gateway
- Google Cloud Endpoints
- Azure API Management
- Managed service with built-in features

2.2.3 Recommended Approach
Start with Nginx for production deployment. It provides excellent performance, WebSocket support, and is widely used. For development, use Express directly without gateway.

3. Database Design

3.1 User Schema
- _id: ObjectId
- username: String (unique, required)
- email: String (unique, required)
- password: String (hashed with bcrypt)
- avatar: String (URL to profile image)
- createdAt: Date
- lastSeen: Date

3.2 Channel Schema
- _id: ObjectId
- name: String (required, unique)
- description: String
- members: Array of ObjectId (references to User)
- createdBy: ObjectId (reference to User)
- isPrivate: Boolean (default: false)
- createdAt: Date
- updatedAt: Date

3.3 Message Schema
- _id: ObjectId
- sender: ObjectId (reference to User)
- channel: ObjectId (reference to Channel)
- content: String (text content)
- messageType: String (enum: text, file, link, video)
- attachments: Array of Object
  - fileUrl: String
  - fileName: String
  - fileType: String
  - fileSize: Number
  - thumbnailUrl: String (for images/videos)
- linkPreview: Object (optional)
  - url: String
  - title: String
  - description: String
  - image: String
  - siteName: String
- videoEmbed: Object (optional)
  - provider: String (youtube, vimeo, etc.)
  - videoId: String
  - embedUrl: String
- timestamp: Date
- editedAt: Date (optional)
- isDeleted: Boolean (default: false)
- deletedAt: Date (optional)

3.4 File Metadata Schema (optional separate collection)
- _id: ObjectId
- originalName: String
- storedName: String
- fileType: String
- fileSize: Number
- mimeType: String
- uploadUrl: String
- thumbnailUrl: String (for images/videos)
- uploadedBy: ObjectId (reference to User)
- uploadedAt: Date
- channel: ObjectId (reference to Channel)

4. API Design

4.1 Authentication Endpoints

4.1.1 POST /api/auth/signup
Request Body:
- username: String
- email: String
- password: String

Response:
- success: Boolean
- user: User object (without password)
- sessionId: String (in cookie)

4.1.2 POST /api/auth/login
Request Body:
- email: String
- password: String

Response:
- success: Boolean
- user: User object
- sessionId: String (in cookie)

4.1.3 POST /api/auth/logout
Response:
- success: Boolean

4.1.4 GET /api/auth/me
Response:
- user: User object or null

4.2 Channel Endpoints

4.2.1 GET /api/channels
Query Parameters:
- includePrivate: Boolean (default: false)

Response:
- channels: Array of Channel objects with member count

4.2.2 POST /api/channels
Request Body:
- name: String
- description: String (optional)
- isPrivate: Boolean (optional)

Response:
- channel: Channel object

4.2.3 GET /api/channels/:channelId
Response:
- channel: Channel object with full member details

4.2.4 POST /api/channels/:channelId/join
Response:
- success: Boolean
- channel: Updated Channel object

4.2.5 POST /api/channels/:channelId/leave
Response:
- success: Boolean

4.3 Message Endpoints

4.3.1 GET /api/channels/:channelId/messages
Query Parameters:
- page: Number (default: 1)
- limit: Number (default: 50)
- before: Date (ISO string, for cursor-based pagination)

Response:
- messages: Array of Message objects
- pagination: Object
  - hasMore: Boolean
  - nextCursor: Date (optional)
  - total: Number

4.3.2 POST /api/channels/:channelId/messages
Request Body:
- content: String (required if no file)
- file: File (multipart/form-data, optional)
- messageType: String (text, file, link, video)

Response:
- message: Message object

4.3.3 PATCH /api/messages/:messageId
Request Body:
- content: String

Response:
- message: Updated Message object

4.3.4 DELETE /api/messages/:messageId
Response:
- success: Boolean

4.4 File Upload Endpoint

4.4.1 POST /api/upload
Request:
- file: File (multipart/form-data)
- channelId: String (optional, for direct channel upload)

Response:
- fileUrl: String
- thumbnailUrl: String (if image/video)
- fileName: String
- fileType: String
- fileSize: Number

4.5 Link Preview Endpoint

4.5.1 POST /api/link-preview
Request Body:
- url: String

Response:
- preview: Object
  - url: String
  - title: String
  - description: String
  - image: String
  - siteName: String

5. WebSocket Events

5.1 Client to Server Events

5.1.1 join-channel
Payload:
- channelId: String

5.1.2 leave-channel
Payload:
- channelId: String

5.1.3 send-message
Payload:
- channelId: String
- content: String
- messageType: String
- attachments: Array (optional)
- linkPreview: Object (optional)
- videoEmbed: Object (optional)

5.1.4 typing-start
Payload:
- channelId: String

5.1.5 typing-stop
Payload:
- channelId: String

5.1.6 edit-message
Payload:
- messageId: String
- content: String

5.1.7 delete-message
Payload:
- messageId: String

5.2 Server to Client Events

5.2.1 new-message
Payload:
- message: Message object

5.2.2 message-edited
Payload:
- message: Updated Message object

5.2.3 message-deleted
Payload:
- messageId: String
- channelId: String

5.2.4 user-typing
Payload:
- userId: String
- username: String
- channelId: String

5.2.5 user-stopped-typing
Payload:
- userId: String
- channelId: String

5.2.6 presence-update
Payload:
- userId: String
- status: String (online, offline)
- channelId: String (optional)

5.2.7 user-joined-channel
Payload:
- userId: String
- username: String
- channelId: String

5.2.8 user-left-channel
Payload:
- userId: String
- channelId: String

6. File Upload Implementation

6.1 Frontend File Upload

6.1.1 File Input Component
- Add file picker button in message input area
- Support multiple file types: images, documents, videos
- Show file preview before upload
- Display upload progress indicator
- Maximum file size validation (client-side)

6.1.2 Upload Process
- Use FormData for multipart/form-data upload
- Show progress bar using axios onUploadProgress
- Debounce rapid file selections
- Queue multiple file uploads
- Display thumbnail preview for images
- Show file name and size for documents

6.1.3 File Types Supported
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx, txt
- Videos: mp4, webm, mov (with size limits)

6.2 Backend File Upload

6.2.1 Multer Configuration
- Set file size limits (e.g., 10MB for images, 50MB for videos)
- Configure storage: Cloudinary or S3
- Generate unique file names
- Validate file types
- Create thumbnails for images and videos

6.2.2 File Processing
- Compress images to reduce size
- Generate thumbnails for images (200x200px)
- Extract video thumbnail (first frame)
- Store original and processed versions
- Return URLs for both original and thumbnail

6.2.3 Storage Strategy
- Use Cloudinary for automatic optimization
- Or AWS S3 with CloudFront CDN
- Store file metadata in MongoDB
- Implement file cleanup for deleted messages

7. Link Preview Implementation

7.1 Link Detection

7.1.1 URL Parsing
- Detect URLs in message content using regex
- Extract clean URL from text
- Validate URL format
- Support http, https protocols

7.1.2 Preview Generation
- Use link-preview-js or oembed-parser library
- Fetch Open Graph metadata
- Fallback to basic HTML parsing
- Cache previews in Redis (TTL: 24 hours)
- Handle errors gracefully (show URL only)

7.2 Preview Display

7.2.1 Preview Card Component
- Display preview when URL is detected
- Show title, description, image
- Clickable link to open in new tab
- Loading state while fetching
- Error state if preview fails

7.2.2 Performance
- Debounce link detection (wait for user to finish typing)
- Fetch preview asynchronously
- Cache previews to avoid duplicate requests
- Lazy load preview images

8. Video Embedding Implementation

8.1 Video URL Detection

8.1.1 Supported Platforms
- YouTube (youtube.com, youtu.be)
- Vimeo (vimeo.com)
- Dailymotion (dailymotion.com)
- Custom video URLs (mp4, webm)

8.1.2 URL Parsing
- Extract video ID from platform URLs
- Generate embed URL for iframe
- Validate video accessibility
- Handle private/unavailable videos

8.2 Video Embed Component

8.2.1 Iframe Embedding
- Render iframe with platform embed URL
- Responsive iframe sizing (16:9 aspect ratio)
- Lazy load videos (load on scroll into view)
- Show thumbnail before loading
- Play button overlay

8.2.2 Direct Video Files
- For direct video URLs, use HTML5 video tag
- Show video controls
- Generate thumbnail from video
- Support multiple video formats

8.3 Performance Considerations
- Load iframe only when message is visible
- Use intersection observer for lazy loading
- Limit number of simultaneous video loads
- Pause videos when scrolled out of view

9. Performance Optimizations

9.1 Frontend Performance

9.1.1 React Optimizations
- Use React.memo for message components
- Implement useCallback for event handlers
- Use useMemo for expensive computations
- Code splitting with React.lazy
- Route-based code splitting

9.1.2 Virtualization
- Use react-window for message list
- Render only visible messages
- Dynamic item heights for messages with media
- Smooth scrolling with virtual scrolling

9.1.3 Debouncing and Throttling
- Debounce message input (300ms delay)
- Debounce typing indicator (500ms)
- Debounce link detection (1000ms)
- Throttle scroll events (100ms)
- Throttle resize events (200ms)

9.1.4 Image Optimization
- Lazy load images with intersection observer
- Use low-quality image placeholders (LQIP)
- Serve WebP format with fallback
- Responsive images (srcset)
- Progressive image loading

9.1.5 Caching Strategy
- Use React Query for API response caching
- Cache channel list (5 minutes)
- Cache user presence (30 seconds)
- Cache link previews (24 hours)
- Service worker for offline support (optional)

9.2 Backend Performance

9.2.1 Database Optimizations
- Create indexes on frequently queried fields
  - Messages: channel, timestamp (compound index)
  - Channels: name, members
  - Users: email, username
- Use aggregation pipelines for complex queries
- Implement connection pooling
- Use lean queries when possible

9.2.2 Caching
- Cache channel lists in Redis (5 minutes)
- Cache user presence in Redis (real-time)
- Cache link previews in Redis (24 hours)
- Cache frequently accessed user data
- Implement cache invalidation strategy

9.2.3 API Response Optimization
- Paginate all list endpoints
- Use cursor-based pagination for messages
- Limit response payload size
- Compress responses with gzip
- Use HTTP/2 for multiplexing

9.3 WebSocket Performance

9.3.1 Connection Management
- Limit connections per user
- Implement connection pooling
- Use Redis adapter for Socket.io scaling
- Handle reconnection efficiently
- Batch multiple events when possible

9.3.2 Message Broadcasting
- Use Socket.io rooms for efficient broadcasting
- Avoid broadcasting to sender
- Compress large payloads
- Rate limit message sending
- Queue messages during high load

10. Latency Management

10.1 Frontend Latency Reduction

10.1.1 Optimistic Updates
- Show sent message immediately (optimistic UI)
- Update UI before server confirmation
- Rollback on error
- Mark message as pending until confirmed

10.1.2 Prefetching
- Prefetch next page of messages on scroll
- Prefetch channel details on hover
- Prefetch user profiles
- Preload critical assets

10.1.3 Request Batching
- Batch multiple API calls when possible
- Combine presence updates
- Batch file uploads
- Group WebSocket events

10.2 Backend Latency Reduction

10.2.1 Database Query Optimization
- Use select to limit fields returned
- Implement query result caching
- Use database read replicas (if available)
- Optimize aggregation queries

10.2.2 Async Processing
- Process file uploads asynchronously
- Generate link previews in background
- Send emails/notifications asynchronously
- Use message queue for heavy operations

10.2.3 CDN Usage
- Serve static assets from CDN
- Cache API responses at edge
- Use CDN for file storage
- Geographic distribution

10.3 Network Optimization

10.3.1 Compression
- Enable gzip/brotli compression
- Compress WebSocket messages
- Optimize image sizes
- Minify JavaScript and CSS

10.3.2 Connection Optimization
- Use HTTP/2 or HTTP/3
- Implement keep-alive connections
- WebSocket connection reuse
- Reduce DNS lookups

11. UI Component Architecture with React Bits

11.1 Component Structure

11.1.1 Atomic Design Principles
- Atoms: Button, Input, Avatar, Icon
- Molecules: MessageInput, ChannelItem, UserBadge
- Organisms: ChannelList, MessageList, ChatWindow
- Templates: MainLayout, AuthLayout
- Pages: ChatPage, LoginPage, SignupPage

11.1.2 Component Patterns
- Container/Presenter pattern
- Custom hooks for logic separation
- Context API for global state
- Compound components for complex UI

11.2 Animation Strategy

11.2.1 Framer Motion Integration
- Page transitions
- Message appearance animations
- Typing indicator animations
- Presence status transitions
- Modal/drawer animations
- Smooth scroll animations

11.2.2 Performance-Focused Animations
- Use transform and opacity (GPU accelerated)
- Avoid animating layout properties
- Use will-change CSS property
- Reduce animation complexity on low-end devices
- Respect prefers-reduced-motion

11.3 Component Library Integration

11.3.1 Material-UI or Chakra UI
- Use for base components (Button, Input, Modal)
- Customize theme to match design
- Create wrapper components
- Maintain consistency across app

11.3.2 Custom Components
- Build chat-specific components
- Message bubble with tail
- Channel sidebar
- Online status indicator
- File upload preview
- Link preview card
- Video embed container

12. Design Process

12.1 Phase 1: Planning and Design (Week 1)

12.1.1 Requirements Analysis
- Review assignment requirements
- Identify core features
- List optional features
- Define user stories
- Create user flow diagrams

12.1.2 System Design
- Create architecture diagrams
- Design database schema
- Plan API endpoints
- Design WebSocket events
- Plan file storage strategy

12.1.3 UI/UX Design
- Create wireframes
- Design component library
- Plan responsive breakpoints
- Define color scheme and typography
- Create interaction patterns

12.2 Phase 2: Backend Development (Week 2-3)

12.2.1 Setup and Configuration
- Initialize Node.js project
- Set up Express server
- Configure MongoDB connection
- Set up Redis connection
- Configure environment variables

12.2.2 Core Features
- Implement authentication system
- Create database models
- Build REST API endpoints
- Implement file upload
- Set up Socket.io server

12.2.3 Advanced Features
- Implement presence tracking
- Add link preview generation
- Set up video embedding
- Add message pagination
- Implement caching

12.3 Phase 3: Frontend Development (Week 3-4)

12.3.1 Setup and Configuration
- Initialize React app
- Set up routing
- Configure API client
- Set up Socket.io client
- Configure UI library

12.3.2 Core Components
- Build authentication pages
- Create channel list component
- Build chat window
- Implement message list
- Create message input

12.3.3 Advanced Features
- Add file upload UI
- Implement link preview display
- Add video embedding
- Create typing indicators
- Build presence UI

12.4 Phase 4: Integration and Optimization (Week 4-5)

12.4.1 Integration
- Connect frontend to backend
- Test real-time messaging
- Test file uploads
- Test link previews
- Test video embedding

12.4.2 Performance Optimization
- Implement virtualization
- Add debouncing/throttling
- Optimize images
- Implement caching
- Reduce bundle size

12.4.3 Testing
- Test authentication flow
- Test channel operations
- Test messaging
- Test file uploads
- Test presence tracking
- Cross-browser testing

12.5 Phase 5: Deployment and Documentation (Week 5)

12.5.1 Deployment
- Set up MongoDB Atlas
- Set up Redis Cloud
- Configure file storage (Cloudinary)
- Deploy backend (Render/Railway)
- Deploy frontend (Vercel/Netlify)
- Configure API Gateway (Nginx)

12.5.2 Documentation
- Write README.md
- Document API endpoints
- Document WebSocket events
- Create setup instructions
- Add code comments
- Create deployment guide

12.5.3 Final Testing
- End-to-end testing
- Load testing
- Security testing
- User acceptance testing
- Performance testing

13. API Gateway Configuration

13.1 Nginx Configuration for Development

13.1.1 Basic Reverse Proxy
- Proxy REST API requests to Express backend
- Proxy WebSocket connections to Socket.io
- Handle CORS headers
- Configure SSL/TLS

13.1.2 Rate Limiting
- Limit requests per IP
- Limit WebSocket connections
- Configure burst limits
- Set up rate limit zones

13.1.3 Load Balancing
- Configure upstream servers
- Set load balancing algorithm (round-robin, least-conn)
- Health check configuration
- Failover handling

13.2 Production API Gateway Setup

13.2.1 Express Gateway (Alternative)
- Install Express Gateway
- Configure gateway policies
- Set up authentication plugin
- Configure rate limiting plugin
- Set up logging and monitoring

13.2.2 Cloud API Gateway (Alternative)
- AWS API Gateway setup
- Configure API endpoints
- Set up WebSocket API
- Configure authorizers
- Set up throttling

14. Security Considerations

14.1 Authentication Security
- Use secure session cookies (HttpOnly, Secure, SameSite)
- Implement CSRF protection
- Hash passwords with bcrypt (salt rounds: 10)
- Implement session expiration
- Rate limit login attempts

14.2 File Upload Security
- Validate file types (whitelist approach)
- Limit file sizes
- Scan files for malware (optional)
- Sanitize file names
- Store files outside web root

14.3 API Security
- Validate all input data
- Sanitize user inputs
- Implement rate limiting
- Use HTTPS only
- Set proper CORS headers

14.4 WebSocket Security
- Authenticate WebSocket connections
- Validate all WebSocket messages
- Rate limit message sending
- Prevent message flooding
- Implement connection limits

15. Monitoring and Logging

15.1 Application Logging
- Log all API requests
- Log WebSocket events
- Log errors with stack traces
- Log authentication events
- Use structured logging (JSON)

15.2 Performance Monitoring
- Monitor API response times
- Track WebSocket connection count
- Monitor database query performance
- Track file upload success rates
- Monitor error rates

15.3 User Analytics (Optional)
- Track active users
- Monitor message volume
- Track channel usage
- Monitor feature usage

16. Future Enhancements

16.1 Scalability Improvements
- Implement message queue (RabbitMQ/Kafka)
- Add database read replicas
- Implement microservices architecture
- Add horizontal scaling support
- Implement sharding for messages

16.2 Additional Features
- Private direct messages
- Message search functionality
- Message reactions/emojis
- File sharing improvements
- Voice/video calling (WebRTC)
- Mobile app (React Native)

17. Development Guidelines

17.1 Code Organization
- Follow consistent file structure
- Use meaningful variable and function names
- Write self-documenting code
- Keep functions small and focused
- Separate concerns (business logic vs presentation)

17.2 Git Workflow
- Use feature branches
- Write descriptive commit messages
- Create pull requests for review
- Keep main branch deployable
- Tag releases

17.3 Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Test WebSocket events
- Performance testing

18. Environment Variables

18.1 Backend Environment Variables
- PORT: Server port number
- MONGODB_URI: MongoDB connection string
- REDIS_URI: Redis connection string
- SESSION_SECRET: Secret for session encryption
- CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
- CLOUDINARY_API_KEY: Cloudinary API key
- CLOUDINARY_API_SECRET: Cloudinary API secret
- CORS_ORIGIN: Allowed CORS origins
- NODE_ENV: Environment (development/production)

18.2 Frontend Environment Variables
- REACT_APP_API_URL: Backend API URL
- REACT_APP_WS_URL: WebSocket server URL
- REACT_APP_CLOUDINARY_URL: Cloudinary URL for images

19. Deployment Checklist

19.1 Pre-Deployment
- All environment variables configured
- Database migrations completed
- File storage configured
- Redis configured
- SSL certificates obtained
- Domain names configured

19.2 Deployment Steps
- Deploy backend service
- Deploy frontend application
- Configure API Gateway
- Set up monitoring
- Configure backups
- Test all features

19.3 Post-Deployment
- Verify all endpoints working
- Test WebSocket connections
- Test file uploads
- Monitor error logs
- Check performance metrics
- Gather user feedback

20. Success Criteria

20.1 Functional Requirements
- Users can sign up and log in
- Users can create and join channels
- Real-time messaging works across multiple users
- Presence tracking shows online/offline status
- File uploads work correctly
- Link previews display properly
- Videos embed correctly
- Message pagination works
- Typing indicators function
- Message editing and deletion work

20.2 Performance Requirements
- Page load time under 2 seconds
- Message delivery latency under 100ms
- File upload handles files up to 50MB
- Application supports 100+ concurrent users
- Smooth scrolling with 1000+ messages
- Responsive on mobile devices

20.3 Quality Requirements
- No critical bugs
- Clean and intuitive UI
- Proper error handling
- Comprehensive documentation
- Code follows best practices
- Application is deployed and accessible

This design document serves as the blueprint for building the Chai Tapri team chat application. All development should follow this plan, with updates documented as the project evolves.

