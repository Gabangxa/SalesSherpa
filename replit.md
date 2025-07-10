# Sales Sherpa - Accountability & Guidance Platform

## Overview

Sales Sherpa is a full-stack sales accountability and guidance platform built with React (frontend) and Express.js (backend). The platform helps fintech sales professionals stay accountable to their goals, track progress, and receive personalized AI guidance. The platform requires significant user input and engagement to maximize effectiveness, focusing on self-accountability rather than passive coaching.

## User Preferences

- Preferred communication style: Simple, everyday language
- Platform terminology: "Sales Sherpa" (platform name), "Sales Sherpa Assistant" (AI chat), "Performance Tracking Centre" (dashboard)
- Focus on accountability and guidance rather than passive coaching - platform requires active user engagement

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket support for live features
- **Security**: CSRF protection, rate limiting, input sanitization
- **Email**: SendGrid integration for notifications

## Key Components

### Database Schema
- **Users**: Authentication and profile management
- **Goals**: Sales targets with progress tracking
- **Tasks**: Todo items with priority and completion status
- **Check-ins**: Daily reflection and progress reports
- **Time Off**: Vacation/break period management
- **Chat Messages**: AI assistant conversation history
- **Sales Metrics**: Performance tracking and analytics
- **Check-in Alerts**: Customizable reminder notifications

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with crypto.scrypt
- PostgreSQL session store for persistence
- Protected routes with middleware

### AI Integration
- OpenAI GPT-4o integration for personalized sales guidance (Sales Sherpa Assistant)
- Context-aware responses using user goals and tasks with MCP-like caching architecture
- Real-time access to user's actual goals data for personalized recommendations
- Real-time chat interface with message history and professional styling

### Real-time Features
- WebSocket server for live notifications
- Check-in alert system with timezone support
- Progress updates and coaching reminders
- Connection status monitoring

## Data Flow

1. **User Authentication**: Login → Session creation → Protected route access
2. **Goal Management**: Create goals → Track progress → AI guidance based on actual user data
3. **Daily Check-ins**: User input → Storage → AI analysis → Personalized guidance response
4. **Real-time Updates**: WebSocket connection → Alert scheduling → User notifications
5. **Progress Tracking**: Data aggregation → Visualization → Performance insights in Performance Tracking Centre

## Recent Changes

### Progress Calculation Enhancement (January 2025)
- Added startingAmount field to goal schema and database for non-zero starting points
- Updated progress calculation logic to properly handle starting values
- Enhanced UI to display starting → current / target format when applicable
- Added support for negative progress when current value falls below starting point
- Improved visual indicators with red styling for negative progress scenarios
- Fixed progress calculation examples: 50% → 62% target 75% now shows 48% progress (12 out of 25)

### UI/UX Enhancements (January 2025)
- Implemented modern glassmorphism design with sophisticated gradients and backdrop blur effects
- Enhanced Sales Sherpa Assistant chat with improved message bubbles and avatar styling
- Added refined Performance Tracking Centre with professional card layouts
- Updated platform branding from "FinSales" to "Sales Sherpa" throughout interface
- Improved color consistency with blue/purple accent themes for enterprise-grade appearance

## External Dependencies

### Backend Services
- **Database**: PostgreSQL (Neon serverless)
- **Email**: SendGrid for notifications
- **AI**: OpenAI API for coaching responses
- **WebSocket**: Native WebSocket for real-time features

### Frontend Libraries
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns and Luxon for timezone support
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast production builds
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Development server and build tool

## Deployment Strategy

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Database: Drizzle migrations applied via `db:push`

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: AI integration
- `SENDGRID_API_KEY`: Email notifications
- `SESSION_SECRET`: Authentication security

### Production Considerations
- HTTPS required for secure cookies
- Rate limiting enabled for API endpoints
- CSRF protection for form submissions
- Service Worker for offline functionality
- PWA manifest for mobile installation

The application follows a modular architecture with clear separation of concerns, making it maintainable and scalable for future enhancements.