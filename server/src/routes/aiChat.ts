// server/src/routes/aiChat.ts

import { Express } from 'express';
import { storage } from '../models/storage';
import { isAuthenticated } from '../../replitAuth';
import { buildKnowledgeBase, createAIResponse } from '../services/aiChatService';

export function setupAiChatRoutes(app: Express) {
  // Main AI Chat endpoint - The core of Minechat AI
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, conversationId } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
      } else {
        conversation = await storage.createConversation(userId, {
          userId,
          customerName: "Test User",
          customerEmail: "test@example.com",
          status: "active"
        });
      }

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        senderType: "user",
        content: message,
        messageType: "text"
      });

      // Get all business data for AI context
      const [aiAssistant, business, products, documents] = await Promise.all([
        storage.getAiAssistant(userId),
        storage.getBusiness(userId),
        storage.getProducts(userId),
        storage.getDocuments(userId)
      ]);

      // Build comprehensive knowledge base
      const knowledgeBase = await buildKnowledgeBase({
        business,
        aiAssistant,
        products,
        documents
      });

      // Get conversation history for context
      const conversationMessages = await storage.getMessages(conversation.id);

      // Generate AI response
      const aiMessage = await createAIResponse({
        message,
        knowledgeBase,
        aiAssistant,
        business,
        products,
        conversationMessages,
        userId
      });

      // Save AI response
      const savedMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderId: `ai-${userId}`,
        senderType: "ai",
        content: aiMessage,
        messageType: "text"
      });

      // Update conversation timestamp
      await storage.updateConversationLastMessage(conversation.id);

      res.json({
        message: savedMessage,
        conversationId: conversation.id,
        aiResponse: aiMessage
      });

    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Test AI knowledge base endpoint (for debugging)
  app.get('/api/chat/knowledge-base', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const [aiAssistant, business, products, documents] = await Promise.all([
        storage.getAiAssistant(userId),
        storage.getBusiness(userId),
        storage.getProducts(userId),
        storage.getDocuments(userId)
      ]);

      const knowledgeBase = await buildKnowledgeBase({
        business,
        aiAssistant,
        products,
        documents
      });

      res.json({
        knowledgeBase,
        stats: {
          hasBusinessInfo: !!business,
          hasAiAssistant: !!aiAssistant,
          productCount: products?.length || 0,
          documentCount: documents?.length || 0
        }
      });
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });
}