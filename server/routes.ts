import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertBusinessSchema, 
  insertAiAssistantSchema, 
  insertProductSchema,
  insertChannelSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import express from "express";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// Configure multer for image uploads
const imageUpload = multer({
  dest: 'uploads/images/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile picture upload endpoint
  app.post('/api/auth/profile-picture', isAuthenticated, imageUpload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the public URL for the uploaded image
      const imageUrl = `/uploads/images/${file.filename}`;
      
      // Update user profile with new image URL
      await storage.upsertUser({
        id: userId,
        profileImageUrl: imageUrl,
      });
      
      res.json({ 
        message: "Profile picture updated successfully",
        profileImageUrl: imageUrl
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // Business routes
  app.get('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusiness(userId);
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("📝 Business save request - userId:", userId);
      console.log("📝 Business save request - body:", req.body);
      console.log("📝 Business save request - FAQs specifically:", req.body.faqs);
      const validatedData = insertBusinessSchema.parse(req.body);
      console.log("📝 Business save - validated data:", validatedData);
      console.log("📝 Business save - validated FAQs:", validatedData.faqs);
      const business = await storage.upsertBusiness(userId, { ...validatedData, userId });
      console.log("📝 Business save - result:", business);
      console.log("📝 Business save - result FAQs:", business.faqs);
      res.json(business);
    } catch (error) {
      console.error("Error saving business:", error);
      res.status(500).json({ message: "Failed to save business" });
    }
  });

  app.delete('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteBusiness(userId);
      res.json({ message: "Business information deleted successfully" });
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  // Business logo upload endpoint
  app.post('/api/business/upload-logo', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the public URL for the uploaded image
      const logoUrl = `/uploads/images/${file.filename}`;
      
      // Update business with new logo URL
      const existingBusiness = await storage.getBusiness(userId);
      if (existingBusiness) {
        await storage.upsertBusiness(userId, { 
          ...existingBusiness,
          logoUrl: logoUrl
        });
      }
      
      res.json({ 
        message: "Business logo updated successfully",
        logoUrl: logoUrl
      });
    } catch (error) {
      console.error("Error updating business logo:", error);
      res.status(500).json({ message: "Failed to update business logo" });
    }
  });

  // Notifications API
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.body;
      
      if (conversationId) {
        await storage.markConversationAsRead(userId, conversationId);
      } else {
        await storage.markAllNotificationsAsRead(userId);
      }
      
      res.json({ message: "Notifications marked as read" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // AI Assistant routes
  app.get('/api/ai-assistant', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assistant = await storage.getAiAssistant(userId);
      res.json(assistant);
    } catch (error) {
      console.error("Error fetching AI assistant:", error);
      res.status(500).json({ message: "Failed to fetch AI assistant" });
    }
  });

  app.post('/api/ai-assistant', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAiAssistantSchema.parse(req.body);
      const assistant = await storage.upsertAiAssistant(userId, { ...validatedData, userId });
      res.json(assistant);
    } catch (error) {
      console.error("Error saving AI assistant:", error);
      res.status(500).json({ message: "Failed to save AI assistant" });
    }
  });

  app.delete('/api/ai-assistant', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteAiAssistant(userId);
      res.json({ message: "AI Assistant settings deleted successfully" });
    } catch (error) {
      console.error("Error deleting AI assistant:", error);
      res.status(500).json({ message: "Failed to delete AI assistant" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProducts(userId);
      
      // Debug log to see what we're getting from the database
      console.log("Products from database:", JSON.stringify(products, null, 2));
      
      // Ensure proper field mapping for frontend
      const mappedProducts = products.map(product => ({
        ...product,
        // Ensure all fields are properly mapped (Drizzle handles camelCase conversion)
        paymentDetails: product.paymentDetails || "",
        additionalNotes: product.additionalNotes || "",
        thankYouMessage: product.thankYouMessage || "",
        imageUrl: product.imageUrl || "",
        faqs: product.faqs || "",
        discounts: product.discounts || "",
        policy: product.policy || ""
      }));
      
      console.log("Mapped products for frontend:", JSON.stringify(mappedProducts, null, 2));
      res.json(mappedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log("Product save request - raw body:", req.body);
      
      // Clean and filter the data before validation
      const cleanedData = { ...req.body };
      
      // Remove empty strings and convert them to null/undefined
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });
      
      console.log("Product save - after empty string cleanup:", cleanedData);
      
      // Clean price field - remove all non-numeric characters except decimal points
      if (cleanedData.price && cleanedData.price !== '') {
        console.log("Original price value:", cleanedData.price);
        const cleanPrice = cleanedData.price.toString().replace(/[^0-9.]/g, '');
        console.log("Cleaned price value:", cleanPrice);
        cleanedData.price = cleanPrice || null;
      } else {
        cleanedData.price = null;
      }
      
      console.log("Product save - final cleaned data:", cleanedData);
      
      const validatedData = insertProductSchema.parse(cleanedData);
      console.log("Product save - validated data:", validatedData);
      
      const product = await storage.createProduct(userId, { ...validatedData, userId });
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });



  // Document upload route
  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = {
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadStatus: 'completed' as const,
      };

      const document = await storage.createDocument(userId, documentData);
      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deleteDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Update product
  app.patch('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Clean and filter the data before validation
      const cleanedData = { ...req.body };
      
      // Remove empty strings and convert them to null/undefined
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });
      
      // Clean price field
      if (cleanedData.price && cleanedData.price !== '') {
        const cleanPrice = cleanedData.price.toString().replace(/[^0-9.]/g, '');
        cleanedData.price = cleanPrice || null;
      } else {
        cleanedData.price = null;
      }
      
      const validatedData = insertProductSchema.parse(cleanedData);
      const product = await storage.updateProduct(productId, validatedData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Image upload route for products
  app.post('/api/products/upload-image', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      console.log("Image upload request received");
      console.log("req.file:", req.file);
      console.log("req.body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      
      if (!req.file) {
        console.log("No file found in request");
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("File uploaded successfully:", req.file.filename);
      
      // Generate a unique URL for the uploaded image
      const imageUrl = `/uploads/images/${req.file.filename}`;
      
      res.json({ 
        imageUrl,
        originalName: req.file.originalname,
        size: req.file.size 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Conversation routes
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

  // Update conversation mode (AI/Human)
  app.patch('/api/conversations/:id/mode', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { mode } = req.body;
      
      if (!mode || !['ai', 'human'].includes(mode)) {
        return res.status(400).json({ message: "Mode must be 'ai' or 'human'" });
      }
      
      console.log(`🔍 Updating conversation ${conversationId} mode to: ${mode}`);
      
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
      
      if (!conversationId || !content || !senderType) {
        return res.status(400).json({ message: "conversationId, content, and senderType are required" });
      }
      
      console.log(`🔍 Sending message: ${senderType} -> ${content.substring(0, 50)}...`);
      
      // Validate conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Create message
      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        senderType,
        content,
        messageType: "text"
      });
      
      console.log(`🔍 Message sent successfully: ID ${message.id}`);
      
      // If this is human sending to Facebook conversation, also send to Facebook
      if (conversation.source === 'facebook' && senderType === 'human') {
        try {
          await sendTextToFacebook(conversation, content);
        } catch (error) {
          console.error("Error sending message to Facebook:", error);
          // Continue anyway since message was saved to database
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // File upload endpoint for messages
  app.post('/api/messages/file', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId, senderType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      if (!conversationId || !senderType) {
        return res.status(400).json({ message: "conversationId and senderType are required" });
      }
      
      console.log(`🔍 Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Validate conversation belongs to user
      const conversation = await storage.getConversation(parseInt(conversationId));
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Generate file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Create message with file
      const message = await storage.createMessage({
        conversationId: parseInt(conversationId),
        senderId: userId,
        senderType,
        content: `File shared: ${req.file.originalname}`,
        messageType: "file",
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
      
      console.log(`🔍 File message sent successfully: ID ${message.id}`);
      
      // If this is human sending to Facebook conversation, also send to Facebook
      if (conversation.source === 'facebook' && senderType === 'human') {
        try {
          await sendFileToFacebook(conversation, req.file, fileUrl);
        } catch (error) {
          console.error("Error sending file to Facebook:", error);
          // Continue anyway since message was saved to database
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      console.log("🔍 Analytics Debug - Date Range:", { startDate, endDate });
      
      // For today's date filter, calculate real-time analytics from messages
      if (startDate && endDate) {
        // Get messages for the date range
        const outboundMessages = await storage.getOutboundMessages(userId, startDate as string, endDate as string);
        const aiMessages = await storage.getCustomerAiMessages(userId, startDate as string, endDate as string);
        
        const realTimeAnalytics = {
          unreadMessages: 0, // Always 0 for filtered date ranges
          moneySaved: "0", // Calculate based on AI messages
          leads: 0,
          opportunities: 0,
          followUps: 0,
          messagesHuman: outboundMessages.human.length,
          messagesAi: outboundMessages.ai.length,
          hourlyData: null,
        };
        
        console.log("🔍 Analytics Debug - Real-time data:", realTimeAnalytics);
        return res.json(realTimeAnalytics);
      }
      
      // Fallback to stored analytics if no date filter
      const analytics = await storage.getAnalytics(userId);
      
      // If no analytics exist, return default values
      if (!analytics) {
        const defaultAnalytics = {
          unreadMessages: 0,
          moneySaved: "0",
          leads: 0,
          opportunities: 0,
          followUps: 0,
          messagesHuman: 0,
          messagesAi: 0,
          hourlyData: null,
        };
        return res.json(defaultAnalytics);
      }
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Messages Received Per Hour Analytics endpoint
  app.get('/api/analytics/conversations-per-hour', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;
      
      console.log("🔍 Messages Received Per Hour Debug - User ID:", userId);
      console.log("🔍 Messages Received Per Hour Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Messages Received Per Hour Debug - Comparison Period:", comparisonPeriod);
      
      // Get inbound customer messages only from legitimate conversations
      const inboundMessages = await storage.getInboundCustomerMessages(userId, startDate, endDate);
      
      console.log("🔍 Messages Received Per Hour Debug - Customer Messages found:", inboundMessages.length);
      
      // Initialize hourly data array (24 hours)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour === 0 ? '12am' : hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`,
        hourValue: hour,
        messages: 0
      }));
      
      if (inboundMessages.length > 0) {
        // Count customer messages received by hour (convert to Philippines timezone)
        const messagesByHour: { [key: number]: number } = {};
        inboundMessages.forEach((message: any) => {
          if (message.createdAt) {
            // Convert UTC timestamp to Philippines time (UTC+8)
            const utcDate = new Date(message.createdAt);
            const philippinesOffset = 8 * 60; // 8 hours in minutes
            const philippinesDate = new Date(utcDate.getTime() + (philippinesOffset * 60 * 1000));
            const hour = philippinesDate.getHours();
            
            console.log(`🔍 Message ${message.id}: UTC ${utcDate.toISOString()} -> PH ${philippinesDate.toISOString()} (Hour: ${hour})`);
            
            messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
          }
        });
        
        console.log("🔍 Messages Received Per Hour Debug - Messages by hour (Philippines time):", messagesByHour);
        
        // Populate hourly data with actual message counts
        hourlyData.forEach(item => {
          const count = messagesByHour[item.hourValue] || 0;
          item.messages = count;
        });
        
        console.log("🔍 Messages Received Per Hour Debug - Sample hourly data:", hourlyData.slice(18, 22));
      }
      
      console.log("🔍 Messages Received Per Hour Debug - Final hourly data total messages:", hourlyData.reduce((sum, h) => sum + h.messages, 0));
      
      res.json({
        hourlyData,
        totalInboundMessages: inboundMessages.length,
        isToday: startDate === endDate && startDate === new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error("Error calculating messages received per hour:", error);
      res.status(500).json({ message: "Failed to calculate messages received per hour" });
    }
  });

  // Messages Sent Analytics endpoint
  app.get('/api/analytics/messages-sent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;
      
      console.log("🔍 Messages Sent Debug - User ID:", userId);
      console.log("🔍 Messages Sent Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Messages Sent Debug - Comparison Period:", comparisonPeriod);
      
      // Get outbound messages (AI and human) from legitimate customer conversations only
      const outboundMessages = await storage.getOutboundMessages(userId, startDate, endDate);
      
      const aiCount = outboundMessages.ai.length;
      const humanCount = outboundMessages.human.length;
      const totalMessages = aiCount + humanCount;
      
      console.log("🔍 Messages Sent Debug - AI Messages:", aiCount);
      console.log("🔍 Messages Sent Debug - Human Messages:", humanCount);
      console.log("🔍 Messages Sent Debug - Total Messages:", totalMessages);
      
      // Calculate percentages
      let aiPercentage = 0;
      let humanPercentage = 0;
      
      if (totalMessages > 0) {
        aiPercentage = Math.round((aiCount / totalMessages) * 100);
        humanPercentage = Math.round((humanCount / totalMessages) * 100);
        
        // Ensure percentages add up to 100% (handle rounding)
        if (aiPercentage + humanPercentage !== 100) {
          if (aiCount > humanCount) {
            aiPercentage = 100 - humanPercentage;
          } else {
            humanPercentage = 100 - aiPercentage;
          }
        }
      }
      
      // Calculate comparison period if provided
      let change = "same as last month";
      if (comparisonPeriod && startDate && endDate) {
        // Calculate previous period dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        const prevEndDate = new Date(startDateObj);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);
        
        const prevOutboundMessages = await storage.getOutboundMessages(
          userId, 
          prevStartDate.toISOString().split('T')[0], 
          prevEndDate.toISOString().split('T')[0]
        );
        
        const prevTotalMessages = prevOutboundMessages.ai.length + prevOutboundMessages.human.length;
        
        if (totalMessages > prevTotalMessages) {
          const diff = totalMessages - prevTotalMessages;
          change = `+${diff} messages vs last period`;
        } else if (totalMessages < prevTotalMessages) {
          const diff = prevTotalMessages - totalMessages;
          change = `-${diff} messages vs last period`;
        }
      }
      
      res.json({
        totalMessages,
        aiMessages: aiCount,
        humanMessages: humanCount,
        aiPercentage,
        humanPercentage,
        change,
        period: { startDate, endDate }
      });
    } catch (error) {
      console.error("Error calculating messages sent:", error);
      res.status(500).json({ message: "Failed to calculate messages sent" });
    }
  });

  // Time Saved Analytics endpoint
  app.get('/api/analytics/time-saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;

      console.log("🔍 Time Saved Debug - User ID:", userId);
      console.log("🔍 Time Saved Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Time Saved Debug - Comparison Period:", comparisonPeriod);

      // Get AI messages from legitimate customer conversations only
      const aiMessages = await storage.getCustomerAiMessages(userId, startDate as string, endDate as string);
      console.log("🔍 Time Saved Debug - AI Messages found:", aiMessages.length);

      // Calculate time saved (assuming 2 minutes per AI response vs manual response)
      const timePerMessageMinutes = 2;
      const totalMinutesSaved = aiMessages.length * timePerMessageMinutes;
      
      let timeSaved = "0 mins";
      if (totalMinutesSaved >= 60) {
        const hours = Math.floor(totalMinutesSaved / 60);
        const minutes = totalMinutesSaved % 60;
        if (minutes > 0) {
          timeSaved = `${hours}h ${minutes}m`;
        } else {
          timeSaved = `${hours}h`;
        }
      } else if (totalMinutesSaved > 0) {
        timeSaved = `${totalMinutesSaved} mins`;
      }

      // Calculate comparison period if provided
      let change = "same as last month";
      if (comparisonPeriod && startDate && endDate) {
        // Calculate previous period dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        const prevEndDate = new Date(startDateObj);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);
        
        const prevAiMessages = await storage.getCustomerAiMessages(
          userId, 
          prevStartDate.toISOString().split('T')[0], 
          prevEndDate.toISOString().split('T')[0]
        );
        
        const prevTotalMinutesSaved = prevAiMessages.length * timePerMessageMinutes;
        
        if (totalMinutesSaved > prevTotalMinutesSaved) {
          const diff = totalMinutesSaved - prevTotalMinutesSaved;
          change = `+${diff} mins vs last period`;
        } else if (totalMinutesSaved < prevTotalMinutesSaved) {
          const diff = prevTotalMinutesSaved - totalMinutesSaved;
          change = `-${diff} mins vs last period`;
        }
      }

      console.log("🔍 Time Saved Debug - Final calculation:", {
        aiMessagesCount: aiMessages.length,
        totalMinutesSaved,
        timeSaved,
        change
      });

      res.json({
        timeSaved,
        totalMinutesSaved,
        aiMessagesCount: aiMessages.length,
        change,
        period: { startDate, endDate }
      });
    } catch (error) {
      console.error("Error calculating time saved:", error);
      res.status(500).json({ message: "Failed to calculate time saved" });
    }
  });

  // FAQ Analysis endpoint
  app.get('/api/faq-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      console.log("🔍 FAQ Analysis Debug - User ID:", userId);
      console.log("🔍 FAQ Analysis Debug - Date Range:", { startDate, endDate });
      
      // Get customer messages for FAQ analysis
      const messages = await storage.getMessagesForFaqAnalysis(userId, startDate, endDate);
      console.log("🔍 FAQ Analysis Debug - Messages found:", messages.length);
      
      if (messages.length === 0) {
        console.log("🔍 FAQ Analysis Debug - No messages found, returning empty result");
        return res.json([]);
      }
      
      // Extract questions from customer messages
      const customerQuestions = messages
        .filter(msg => msg.senderType === 'customer')
        .map(msg => msg.content)
        .filter(content => content && content.trim().length > 0)
        .filter(content => {
          // Filter out simple greetings and single words
          const trimmed = content.trim().toLowerCase();
          const simpleGreetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening'];
          return !simpleGreetings.includes(trimmed) && content.length > 3;
        });
      
      console.log("🔍 FAQ Analysis Debug - Customer questions extracted:", customerQuestions.length);
      
      if (customerQuestions.length === 0) {
        console.log("🔍 FAQ Analysis Debug - No valid questions found, returning empty result");
        return res.json([]);
      }
      
      // Get existing FAQs from business info
      const business = await storage.getBusiness(userId);
      const existingFaqs = business?.faqs || '';
      const faqList = existingFaqs ? existingFaqs.split('\n').filter(faq => faq.trim()) : [];
      
      console.log("🔍 FAQ Analysis Debug - Existing FAQs:", faqList.length);
      
      // Count frequency of similar questions
      const questionCounts: { [key: string]: number } = {};
      const processedQuestions: string[] = [];
      
      customerQuestions.forEach(question => {
        const normalized = question.toLowerCase().trim();
        // Group similar questions (basic similarity check)
        let foundSimilar = false;
        
        for (const processed of processedQuestions) {
          const processedNormalized = processed.toLowerCase().trim();
          // Simple similarity check - if questions share significant words
          const questionWords = normalized.split(' ').filter(word => word.length > 3);
          const processedWords = processedNormalized.split(' ').filter(word => word.length > 3);
          
          const commonWords = questionWords.filter(word => processedWords.includes(word));
          const similarityRatio = commonWords.length / Math.max(questionWords.length, processedWords.length);
          
          if (similarityRatio > 0.5) { // 50% similarity threshold
            questionCounts[processed] = (questionCounts[processed] || 1) + 1;
            foundSimilar = true;
            break;
          }
        }
        
        if (!foundSimilar) {
          processedQuestions.push(question);
          questionCounts[question] = 1;
        }
      });
      
      // Convert to array and sort by frequency
      const frequentQuestions = Object.entries(questionCounts)
        .map(([question, count]) => {
          // Check if this question (or similar) already exists in FAQs
          const isInFaq = faqList.some(faq => {
            const faqLower = faq.toLowerCase();
            const questionLower = question.toLowerCase();
            return faqLower.includes(questionLower) || questionLower.includes(faqLower);
          });
          
          return {
            question,
            count,
            isInFaq
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 most frequent questions
      
      console.log("🔍 FAQ Analysis Debug - Final frequent questions:", frequentQuestions.length);
      console.log("🔍 FAQ Analysis Debug - Sample questions:", frequentQuestions.slice(0, 3));
      
      res.json(frequentQuestions);
    } catch (error) {
      console.error("Error analyzing FAQ:", error);
      res.status(500).json({ message: "Failed to analyze FAQ" });
    }
  });

  // Channel routes
  app.get('/api/channels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channel = await storage.getChannel(userId);
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.post('/api/channels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChannelSchema.parse(req.body);
      
      // Generate embed code
      const embedCode = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  (function() {
    var chatWidget = document.createElement('div');
    chatWidget.id = 'minechat-widget';
    chatWidget.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
    document.body.appendChild(chatWidget);
    
    var script = document.createElement('script');
    script.src = 'https://cdn.minechat.ai/widget.js';
    script.setAttribute('data-user-id', '${userId}');
    script.setAttribute('data-color', '${validatedData.primaryColor || '#A53860'}');
    document.head.appendChild(script);
  })();
</script>`;

      const channelData = {
        ...validatedData,
        embedCode,
        userId,
      };

      const channel = await storage.upsertChannel(userId, channelData);
      res.json(channel);
    } catch (error) {
      console.error("Error saving channel:", error);
      res.status(500).json({ message: "Failed to save channel" });
    }
  });

  // AI Chat endpoint
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

      // Get AI assistant configuration
      const aiAssistant = await storage.getAiAssistant(userId);
      const business = await storage.getBusiness(userId);
      const products = await storage.getProducts(userId);
      const documents = await storage.getDocuments(userId);

      // Build AI context
      let context = "";
      if (business) {
        if (business.companyName) context += `Business: ${business.companyName}\n`;
        if (business.companyStory) context += `Story: ${business.companyStory}\n`;
        if (business.email || business.phoneNumber) {
          context += `Contact: ${business.email || 'N/A'}, ${business.phoneNumber || 'N/A'}\n\n`;
        }
      }
      
      if (products && products.length > 0) {
        context += "Products/Services:\n";
        products.forEach(product => {
          context += `- ${product.name || 'Unnamed Product'}: ${product.description || 'No description'}\n`;
          if (product.price) context += `  Price: $${product.price}\n`;
          if (product.faqs) context += `  FAQs: ${product.faqs}\n`;
        });
        context += "\n";
      }

      if (documents && documents.length > 0) {
        context += `Available documents: ${documents.map(d => d.originalName).join(", ")}\n\n`;
      }

      // Build comprehensive knowledge base from all saved data
      let knowledgeBase = "";
      
      // Business Information Section
      if (business) {
        knowledgeBase += `=== BUSINESS INFORMATION ===\n`;
        if (business.companyName) knowledgeBase += `Company Name: ${business.companyName}\n`;
        if (business.email) knowledgeBase += `Email: ${business.email}\n`;
        if (business.phoneNumber) knowledgeBase += `Phone: ${business.phoneNumber}\n`;
        if (business.address) knowledgeBase += `Address: ${business.address}\n`;
        if (business.companyStory) knowledgeBase += `Company Story: ${business.companyStory}\n`;
        if (business.faqs) {
          // Extract individual FAQ entries and format them more efficiently
          console.log("🔍 Processing FAQs, raw data length:", business.faqs.length);
          const faqSections = business.faqs.split('### ').filter(section => section.trim());
          console.log("🔍 Found FAQ sections:", faqSections.length);
          if (faqSections.length > 0) {
            knowledgeBase += `Frequently Asked Questions:\n`;
            faqSections.forEach((section, index) => {
              const [question, ...answerParts] = section.split('\n\n');
              if (question && answerParts.length > 0) {
                const answer = answerParts.join('\n\n').trim();
                // Only include the first 300 characters of long answers to save space
                const truncatedAnswer = answer.length > 300 ? answer.substring(0, 300) + '...' : answer;
                console.log(`🔍 FAQ ${index + 1}: Q: ${question.trim()}`);
                knowledgeBase += `Q: ${question.trim()}\nA: ${truncatedAnswer}\n\n`;
              }
            });
          }
        }
        if (business.paymentDetails) knowledgeBase += `Payment Details: ${business.paymentDetails}\n`;
        if (business.discounts) knowledgeBase += `Discounts: ${business.discounts}\n`;
        if (business.policy) knowledgeBase += `Policy: ${business.policy}\n`;
        if (business.additionalNotes) knowledgeBase += `Additional Notes: ${business.additionalNotes}\n`;
        if (business.thankYouMessage) knowledgeBase += `Thank You Message: ${business.thankYouMessage}\n`;
        knowledgeBase += `\n`;
      }
      
      // AI Assistant Information Section
      if (aiAssistant) {
        knowledgeBase += `=== AI ASSISTANT KNOWLEDGE ===\n`;
        if (aiAssistant.name) knowledgeBase += `Assistant Name: ${aiAssistant.name}\n`;
        if (aiAssistant.description) knowledgeBase += `Knowledge Base: ${aiAssistant.description}\n`;
        if (aiAssistant.guidelines) knowledgeBase += `Guidelines: ${aiAssistant.guidelines}\n`;
        if (aiAssistant.introMessage) knowledgeBase += `Intro Message: ${aiAssistant.introMessage}\n`;
        if (aiAssistant.responseLength) knowledgeBase += `Response Style: ${aiAssistant.responseLength}\n`;
        knowledgeBase += `\n`;
      }
      
      // Products Section
      if (products.length > 0) {
        knowledgeBase += `=== PRODUCTS/SERVICES ===\n`;
        products.forEach((product, index) => {
          knowledgeBase += `--- Product ${index + 1} ---\n`;
          if (product.name) knowledgeBase += `Name: ${product.name}\n`;
          if (product.description) knowledgeBase += `Description: ${product.description}\n`;
          if (product.price) knowledgeBase += `Price: $${product.price}\n`;
          if (product.discounts) knowledgeBase += `Discounts: ${product.discounts}\n`;
          if (product.paymentDetails) knowledgeBase += `Payment: ${product.paymentDetails}\n`;
          if (product.policy) knowledgeBase += `Policy: ${product.policy}\n`;
          if (product.faqs) knowledgeBase += `FAQs: ${product.faqs}\n`;
          knowledgeBase += `\n`;
        });
      }
      
      // Documents Section
      if (documents.length > 0) {
        knowledgeBase += `=== UPLOADED DOCUMENTS ===\n`;
        documents.forEach(doc => {
          knowledgeBase += `- ${doc.originalName}\n`;
        });
        knowledgeBase += `\n`;
      }

      const systemPrompt = `You are ${aiAssistant?.name || "an AI assistant"} working for ${business?.companyName || "this business"}. 

CRITICAL INSTRUCTIONS:
1. You have access to complete business information below - USE IT to answer questions
2. NEVER say "I'll be happy to answer questions related to our business" unless the question is completely unrelated to business (like asking about weather, sports, etc.)
3. Always search through the knowledge base first before responding
4. Give specific, detailed answers using the exact information provided
5. Remember conversation history and build on previous interactions

COMPLETE KNOWLEDGE BASE:
${knowledgeBase}

RESPONSE RULES:
- For contact questions: Use exact email (${business?.email}), phone (${business?.phoneNumber}), address (${business?.address})
- For company questions: Use company story and business information
- For product questions: Provide detailed product info including prices
- For FAQ questions: Use the specific FAQ content from products
- For greeting: Use the intro message if available
- Only give generic responses for truly irrelevant questions (weather, sports, unrelated topics)

CONVERSATION CONTEXT:
- Remember what we've discussed previously
- Build on previous questions and answers
- Reference earlier parts of our conversation when relevant

You represent ${business?.companyName || "this business"} and customers expect accurate, specific information from our knowledge base.`;

      let aiMessage = "";
      
      // Debug logging
      console.log("🔍 AI Chat Debug - System Prompt:", systemPrompt);
      console.log("🔍 AI Chat Debug - User Message:", message);
      console.log("🔍 AI Chat Debug - Business Data:", business);
      console.log("🔍 AI Chat Debug - Products:", products);
      
      // Get conversation history for context
      const conversationMessages = await storage.getMessages(conversation.id);
      
      // Build conversation history for OpenAI
      const messages = [{ role: 'system', content: systemPrompt }];
      
      // Add recent conversation history (last 10 messages for context)
      const recentMessages = conversationMessages.slice(-10);
      recentMessages.forEach(msg => {
        if (msg.senderType === "user") {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.senderType === "ai") {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });
      
      // Add current user message
      messages.push({ role: 'user', content: message });

      // Try OpenAI API first
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: aiAssistant?.responseLength === 'short' ? 100 : 
                       aiAssistant?.responseLength === 'long' ? 500 : 250,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          aiMessage = aiResponse.choices[0]?.message?.content || "";
          console.log("✅ OpenAI API Response:", aiMessage);
        } else {
          const errorText = await response.text();
          console.log("❌ OpenAI API Error:", response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      } catch (openaiError) {
        console.log("OpenAI API not available, using intelligent fallback");
        
        // Intelligent fallback based on business context
        const businessName = business?.companyName || "our business";
        const introMsg = aiAssistant?.introMessage || `Hello! I'm ${aiAssistant?.name || "an AI assistant"} for ${businessName}.`;
        
        // Create contextual response based on message content
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          aiMessage = `${introMsg} How can I help you today?`;
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
          if (products.length > 0) {
            // Create detailed pricing response
            let pricingResponse = `Here's our pricing information:\n\n`;
            products.forEach((product, index) => {
              pricingResponse += `${index + 1}. ${product.name || 'Product'}\n`;
              if (product.price) {
                pricingResponse += `   💰 Price: $${product.price}\n`;
              }
              if (product.description) {
                pricingResponse += `   📋 ${product.description}\n`;
              }
              if (product.discounts) {
                pricingResponse += `   🎉 Special Offers: ${product.discounts}\n`;
              }
              if (product.paymentDetails) {
                pricingResponse += `   💳 Payment: ${product.paymentDetails}\n`;
              }
              pricingResponse += `\n`;
            });
            pricingResponse += `Would you like more details about any specific product?`;
            aiMessage = pricingResponse;
          } else {
            aiMessage = `I'd be happy to help with pricing information. Please contact us at ${business?.email || 'our sales team'} for detailed pricing.`;
          }
        } else if (lowerMessage.includes('product') || lowerMessage.includes('service')) {
          if (products.length > 0) {
            const productList = products.map(p => `${p.name}: ${p.description || 'Available now'}`).join('\n');
            aiMessage = `Here are our products and services:\n${productList}\n\nWould you like more information about any of these?`;
          } else {
            aiMessage = `We offer various products and services. Please let me know what you're looking for and I'll be happy to help!`;
          }
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
          aiMessage = `You can reach us at:\n${business?.email ? `Email: ${business.email}\n` : ''}${business?.phoneNumber ? `Phone: ${business.phoneNumber}\n` : ''}${business?.address ? `Address: ${business.address}` : ''}`;
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
          aiMessage = `I'm here to help! I can assist you with information about ${businessName}, our products and services, pricing, and contact details. What would you like to know?`;
        } else {
          // General response incorporating business context
          aiMessage = `Thank you for your message! As an AI assistant for ${businessName}, I'm here to help with any questions about our ${products.length > 0 ? 'products, services, ' : ''}and business. ${business?.companyStory ? business.companyStory.substring(0, 100) + '...' : ''} How can I assist you today?`;
        }
      }

      // Save AI message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: "ai",
        senderType: "ai",
        content: aiMessage,
        messageType: "text"
      });

      // Update analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingAnalytics = await storage.getAnalytics(userId);
      const analyticsData = {
        userId,
        date: today,
        unreadMessages: (existingAnalytics?.unreadMessages || 0) + 1,
        messagesHuman: (existingAnalytics?.messagesHuman || 0) + 1,
        messagesAi: (existingAnalytics?.messagesAi || 0) + 1,
        moneySaved: existingAnalytics?.moneySaved || "25.00", // Example calculation
        leads: existingAnalytics?.leads || 0,
        opportunities: existingAnalytics?.opportunities || 0,
        followUps: existingAnalytics?.followUps || 0,
        hourlyData: existingAnalytics?.hourlyData || {}
      };

      await storage.upsertAnalytics(userId, analyticsData);

      res.json({
        message: aiMessage,
        conversationId: conversation.id
      });

    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Facebook integration routes
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

  app.post('/api/facebook/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For demo purposes, simulate Facebook OAuth flow
      // In production, this would redirect to Facebook's OAuth URL
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(
        `${req.protocol}://${req.hostname}/api/facebook/callback`
      )}&scope=pages_messaging&response_type=code`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating Facebook connection:", error);
      res.status(500).json({ message: "Failed to initiate Facebook connection" });
    }
  });

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

  app.post('/api/facebook/connect-real', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pageId, accessToken } = req.body;

      console.log('Facebook connect request:', { userId, pageId: pageId ? 'PROVIDED' : 'MISSING', accessToken: accessToken ? 'PROVIDED' : 'MISSING' });

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

  // Facebook webhook endpoints for receiving messages
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

  // Test endpoint to refresh Facebook token
  app.post('/api/facebook/refresh-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const newToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      
      if (!newToken) {
        return res.status(400).json({ message: "No Facebook token available" });
      }
      
      await storage.updateFacebookConnection(userId, { accessToken: newToken });
      console.log("Facebook token refreshed for user:", userId);
      
      res.json({ message: "Facebook token refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing Facebook token:", error);
      res.status(500).json({ message: "Failed to refresh Facebook token" });
    }
  });

  // Helper function to handle Facebook messages
  // Helper function to send message to Facebook
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

  // Helper function to send image to Facebook
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

  async function sendTextToFacebook(conversation: any, messageText: string) {
    try {
      const facebookConnections = await storage.getAllFacebookConnections();
      const connection = facebookConnections.find(conn => conn.userId === conversation.userId);
      
      if (!connection || !connection.isConnected) {
        console.log("No active Facebook connection found for user:", conversation.userId);
        return;
      }

      await sendFacebookMessage(connection.accessToken, conversation.facebookSenderId, messageText);
      console.log(`Sent human message to Facebook: ${messageText.substring(0, 50)}...`);
    } catch (error) {
      console.error("Error sending text to Facebook:", error);
      throw error;
    }
  }

  async function sendFileToFacebook(conversation: any, file: any, fileUrl: string) {
    try {
      const facebookConnections = await storage.getAllFacebookConnections();
      const connection = facebookConnections.find(conn => conn.userId === conversation.userId);
      
      if (!connection || !connection.isConnected) {
        console.log("No active Facebook connection found for user:", conversation.userId);
        return;
      }

      // Check if it's an image file
      const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (imageTypes.includes(ext)) {
        // Send as image
        const fullImageUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}${fileUrl}`;
        await sendFacebookImage(connection.accessToken, conversation.facebookSenderId, fullImageUrl);
        console.log(`Sent image file to Facebook: ${file.originalname}`);
      } else {
        // Send as file notification
        const fileMessage = `File shared: ${file.originalname} (${Math.round(file.size / 1024)}KB)`;
        await sendFacebookMessage(connection.accessToken, conversation.facebookSenderId, fileMessage);
        console.log(`Sent file notification to Facebook: ${file.originalname}`);
      }
    } catch (error) {
      console.error("Error sending file to Facebook:", error);
      throw error;
    }
  }

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

      // Get user's AI assistant settings
      const aiAssistant = await storage.getAiAssistant(connection.userId);
      const business = await storage.getBusiness(connection.userId);
      const products = await storage.getProducts(connection.userId);

      console.log("Facebook AI Data Debug:");
      console.log("Connection userId:", connection.userId);
      console.log("AI Assistant:", JSON.stringify(aiAssistant, null, 2));
      console.log("Business:", JSON.stringify(business, null, 2));
      console.log("Products:", JSON.stringify(products, null, 2));

      // Create or get conversation
      let conversation = await storage.getConversationByFacebookSender(connection.userId, senderId);
      if (!conversation) {
        conversation = await storage.createConversation(connection.userId, {
          userId: connection.userId,
          customerName: `Facebook User ${senderId.substring(0, 8)}`,
          customerEmail: null,
          source: "facebook",
          facebookSenderId: senderId
        });
      }

      // Get conversation history for context
      const messages = await storage.getMessages(conversation.id);
      
      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: senderId,
        senderType: "customer",
        content: messageText,
        messageType: "text",
        readByAdmin: false
      });

      // Check conversation mode - only generate AI response if in AI mode
      if (conversation.mode === 'human') {
        console.log(`Conversation ${conversation.id} is in human mode - skipping AI response`);
        return;
      }

      // Generate AI response using the same logic as the chat endpoint
      let aiMessage = "";

      try {
        console.log("🔑 Checking OpenAI API key:", process.env.OPENAI_API_KEY ? "EXISTS" : "MISSING");
        if (process.env.OPENAI_API_KEY) {
          // Build comprehensive knowledge base from all sources with structured format
          let knowledgeBase = "";
          
          // Add Business Information first (most important context)
          if (business) {
            knowledgeBase += `=== BUSINESS INFORMATION ===\n`;
            if (business.companyName) knowledgeBase += `Company: ${business.companyName}\n`;
            if (business.companyStory) knowledgeBase += `About: ${business.companyStory}\n`;
            if (business.email) knowledgeBase += `Contact: ${business.email}\n`;
            if (business.phoneNumber) knowledgeBase += `Phone: ${business.phoneNumber}\n`;
            if (business.address) knowledgeBase += `Address: ${business.address}\n`;
            if (business.faqs) {
              // Extract individual FAQ entries and format them more efficiently
              const faqSections = business.faqs.split('### ').filter(section => section.trim());
              if (faqSections.length > 0) {
                knowledgeBase += `Frequently Asked Questions:\n`;
                faqSections.forEach(section => {
                  const [question, ...answerParts] = section.split('\n\n');
                  if (question && answerParts.length > 0) {
                    const answer = answerParts.join('\n\n').trim();
                    // Only include the first 200 characters for FAQ answers to save space
                    const truncatedAnswer = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
                    knowledgeBase += `Q: ${question.trim()}\nA: ${truncatedAnswer}\n\n`;
                  }
                });
              }
            }
            if (business.paymentDetails) knowledgeBase += `Payment Details: ${business.paymentDetails}\n`;
            if (business.discounts) knowledgeBase += `Discounts: ${business.discounts}\n`;
            if (business.policy) knowledgeBase += `Policy: ${business.policy}\n`;
            if (business.additionalNotes) knowledgeBase += `Additional Notes: ${business.additionalNotes}\n`;
            if (business.thankYouMessage) knowledgeBase += `Thank You Message: ${business.thankYouMessage}\n`;
            knowledgeBase += `\n`;
          }
          
          // Add AI Assistant specific knowledge and guidelines
          if (aiAssistant) {
            knowledgeBase += `=== AI ASSISTANT GUIDELINES ===\n`;
            if (aiAssistant.name) knowledgeBase += `Name: ${aiAssistant.name}\n`;
            if (aiAssistant.description) knowledgeBase += `Knowledge: ${aiAssistant.description}\n`;
            if (aiAssistant.guidelines) knowledgeBase += `Guidelines: ${aiAssistant.guidelines}\n`;
            if (aiAssistant.introMessage) knowledgeBase += `Intro: ${aiAssistant.introMessage}\n`;
            knowledgeBase += `\n`;
          }
          
          // Add comprehensive product/service information
          if (products.length > 0) {
            knowledgeBase += `=== PRODUCTS/SERVICES ===\n`;
            products.forEach((product, index) => {
              knowledgeBase += `--- Product ${index + 1} ---\n`;
              if (product.name) knowledgeBase += `Name: ${product.name}\n`;
              if (product.description) knowledgeBase += `Description: ${product.description}\n`;
              if (product.price) knowledgeBase += `Price: $${product.price}\n`;
              if (product.discounts) knowledgeBase += `Discounts/Offers: ${product.discounts}\n`;
              if (product.paymentDetails) knowledgeBase += `Payment Options: ${product.paymentDetails}\n`;
              if (product.policy) knowledgeBase += `Policies: ${product.policy}\n`;
              if (product.faqs) {
                knowledgeBase += `FAQs:\n${product.faqs}\n`;
              }
              knowledgeBase += `\n`;
            });
          }

          // Build comprehensive knowledge base from all saved data
          let facebookKnowledgeBase = "";
          
          // Business Information Section
          if (business) {
            facebookKnowledgeBase += `=== BUSINESS INFORMATION ===\n`;
            if (business.companyName) facebookKnowledgeBase += `Company Name: ${business.companyName}\n`;
            if (business.email) facebookKnowledgeBase += `Email: ${business.email}\n`;
            if (business.phoneNumber) facebookKnowledgeBase += `Phone: ${business.phoneNumber}\n`;
            if (business.address) facebookKnowledgeBase += `Address: ${business.address}\n`;
            if (business.companyStory) facebookKnowledgeBase += `Company Story: ${business.companyStory}\n`;
            if (business.faqs) facebookKnowledgeBase += `FAQs: ${business.faqs}\n`;
            if (business.paymentDetails) facebookKnowledgeBase += `Payment Details: ${business.paymentDetails}\n`;
            if (business.discounts) facebookKnowledgeBase += `Discounts: ${business.discounts}\n`;
            if (business.policy) facebookKnowledgeBase += `Policy: ${business.policy}\n`;
            if (business.additionalNotes) facebookKnowledgeBase += `Additional Notes: ${business.additionalNotes}\n`;
            if (business.thankYouMessage) facebookKnowledgeBase += `Thank You Message: ${business.thankYouMessage}\n`;
            facebookKnowledgeBase += `\n`;
          }
          
          // AI Assistant Information Section
          if (aiAssistant) {
            facebookKnowledgeBase += `=== AI ASSISTANT KNOWLEDGE ===\n`;
            if (aiAssistant.name) facebookKnowledgeBase += `Assistant Name: ${aiAssistant.name}\n`;
            if (aiAssistant.description) facebookKnowledgeBase += `Knowledge Base: ${aiAssistant.description}\n`;
            if (aiAssistant.guidelines) facebookKnowledgeBase += `Guidelines: ${aiAssistant.guidelines}\n`;
            if (aiAssistant.introMessage) facebookKnowledgeBase += `Intro Message: ${aiAssistant.introMessage}\n`;
            if (aiAssistant.responseLength) facebookKnowledgeBase += `Response Style: ${aiAssistant.responseLength}\n`;
            facebookKnowledgeBase += `\n`;
          }
          
          // Products Section
          if (products.length > 0) {
            facebookKnowledgeBase += `=== PRODUCTS/SERVICES ===\n`;
            products.forEach((product, index) => {
              facebookKnowledgeBase += `--- Product ${index + 1} ---\n`;
              if (product.name) facebookKnowledgeBase += `Name: ${product.name}\n`;
              if (product.description) facebookKnowledgeBase += `Description: ${product.description}\n`;
              if (product.price) facebookKnowledgeBase += `Price: $${product.price}\n`;
              if (product.discounts) facebookKnowledgeBase += `Discounts: ${product.discounts}\n`;
              if (product.paymentDetails) facebookKnowledgeBase += `Payment: ${product.paymentDetails}\n`;
              if (product.policy) facebookKnowledgeBase += `Policy: ${product.policy}\n`;
              if (product.faqs) facebookKnowledgeBase += `FAQs: ${product.faqs}\n`;
              facebookKnowledgeBase += `\n`;
            });
          }

          const systemPrompt = `You are ${aiAssistant?.name || "an AI assistant"} working for ${business?.companyName || "this business"}. 

CRITICAL INSTRUCTIONS:
1. You have access to complete business information below - USE IT to answer questions
2. NEVER say "I'll be happy to answer questions related to our business" unless the question is completely unrelated to business (like asking about weather, sports, etc.)
3. Always search through the knowledge base first before responding
4. Give specific, detailed answers using the exact information provided
5. Remember conversation history and build on previous interactions

COMPLETE KNOWLEDGE BASE:
${facebookKnowledgeBase}

RESPONSE RULES:
- For contact questions: Use exact email (${business?.email}), phone (${business?.phoneNumber}), address (${business?.address})
- For company questions: Use company story and business information
- For product questions: Provide detailed product info including prices
- For FAQ questions: Use the specific FAQ content from products
- For greeting: Use the intro message if available
- Only give generic responses for truly irrelevant questions (weather, sports, unrelated topics)

CONVERSATION CONTEXT:
- Remember what we've discussed previously
- Build on previous questions and answers
- Reference earlier parts of our conversation when relevant

You represent ${business?.companyName || "this business"} and customers expect accurate, specific information from our knowledge base.`;

          console.log("=== FACEBOOK AI DEBUG ===");
          // Build conversation history for context
          const conversationMessages = [];
          conversationMessages.push({ role: "system", content: systemPrompt });
          
          // Add recent conversation history (last 10 messages)
          const recentMessages = messages.slice(-10);
          recentMessages.forEach(msg => {
            if (msg.senderType === "user") {
              conversationMessages.push({ role: "user", content: msg.content });
            } else if (msg.senderType === "ai") {
              conversationMessages.push({ role: "assistant", content: msg.content });
            }
          });
          
          // Add current user message
          conversationMessages.push({ role: "user", content: messageText });

          console.log("System prompt length:", systemPrompt.length);
          console.log("Knowledge base content:", facebookKnowledgeBase);
          console.log("User message:", messageText);
          console.log("Conversation history length:", conversationMessages.length);
          console.log("=========================");

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: conversationMessages,
              max_tokens: 500,
              temperature: 0.3
            })
          });

          if (response.ok) {
            const data = await response.json();
            aiMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your message.";
            console.log("✅ OpenAI API success - Response:", aiMessage);
          } else {
            const errorText = await response.text();
            console.error("❌ OpenAI API error:", response.status, errorText);
            throw new Error(`OpenAI API error: ${response.status}`);
          }
        } else {
          console.log("❌ OpenAI API key not found, using fallback");
          throw new Error("OpenAI API not available");
        }
      } catch (error) {
        console.log("❌ Error in OpenAI API call:", (error as Error).message);
        console.log("Using fallback response for Facebook message");
        
        // Enhanced fallback that uses knowledge base
        const businessName = business?.companyName || "our company";
        const introMsg = aiAssistant?.introMessage || `Hello! I'm ${aiAssistant?.name || "an AI assistant"} for ${businessName}.`;
        
        const lowerMessage = messageText.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          aiMessage = `${introMsg} How can I help you today?`;
        } else if (lowerMessage.includes('discount') || lowerMessage.includes('offer') || lowerMessage.includes('deal')) {
          // Check if there's discount information in the knowledge base
          const productWithDiscounts = products.find(p => p.discounts);
          if (productWithDiscounts && productWithDiscounts.discounts) {
            aiMessage = `Here are our current offers: ${productWithDiscounts.discounts}`;
          } else {
            // Check FAQs for discount information
            const productWithFAQs = products.find(p => p.faqs && (p.faqs.toLowerCase().includes('discount') || p.faqs.toLowerCase().includes('price') || p.faqs.toLowerCase().includes('cost')));
            if (productWithFAQs && productWithFAQs.faqs) {
              // Extract relevant FAQ sections about pricing/discounts
              const faqLines = productWithFAQs.faqs.split('\n');
              const relevantFAQs = faqLines.filter(line => 
                line.toLowerCase().includes('discount') || 
                line.toLowerCase().includes('price') || 
                line.toLowerCase().includes('cost') ||
                line.toLowerCase().includes('free') ||
                line.toLowerCase().includes('trial')
              ).slice(0, 3); // Get first 3 relevant lines
              
              if (relevantFAQs.length > 0) {
                aiMessage = relevantFAQs.join('\n\n');
              } else {
                aiMessage = `For information on discounts and current pricing offers, please contact us directly. Our team can provide you with details on any available discounts based on your business needs and requirements.`;
              }
            } else {
              aiMessage = `For information on discounts and current pricing offers, please contact us directly. Our team can provide you with details on any available discounts based on your business needs and requirements.`;
            }
          }
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
          if (products.length > 0) {
            // Create detailed pricing response
            let pricingResponse = `Here's our pricing information:\n\n`;
            products.forEach((product, index) => {
              pricingResponse += `${index + 1}. ${product.name || 'Product'}\n`;
              if (product.price) {
                pricingResponse += `   💰 Price: $${product.price}\n`;
              }
              if (product.description) {
                pricingResponse += `   📋 ${product.description}\n`;
              }
              if (product.discounts) {
                pricingResponse += `   🎉 Special Offers: ${product.discounts}\n`;
              }
              if (product.paymentDetails) {
                pricingResponse += `   💳 Payment: ${product.paymentDetails}\n`;
              }
              pricingResponse += `\n`;
            });
            pricingResponse += `Would you like more details about any specific product?`;
            aiMessage = pricingResponse;
          } else {
            aiMessage = `I'd be happy to help with pricing. Please contact us at ${business?.email || 'our sales team'} for details.`;
          }
        } else if (lowerMessage.includes('faq') || lowerMessage.includes('questions')) {
          // Use FAQs from knowledge base
          const productWithFAQs = products.find(p => p.faqs);
          if (productWithFAQs && productWithFAQs.faqs) {
            aiMessage = `Here are some frequently asked questions: ${productWithFAQs.faqs.substring(0, 300)}...`;
          } else {
            aiMessage = `I'm here to answer any questions about ${businessName}. What would you like to know?`;
          }
        } else {
          aiMessage = `Thank you for your message! I'm here to help with any questions about ${businessName}. How can I assist you?`;
        }
      }

      // Save AI response
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: "ai",
        senderType: "ai",
        content: aiMessage,
        messageType: "text"
      });

      // Check if we should send product photos along with the response
      const lowerMessage = messageText.toLowerCase();
      const shouldSendPhoto = (
        lowerMessage.includes('product') || 
        lowerMessage.includes('photo') || 
        lowerMessage.includes('picture') || 
        lowerMessage.includes('image') ||
        lowerMessage.includes('show me') ||
        lowerMessage.includes('what do you sell') ||
        lowerMessage.includes('what are your') ||
        (lowerMessage.includes('price') && products.length > 0)
      );

      // Send text response
      await sendFacebookMessage(connection.accessToken, senderId, aiMessage);

      // Send product photos if relevant and available
      if (shouldSendPhoto && products.length > 0) {
        const productsWithImages = products.filter(p => p.imageUrl);
        if (productsWithImages.length > 0) {
          // Get the domain from environment variables
          const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
          const protocol = domain.includes('localhost') ? 'http' : 'https';
          
          // Send images for all products that have them
          for (let i = 0; i < productsWithImages.length; i++) {
            const product = productsWithImages[i];
            const fullImageUrl = product.imageUrl.startsWith('http') 
              ? product.imageUrl 
              : `${protocol}://${domain}${product.imageUrl}`;
            
            console.log(`Attempting to send image ${i + 1}: ${fullImageUrl}`);
            
            // Add a small delay between images to avoid rate limiting
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const caption = `${product.name || "Our Product"}${product.price ? ` - $${product.price}` : ""}`;
            await sendFacebookImage(connection.accessToken, senderId, fullImageUrl, caption);
          }
        }
      }

      console.log(`Sent AI response to Facebook user ${senderId}: ${aiMessage}`);

    } catch (error) {
      console.error("Error handling Facebook message:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
