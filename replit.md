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
- July 4, 2025: Complete Product Management and Facebook Integration Enhancement
  - Fixed product form state management: "Add New Product" now shows clean, empty forms
  - Reorganized product layout: "Your Products" section appears first, "Product Management" section below
  - Enhanced product display: multiple images shown as compact thumbnails in grid format
  - Implemented complete Facebook multiple image support: sends all product images instead of just first one
  - Removed redundant Facebook image captions: AI response contains full product details, images sent without individual captions
  - Fixed TypeScript safety issues in Facebook webhook image handling with proper array and null checks
- July 4, 2025: Sticky Mode Indicator Implementation
  - Made AI/Human mode indicator permanently visible at the top of chat interfaces
  - Applied sticky positioning to both main Chat tab and Facebook Chat tab
  - Mode indicator stays visible while scrolling through messages
  - Enhanced visibility with subtle shadow for better visual distinction
- July 4, 2025: Enhanced FAQ System and Destructive Action Safety
  - Added confirmation dialogs for all destructive actions (FAQ deletion, business reset, AI assistant reset)
  - All confirmation dialogs display "Do you still wish to proceed?" message as requested
  - Fixed FAQ deletion to properly remove data from database instead of just frontend
  - Updated FAQ reset functionality to use DELETE endpoint ensuring complete database cleanup
  - Increased FAQ character limits from 200-300 to 500-1000 characters for better emoji support
  - Enhanced FAQ input fields with improved placeholder text and sizing for emoji content
  - Implemented verbatim FAQ response system ensuring AI answers match saved FAQ content exactly
  - Fixed database persistence issues ensuring reset/delete operations completely remove data
- July 4, 2025: Confirmation Dialog Button Standardization and UI Layout Enhancement
  - Updated all confirmation dialog buttons from "Reset Forever"/"Delete Forever" to "Delete" for consistency
  - Standardized destructive action confirmations across AI Assistant, Business Information, and FAQ management
  - Enhanced AI Testing panel layout by increasing width from 384px to 800px for better space utilization
  - Improved visual balance between main content area and AI Testing panel in Setup sections
- July 4, 2025: SF Pro Font Implementation with Brand Identity Preservation
  - Changed platform-wide font from Poppins to SF Pro Display/SF Pro Text for modern system appearance
  - Preserved Poppins font specifically for minechat.ai logo text to maintain brand identity
  - Updated both CSS global styles and Tailwind configuration for consistent SF Pro usage
  - Added logo-brand CSS class to maintain Poppins font for brand elements only
- July 4, 2025: Resizable Form Fields Implementation
  - Created ResizableTextarea component enabling user-controlled field sizing via bottom-right corner dragging
  - Updated all textarea fields in Business Information form to use resizable functionality
  - Updated RichTextarea component used in AI Assistant form to support resizing
  - Updated product description fields in Product Management to be resizable
  - Enhanced user experience by allowing custom field sizing for better content management
- July 4, 2025: AI Testing Panel Image Support Implementation
  - Added image support to AI Testing panel allowing AI to send product images alongside text responses
  - Enhanced Message interface to support optional image arrays
  - Implemented smart product detection: AI automatically sends relevant product images when products are mentioned
  - Updated backend chat API to detect product references and include corresponding images in responses
  - Added responsive image grid display in AI testing panel with proper sizing and borders
- July 4, 2025: Official Minechat Red Brand Color Implementation
  - Implemented official Minechat Red brand colors using gradient (#8b1950, #b33054, #b73850)
  - Updated CSS variables and Tailwind configuration to use authentic brand colors
  - Created custom SVG ChatbotIcon component with Minechat Red gradient replacing generic red
  - Enhanced chatbot icon visibility in AI Testing panel with larger size and no background
  - Applied brand colors to all buttons, chatbot icons, and primary interface elements
  - Added custom CSS classes for Minechat Red gradient and solid color variations
- July 5, 2025: AI Testing Panel Database Isolation and Name Recognition Fix
  - Created separate '/api/chat/test' endpoint that doesn't save conversations or messages to database
  - AI Testing panel now uses dedicated endpoint ensuring no test data is stored permanently
  - Fixed AI assistant name recognition issue: AI now properly responds with "JJ" when asked "What's your name?"
  - Enhanced system prompt to distinguish between name questions and general greetings
  - Testing environment operates independently from saved chat history for clean testing results
- July 5, 2025: Product Deletion Confirmation Dialog Implementation
  - Added confirmation dialog for product deletion to maintain consistency with other destructive actions
  - Product delete button now requires "Do you still wish to proceed?" confirmation before deletion
  - Deleted all existing test conversations (21 conversations, 42 messages) from database
  - Chat inbox now only shows legitimate Facebook customer conversations
  - Comprehensive safety measures implemented for all destructive actions across the platform
- July 5, 2025: Account Management Interface Implementation
  - Created Account page component matching official UI design specifications
  - Implemented user profile section with dynamic avatar initials and company name display
  - Added menu items: Edit User Profile, Terms & Conditions, Contact Us, Subscription, Logout
  - Used MainLayout for consistent navigation and header structure
  - Account page displays business name when available, falls back to user email
  - Proper TypeScript handling for dynamic user/business data integration

# User Preferences

Preferred communication style: Simple, everyday language.