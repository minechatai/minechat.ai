// server/src/routes/index.ts

import { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";

// Import only the modules we've created so far
import { setupAiChatRoutes } from "./aiChat";
import { setupBusinessRoutes } from "./business";
import { setupProductRoutes } from "./products";
import { setupConversationRoutes } from "./conversations";
import { setupAnalyticsRoutes } from "./analytics";

// Import services (update paths as needed)
import { setupAuth } from "../../replitAuth";
import { setupGoogleAuth } from "../services/googleAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Setup authentication middleware
  await setupAuth(app);

  // Setup Google OAuth
  setupGoogleAuth(app);

  // Register modular route modules
  console.log("🚀 Registering modular route modules...");

  setupAiChatRoutes(app); // CORE: AI Chat Engine
  setupBusinessRoutes(app); // Business Management
  setupProductRoutes(app); // Product Catalog
  setupConversationRoutes(app); // Chat & Messaging
  setupAnalyticsRoutes(app); // Analytics & Reporting

  console.log("✅ Modular route modules registered successfully");

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      architecture: "modular",
      modules: [
        "ai-chat",
        "business",
        "products",
        "conversations",
        "analytics",
      ],
    });
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
