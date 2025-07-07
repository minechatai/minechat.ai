// server/src/routes/index.ts

import { Express } from 'express';
import { createServer, type Server } from 'http';
import express from 'express';
import path from 'path';

// Import modular route modules
import { setupAiChatRoutes } from './aiChat';
import { setupBusinessRoutes } from './business';
import { setupProductRoutes } from './products';
import { setupConversationRoutes } from './conversations';
import { setupAnalyticsRoutes } from './analytics';
import { setupChannelRoutes } from './channels';

// More modules will be added here as we create them

// Import services (update paths as needed)
import { setupAuth } from '../../replitAuth';
import { setupGoogleAuth } from '../services/googleAuth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Setup authentication middleware
  await setupAuth(app);

  // Setup Google OAuth
  setupGoogleAuth(app);

  // Register modular route modules
  console.log("🚀 Registering modular route modules...");

  setupAiChatRoutes(app);          // CORE: AI Chat Engine
  setupBusinessRoutes(app);        // Business Management
  setupProductRoutes(app);         // Product Catalog
  setupConversationRoutes(app);    // Chat & Messaging
  setupAnalyticsRoutes(app);       // Analytics & Reporting
  setupChannelRoutes(app);         // Facebook & Channel Management

  // More modules will be registered here as we create them

  console.log("✅ Modular route modules registered successfully");

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      architecture: 'modular',
      modules: [
        'ai-chat',       // CORE AI Engine
        'business',      // Business Management
        'products',      // Product Catalog
        'conversations', // Chat & Messaging
        'analytics',     // Analytics & Reporting
        'channels'       // Facebook & Channel Management
      ]
    });
  });

  // API info endpoint
  app.get('/api/info', (req, res) => {
    res.json({
      name: 'Minechat AI API',
      description: 'No-code AI chat assistant platform for businesses',
      version: '1.0.0',
      architecture: 'Modular Enterprise Architecture',
      features: [
        'Dynamic AI Chat Assistants',
        'Anti-Hallucination Knowledge Base',
        'Business Management Suite',
        'Modular Architecture'
      ]
    });
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}