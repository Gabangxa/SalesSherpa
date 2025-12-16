# Sales Sherpa

A comprehensive sales accountability and guidance platform that helps sales professionals stay accountable to their goals, track progress, and receive personalized AI guidance.

## Features

### Core Functionality
- **Goal Tracking**: Set, monitor, and achieve sales targets with visual progress indicators
- **Daily Check-ins**: Regular accountability check-ins with reflection and progress reports
- **AI-Powered Guidance**: Personalized coaching from the Sales Sherpa Assistant using GPT-4
- **Performance Tracking Centre**: Comprehensive dashboard with metrics visualization
- **Time-Off Management**: Vacation and break period management that respects boundaries

### Technical Features
- **Real-time WebSocket Infrastructure**: Live notifications and updates
- **Google OAuth Authentication**: Secure sign-in with Gmail integration
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dual Theme System**: Sophisticated dark slate aesthetic with theme switching

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS with shadcn/ui components
- TanStack Query for server state management
- Wouter for client-side routing
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- WebSocket support for real-time features

### Integrations
- OpenAI GPT-4 for AI coaching
- SendGrid for email notifications
- Google OAuth for authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- OpenAI API key (optional, for AI features)
- SendGrid API key (optional, for email notifications)

### Environment Variables
```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_session_secret
SALES_SHERPA_GOOGLE_CLIENT_ID=your_google_client_id
SALES_SHERPA_GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Installation
```bash
npm install
npm run db:push
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                 # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts          # Database schema and types
└── theme.json             # Theme configuration
```

## Design System

Sales Sherpa features a sophisticated dual-theme system:

### Dark Slate Theme (Default Light Theme)
- Slate-800 to slate-900 gradient backgrounds
- White text with opacity variants for hierarchy
- Glassmorphic effects with backdrop blur
- Semi-transparent overlays and borders

### Dark Theme
- Deep dark backgrounds for reduced eye strain
- Consistent component styling across themes
- Smooth theme transitions

## License

Proprietary - All rights reserved.
