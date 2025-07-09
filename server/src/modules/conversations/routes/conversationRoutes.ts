import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAuthenticated } from "../../../../replitAuth";
import multer from "multer";
import path from "path";

// Configure multer for general file uploads (for chat attachments)
const generalUpload = multer({
  dest: 'uploads/general/',
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for general files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip', '.rar'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, images, and archive files are allowed.'));
    }
  }
});

export function setupConversationRoutes(app: Express): void {
  // Get all conversations for a user
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

  // Get messages for a specific conversation
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

  // Messages endpoint that frontend expects
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

  // Update conversation mode endpoint
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

  // Send message endpoint
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
            await sendFacebookMessage(
              facebookConnection.accessToken,
              conversation.facebookSenderId,
              content
            );
            console.log(`Human message sent to Facebook for conversation ${conversationId}`);
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

  // File upload endpoint for messages
  app.post('/api/messages/file', isAuthenticated, generalUpload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId, senderType } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(parseInt(conversationId));
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Create file message with proper metadata
      let messageData: any = {
        conversationId: parseInt(conversationId),
        senderId: userId,
        senderType: senderType || 'assistant',
        content: `📎 ${req.file.originalname}`,
        messageType: 'file',
        fileUrl: `/uploads/general/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size
      };

      // For human messages, get the active user profile
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
          console.error("Error fetching active profile for file message:", error);
        }
      }

      // Create message in database
      const message = await storage.createMessage(messageData);

      // Update conversation's lastMessageAt timestamp
      await storage.updateConversationLastMessage(parseInt(conversationId));

      // If this is a human file message and the conversation is from Facebook, send to Facebook
      if (senderType === 'human' && conversation.source === 'facebook' && conversation.facebookSenderId) {
        try {
          const facebookConnection = await storage.getFacebookConnection(userId);
          if (facebookConnection?.accessToken) {
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(req.file.originalname);

            if (isImage) {
              // Send as image to Facebook Messenger
              const fullImageUrl = `${req.protocol}://${req.get('host')}/uploads/general/${req.file.filename}`;
              await sendFacebookImage(
                facebookConnection.accessToken,
                conversation.facebookSenderId,
                fullImageUrl
              );
              console.log(`Human image file sent to Facebook for conversation ${conversationId}: ${req.file.originalname}`);
            } else {
              // For non-image files, send a text message about the file
              await sendFacebookMessage(
                facebookConnection.accessToken,
                conversation.facebookSenderId,
                `📎 File shared: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`
              );
              console.log(`Human file message sent to Facebook for conversation ${conversationId}: ${req.file.originalname}`);
            }
          }
        } catch (facebookError) {
          console.error("Error sending file message to Facebook:", facebookError);
        }
      }

      res.json(message);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Individual conversation endpoint
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
}

// Helper function to send message to Facebook (placeholder - will be moved to integrations module later)
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

// Helper function to send image to Facebook (placeholder - will be moved to integrations module later)
async function sendFacebookImage(accessToken: string, recipientId: string, imageUrl: string, caption?: string) {
  try {
    const messageData = {
      access_token: accessToken,
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        }
      }
    };

    const response = await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Facebook send image error:", errorData);
    } else {
      console.log(`Facebook image sent successfully: ${imageUrl}`);

      // Send caption as separate message if provided
      if (caption) {
        setTimeout(() => {
          sendFacebookMessage(accessToken, recipientId, caption);
        }, 500);
      }
    }
  } catch (error) {
    console.error("Error sending Facebook image:", error);
  }
}