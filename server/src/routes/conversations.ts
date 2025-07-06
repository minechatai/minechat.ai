// server/src/routes/conversations.ts

import { Express } from 'express';
import { storage } from '../models/storage';
import { isAuthenticated } from '../../replitAuth';

export function setupConversationRoutes(app: Express) {
  // Get all conversations for user
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get specific conversation
  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Get messages for a conversation (two different endpoints for compatibility)
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Alternative messages endpoint that frontend expects
  app.get('/api/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.conversationId);

      console.log("Messages API Debug:", { userId, conversationId });

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      console.log("Conversation found:", !!conversation, conversation?.userId === userId);

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversationId);
      console.log("Messages retrieved:", messages.length);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Update conversation mode (AI/human)
  app.patch('/api/conversations/:id/mode', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      const { mode } = req.body;

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Update conversation mode
      await storage.updateConversationMode(conversationId, mode);

      res.json({ success: true, mode });
    } catch (error) {
      console.error("Error updating conversation mode:", error);
      res.status(500).json({ message: "Failed to update conversation mode" });
    }
  });

  // Send a message
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId, content, senderType } = req.body;

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // For human messages, get the active user profile to store with the message
      let messageData: any = {
        conversationId,
        senderId: userId,
        senderType,
        content,
        messageType: 'text'
      };

      if (senderType === 'human') {
        try {
          const profiles = await storage.getUserProfiles(userId);
          const activeProfile = profiles.find(profile => profile.isActive === true);

          if (activeProfile) {
            messageData.humanSenderProfileId = activeProfile.id;
            messageData.humanSenderName = activeProfile.name;
            messageData.humanSenderProfileImageUrl = activeProfile.profileImageUrl;
          }
        } catch (error) {
          console.error("Error fetching active profile for message attribution:", error);
          // Continue without profile data if there's an error
        }
      }

      // Create message in database
      const message = await storage.createMessage(messageData);

      // Update conversation's lastMessageAt timestamp
      await storage.updateConversationLastMessage(conversationId);

      // If this is a human message and the conversation is from Facebook, send to Facebook
      if (senderType === 'human' && conversation.source === 'facebook' && conversation.facebookSenderId) {
        try {
          const facebookConnection = await storage.getFacebookConnection(userId);
          if (facebookConnection?.accessToken) {
            // Import Facebook service (we'll create this later)
            // await sendFacebookMessage(facebookConnection.accessToken, conversation.facebookSenderId, content);
            console.log(`Human message would be sent to Facebook for conversation ${conversationId}`);
          } else {
            console.log(`No Facebook connection found for user ${userId}`);
          }
        } catch (facebookError) {
          console.error("Error sending message to Facebook:", facebookError);
          // Don't fail the API call if Facebook sending fails
        }
      }

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
}