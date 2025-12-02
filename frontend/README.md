# Chai Tapri Frontend

React frontend application for the Chai Tapri team chat application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- User authentication (Login/Signup)
- Channel management
- Real-time messaging (with mock data)
- File upload UI
- Link previews
- Video embedding
- Typing indicators
- Online/offline presence
- Message editing and deletion

## Tech Stack

- React 18
- React Router DOM
- Tailwind CSS
- shadcn/ui components
- Framer Motion
- React Query
- Socket.io-client (for future WebSocket integration)

## Project Structure

```
src/
├── components/       # React components
│   ├── Auth/        # Authentication components
│   ├── Channels/    # Channel-related components
│   ├── Chat/        # Chat and messaging components
│   ├── Layout/      # Layout components
│   ├── Presence/    # User presence components
│   └── ui/          # Base UI components (shadcn/ui style)
├── data/            # Mock data
├── lib/             # Utility functions
└── App.js           # Main app component
```

## Mock Data

The application currently uses mock data for development. Replace API calls in components with actual backend endpoints when ready.

## Notes

- All components include detailed comments explaining the why, how, and impact
- Components follow React Bits patterns for reusability
- UI uses shadcn/ui component patterns with Tailwind CSS
- Ready for backend integration - replace mock data calls with API calls

