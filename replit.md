# Overview

This is a full-stack AI-powered chat assistant platform built with a modern TypeScript stack. The application allows business owners to create, configure, and deploy AI chat assistants for customer support and inquiry automation. It features a React frontend with shadcn/ui components, Express.js backend, PostgreSQL database with Drizzle ORM, and integrates Replit's authentication system.

# System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, Vite build system, Tailwind CSS styling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Deployment**: Configured for Replit with autoscale deployment target

# Key Components

## Frontend Architecture
- **Component Library**: shadcn/ui with Radix UI primitives for accessibility
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **API Structure**: RESTful endpoints with Express.js
- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **File Uploads**: Multer middleware for document handling
- **Authentication Middleware**: Custom auth wrapper around Replit Auth

## Database Design
Key entities include:
- **Users**: Replit Auth integration with profile information
- **Businesses**: Company information and settings
- **AI Assistants**: Configuration for chat bot behavior and responses
- **Products**: Business product/service catalog
- **Documents**: File uploads for knowledge base
- **Conversations & Messages**: Chat history storage
- **Analytics**: Performance metrics and usage tracking
- **Channels**: Integration settings for various communication platforms

# Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Setup Process**: Multi-step wizard for configuring business info, AI assistant, and channels
3. **Chat Interface**: Real-time messaging with conversation persistence
4. **Analytics Pipeline**: Usage metrics collected and displayed on dashboard
5. **File Processing**: Document uploads processed and stored for AI knowledge base

# External Dependencies

## Core Framework Dependencies
- React 18 with TypeScript for frontend development
- Express.js for backend API server
- PostgreSQL via Neon serverless for data persistence
- Drizzle ORM for type-safe database operations

## Authentication & Security
- Replit Auth with OpenID Connect (OIDC)
- Session management with PostgreSQL storage
- CORS and security middleware

## UI & Styling
- shadcn/ui component library
- Radix UI primitives for accessibility
- Tailwind CSS for utility-first styling
- Lucide React for icons

## Development Tools
- Vite for fast development and building
- ESBuild for production server bundling
- TypeScript for type safety across the stack

# Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Build Process**: Vite builds the frontend, ESBuild bundles the backend
- **Production**: Serves static frontend files and API routes from single Express server
- **Database**: Uses Neon PostgreSQL with connection pooling
- **Environment**: Configured for Replit's autoscale deployment target

The deployment uses port 5000 internally, mapped to port 80 externally, with proper health checks and monitoring configured.

# Recent Changes

- June 18, 2025: Initial setup and authentication system
- June 18, 2025: Complete AI chat assistant platform implementation
  - Real-time AI chat with OpenAI integration
  - Intelligent fallback system for API testing
  - Business context integration for personalized responses
  - File upload system for knowledge base documents
  - Analytics tracking for chat interactions
- June 18, 2025: Visual design implementation matching minechat.ai specifications
  - Implemented Poppins font family throughout application
  - Added official Minechat AI logo to sidebar
  - Updated dark mode colors to match design specifications
  - Enhanced dashboard components with proper dark/light mode styling
- June 19, 2025: Updated to new Minechat AI logo icon design
- July 2, 2025: Facebook Messenger Integration Implementation
  - Added Facebook webhook endpoints for receiving messages
  - Implemented AI auto-response system for Facebook messages
  - Created Facebook connection interface in Channels section
  - Added Facebook conversation tracking and message storage
  - Integrated AI assistant settings with Facebook responses
  - Webhook verification and message handling system
  - Real-time Facebook Page to AI assistant connection
- July 2, 2025: Successfully Completed Facebook Integration
  - Facebook webhook fully operational and verified
  - AI assistant "JJ" responding to Facebook messages in real-time
  - Multi-language support confirmed (English/Japanese responses)
  - Facebook Page product configured with proper webhook subscriptions
  - Facebook credentials saving and connection management working
  - Live testing confirmed with actual Facebook page interactions
- July 2, 2025: Enhanced Facebook AI Knowledge Base Integration
  - Fixed Facebook AI responses to properly use knowledge base data
  - AI now pulls answers from both AI Assistant and Business Information tabs
  - Enhanced system prompts to prioritize FAQ content from saved data
  - Improved fallback responses to use business-specific information
  - Added comprehensive debugging for knowledge base content verification
  - Business information form data persistence fixed for proper loading
- July 2, 2025: Major AI Response System Enhancement
  - Restructured knowledge base to prioritize Business Information and AI Assistant data
  - Enhanced system prompts with detailed instructions for knowledge base usage
  - Improved AI responses to quote specific information from knowledge base
  - Fixed product image upload functionality with proper authentication
  - Enhanced Facebook image sharing with better URL handling
  - Added comprehensive data structuring for more accurate AI responses
- July 3, 2025: Complete AI Knowledge Base Integration
  - Implemented comprehensive knowledge base system accessing all saved data
  - AI now has complete access to Business Information, AI Assistant settings, and Product details
  - Enhanced system prompts with strict instructions to use saved data instead of generic responses
  - Added conversation memory with 10-message history for context continuity
  - Fixed Facebook webhook to use same enhanced knowledge base as main chat
  - AI only gives generic responses for truly irrelevant questions (weather, sports, etc.)
  - Both web chat and Facebook Messenger now provide accurate, specific business information
- July 3, 2025: Product Management Enhancement
  - Fixed data persistence issues across all product form fields
  - Separated form functionality: main form for comprehensive product data, edit forms for basic updates
  - Added missing fields (FAQs, Payment Details, Discounts, etc.) to Add New Product form
  - Implemented image upload/delete functionality for product editing
  - Enhanced form validation and data flow from database to frontend
  - Fixed auto-population issues to keep Add New Product form empty by default
- July 4, 2025: Complete Reset Functionality Implementation
  - Added working reset buttons for both AI Assistant and Business Information tabs
  - Implemented proper database deletion: reset buttons now clear data from database completely
  - Tab-specific reset: AI Assistant reset only affects AI data, Business reset only affects business data
  - Added reset mutations with proper error handling and user feedback
  - Reset buttons clear both form fields and corresponding database entries
  - FAQ reset functionality included within Business tab reset
  - Enhanced user experience with loading states for reset operations
- July 4, 2025: Knowledge-Base Driven AI System Implementation
  - Fixed hardcoded company name references that persisted after resets
  - Implemented strict knowledge-base driven AI responses: AI only uses explicitly provided information
  - Added conversation history isolation: when no business data exists, AI starts fresh without previous context
  - Enhanced system prompts with explicit instructions to prevent AI from inventing business information
  - AI now responds with "I don't have that information available" when asked about non-existent business details
  - Eliminated all fallback responses that could reference non-existent company data
  - Both web chat and Facebook webhook now operate with identical knowledge-base constraints

# User Preferences

Preferred communication style: Simple, everyday language.