// server/src/routes/channels.ts

import { Express } from 'express';
import { storage } from '../models/storage';
import { isAuthenticated } from '../../replitAuth';
import { buildKnowledgeBase, createAIResponse } from '../services/aiChatService';

export function setupChannelRoutes(app: Express) {
  // ===== FACEBOOK CONNECTION MANAGEMENT =====

  // Facebook OAuth callback
  app.get('/api/facebook/callback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: "Authorization code not provided" });
      }

      // Simulate successful Facebook connection
      // In production, exchange code for access token and get page info
      await storage.upsertFacebookConnection(userId, {
        userId,
        facebookPageId: "demo_page_id",
        facebookPageName: "Demo Business Page",
        accessToken: "demo_access_token",
        isConnected: true,
      });

      res.redirect('/chat?connected=facebook');
    } catch (error) {
      console.error("Error completing Facebook connection:", error);
      res.status(500).json({ message: "Failed to complete Facebook connection" });
    }
  });

  // Connect real Facebook page
  app.post('/api/facebook/connect-real', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pageId, accessToken } = req.body;

      console.log('Facebook connect request:', { 
        userId, 
        pageId: pageId ? 'PROVIDED' : 'MISSING', 
        accessToken: accessToken ? 'PROVIDED' : 'MISSING' 
      });

      if (!pageId || !accessToken) {
        return res.status(400).json({ message: "Page ID and access token are required" });
      }

      // Verify the access token by making a test request to Facebook
      const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}?access_token=${accessToken}`);

      if (!response.ok) {
        return res.status(400).json({ message: "Invalid Facebook credentials" });
      }

      const pageData = await response.json();

      await storage.upsertFacebookConnection(userId, {
        userId,
        facebookPageId: pageId,
        facebookPageName: pageData.name,
        accessToken: accessToken,
        isConnected: true,
      });

      res.json({ message: "Facebook page connected successfully", pageName: pageData.name });
    } catch (error) {
      console.error("Error connecting Facebook:", error);
      res.status(500).json({ message: "Failed to connect Facebook page" });
    }
  });

  // Get Facebook connection status
  app.get('/api/facebook-connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getFacebookConnection(userId);
      res.json(connection || { isConnected: false });
    } catch (error) {
      console.error("Error fetching Facebook connection:", error);
      res.status(500).json({ message: "Failed to fetch Facebook connection" });
    }
  });

  // Disconnect Facebook
  app.delete('/api/facebook/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.disconnectFacebook(userId);
      res.json({ message: "Facebook Messenger disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      res.status(500).json({ message: "Failed to disconnect Facebook" });
    }
  });

  // ===== FACEBOOK WEBHOOKS =====

  // Facebook webhook verification
  app.get("/api/facebook/webhook", (req, res) => {
    // Set CORS headers for Facebook
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const VERIFY_TOKEN = "minechat_webhook_verify_token";

    console.log("Facebook webhook verification request:", req.query);

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("Verification details:", { mode, token, challenge, expectedToken: VERIFY_TOKEN });

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Facebook webhook verified successfully");
        return res.status(200).send(challenge);
      } else {
        console.log("Facebook webhook verification failed - token mismatch");
        return res.status(403).send("Forbidden");
      }
    } else {
      console.log("Facebook webhook verification failed - missing parameters");
      return res.status(400).send("Bad Request");
    }
  });

  // Facebook webhook message receiver
  app.post("/api/facebook/webhook", async (req, res) => {
    try {
      const body = req.body;

      if (body.object === "page") {
        body.entry?.forEach(async (entry: any) => {
          const webhookEvent = entry.messaging?.[0];

          if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
            await handleFacebookMessage(webhookEvent);
          }
        });

        res.status(200).send("EVENT_RECEIVED");
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Facebook webhook error:", error);
      res.sendStatus(500);
    }
  });

  // ===== FACEBOOK MESSAGE HANDLING =====

  // Handle incoming Facebook messages with full AI integration
  async function handleFacebookMessage(webhookEvent: any) {
    try {
      const senderId = webhookEvent.sender.id;
      const recipientId = webhookEvent.recipient.id; // This is the page ID
      const messageText = webhookEvent.message.text;

      console.log(`Received Facebook message from ${senderId} to page ${recipientId}: ${messageText}`);

      // Find the Facebook connection for this page
      const facebookConnections = await storage.getAllFacebookConnections();
      const connection = facebookConnections.find(conn => conn.facebookPageId === recipientId);

      if (!connection || !connection.isConnected) {
        console.log("No active Facebook connection found for page:", recipientId);
        return;
      }

      // Get user's business data for AI context
      const [aiAssistant, business, products, documents] = await Promise.all([
        storage.getAiAssistant(connection.userId),
        storage.getBusiness(connection.userId),
        storage.getProducts(connection.userId),
        storage.getDocuments(connection.userId)
      ]);

      console.log("Facebook AI Data Debug:");
      console.log("Connection userId:", connection.userId);
      console.log("AI Assistant:", !!aiAssistant);
      console.log("Business:", !!business);
      console.log("Products:", products?.length || 0);

      // Get Facebook user profile information
      const userProfile = await getFacebookUserProfile(connection.accessToken, senderId);

      // Create or get conversation
      let conversation = await storage.getConversationByFacebookSender(connection.userId, senderId);
      if (!conversation) {
        conversation = await storage.createConversation(connection.userId, {
          userId: connection.userId,
          customerName: userProfile?.name || `Facebook User ${senderId.substring(0, 8)}`,
          customerEmail: null,
          customerProfilePicture: userProfile?.profilePicture || null,
          source: "facebook",
          facebookSenderId: senderId
        });
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: senderId,
        senderType: "user",
        content: messageText,
        messageType: "text"
      });

      // Update conversation's lastMessageAt timestamp
      await storage.updateConversationLastMessage(conversation.id);

      // Check if conversation is in AI mode before generating response
      if (conversation.mode === 'human') {
        console.log(`Conversation ${conversation.id} is in human mode - skipping AI response`);
        return;
      }

      // Generate AI response using the modular service
      const knowledgeBase = await buildKnowledgeBase({
        business,
        aiAssistant,
        products,
        documents
      });

      const conversationMessages = await storage.getMessages(conversation.id);

      const aiResponse = await createAIResponse({
        message: messageText,
        knowledgeBase,
        aiAssistant,
        business,
        products,
        conversationMessages,
        userId: connection.userId
      });

      // Save AI response
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: `ai-${connection.userId}`,
        senderType: "ai",
        content: aiResponse,
        messageType: "text"
      });

      // Send AI response back to Facebook
      await sendFacebookMessage(connection.accessToken, senderId, aiResponse);

      console.log(`AI response sent to Facebook user ${senderId}: ${aiResponse}`);

    } catch (error) {
      console.error("Error handling Facebook message:", error);
    }
  }

  // Helper functions (we'll move these to a service later)
  async function getFacebookUserProfile(accessToken: string, userId: string) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${userId}?fields=name,profile_pic&access_token=${accessToken}`);

      if (!response.ok) {
        const error = await response.text();
        console.error('Facebook Profile API Error:', error);
        return null;
      }

      const data = await response.json();
      return {
        name: data.name || `Facebook User ${userId.substring(0, 8)}`,
        profilePicture: data.profile_pic || null
      };
    } catch (error) {
      console.error('Error fetching Facebook profile:', error);
      return null;
    }
  }

  async function sendFacebookMessage(accessToken: string, recipientId: string, messageText: string) {
    try {
      const response = await fetch("https://graph.facebook.com/v19.0/me/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          access_token: accessToken,
          recipient: { id: recipientId },
          message: { text: messageText }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Facebook send message error:", errorData);
      } else {
        console.log("Facebook message sent successfully");
      }
    } catch (error) {
      console.error("Error sending Facebook message:", error);
    }
  }
}