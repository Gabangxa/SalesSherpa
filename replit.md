# Sales Sherpa - Accountability & Guidance Platform

## Overview

Sales Sherpa is a full-stack sales accountability and guidance platform built with React (frontend) and Express.js (backend). The platform helps sales professionals stay accountable to their goals, track progress, and receive personalized AI guidance. The platform requires significant user input and engagement to maximize effectiveness, focusing on self-accountability rather than passive coaching.

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
- OpenAI GPT-4.1-mini integration for personalized sales guidance (Sales Sherpa Assistant)
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

### Email Verification System Implementation (January 2025)
- **Added comprehensive email verification system**: New users must verify their email address before accessing the platform
- **Created email verification endpoints**: `/api/verify-email` for token verification and `/api/resend-verification` for resending verification emails
- **Enhanced database schema**: Added `email_verified`, `verification_token`, and `verification_token_expiry` columns to users table
- **Professional email templates**: Implemented branded verification emails with Sales Sherpa styling and clear call-to-action buttons
- **Updated authentication flow**: Login now requires email verification; unverified users receive helpful error messages with verification options
- **Added verification page**: Created dedicated `/verify-email` route to handle email verification links with success/error states
- **Resend verification functionality**: Added dialog component allowing users to request new verification emails if needed
- **SendGrid integration**: Professional email delivery system with proper error handling and fallback messaging
- **Updated registration flow**: Registration now sends verification emails instead of immediately logging users in
- **Enhanced user experience**: Clear messaging throughout the verification process with helpful next steps

### Google OAuth Authentication System (January 2025)
- **Implemented Google OAuth as primary authentication method**: Using Passport.js with Google Strategy for seamless Gmail integration
- **Disabled traditional email/password authentication**: Temporarily removed login/registration forms to focus on Google OAuth workflow
- **Enhanced user experience**: Clean authentication pages showing only Google Sign-In options with helpful messaging about email verification being temporarily unavailable
- **Maintained privacy policy integration**: Privacy policy remains accessible during registration process
- **Updated for production deployment**: OAuth redirect URI configured for production domain https://sales-sherpa.org/

### Code Quality and Architecture Improvements (January 2025)
- **Created shared utility functions**: Added `client/src/lib/goalUtils.ts` with consolidated category colors, formatting functions, and shared constants
- **Consolidated Goal type definitions**: All components now use centralized `Goal` type from `shared/schema.ts` instead of duplicate interfaces
- **Optimized performance**: Implemented `useCallback` hooks for event handlers to prevent unnecessary re-renders
- **Removed dead code**: Eliminated unused `MemStorage` class and cleaned up duplicate code throughout the codebase
- **Enhanced maintainability**: Replaced scattered utility functions with shared imports for better code organization
- **Improved type safety**: All goal-related components now use consistent typing from the central schema
- **Fixed authentication session management**: Resolved duplicate setupAuth calls causing 401 errors and session conflicts
- **Enhanced error handling**: Added authentication-specific error boundaries with user-friendly messages and login redirection
- **Improved session persistence**: Added rolling sessions, better cookie management, and authentication state checks in hooks
- **Resolved Goals page authentication issues**: Fixed 401 errors on Goals page by adding proper authentication state checks to prevent unauthorized API calls
- **Fixed compilation errors**: Removed duplicate function declarations and mutations that were causing build failures

### Progress Calculation Enhancement (January 2025)
- Added startingAmount field to goal schema and database for non-zero starting points
- Updated progress calculation logic to properly handle starting values
- Enhanced UI to display starting → current / target format when applicable
- Added support for negative progress when current value falls below starting point
- Improved visual indicators with red styling for negative progress scenarios
- Fixed progress calculation examples: 50% → 62% target 75% now shows 48% progress (12 out of 25)
- Successfully tested negative progress: Starting 60% → Current 50% / Target 78% shows -55.6% with red warnings
- Fixed compatibility issues between legacy goals and new starting amount feature
- Enhanced authentication system to handle both development and production password storage

### Goal Management Enhancement (January 2025)
- Added comprehensive goal editing functionality through enhanced dialog system
- Updated GoalDialog and GoalForm components to support both create and edit modes
- Form pre-fills with existing goal data when editing
- Added three action buttons per goal: Lightning (quick progress update), Edit (full editing), Delete
- Enhanced form validation and error handling for editing operations
- Implemented proper PATCH requests for goal updates vs POST for creation
- Added visual distinction between create/update button states and messages

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
- `SALES_SHERPA_GOOGLE_CLIENT_ID`: Google OAuth Client ID for Gmail authentication
- `SALES_SHERPA_GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret for Gmail authentication

### Production Considerations
- HTTPS required for secure cookies
- Rate limiting enabled for API endpoints
- CSRF protection for form submissions
- Service Worker for offline functionality
- PWA manifest for mobile installation

The application follows a modular architecture with clear separation of concerns, making it maintainable and scalable for future enhancements.