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

# User Preferences

Preferred communication style: Simple, everyday language.