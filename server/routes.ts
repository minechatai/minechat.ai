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
      console.log("Business save request - userId:", userId);
      console.log("Business save request - body:", req.body);
      const validatedData = insertBusinessSchema.parse(req.body);
      console.log("Business save - validated data:", validatedData);
      const business = await storage.upsertBusiness(userId, { ...validatedData, userId });
      console.log("Business save - result:", business);
      res.json(business);
    } catch (error) {
      console.error("Error saving business:", error);
      res.status(500).json({ message: "Failed to save business" });
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

  // Product routes
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProducts(userId);
      res.json(products);
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

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        context += `Business: ${business.companyName}\n`;
        context += `Story: ${business.companyStory}\n`;
        context += `Contact: ${business.email}, ${business.phoneNumber}\n\n`;
      }
      
      if (products.length > 0) {
        context += "Products/Services:\n";
        products.forEach(product => {
          context += `- ${product.name}: ${product.description}\n`;
          if (product.price) context += `  Price: $${product.price}\n`;
          if (product.faqs) context += `  FAQs: ${product.faqs}\n`;
        });
        context += "\n";
      }

      if (documents.length > 0) {
        context += `Available documents: ${documents.map(d => d.originalName).join(", ")}\n\n`;
      }

      const systemPrompt = `You are an AI assistant for ${business?.companyName || "this business"}. 
${aiAssistant?.description || "You help customers with their questions and provide information about products and services."}

${aiAssistant?.guidelines || "Be helpful, professional, and friendly."}

Context about the business:
${context}

${aiAssistant?.introMessage ? `Introduction: ${aiAssistant.introMessage}` : ""}

Response style: ${aiAssistant?.responseLength || "normal"} length responses.`;

      let aiMessage = "";
      
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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: aiAssistant?.responseLength === 'short' ? 100 : 
                       aiAssistant?.responseLength === 'long' ? 500 : 250,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          aiMessage = aiResponse.choices[0]?.message?.content || "";
        } else {
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
        senderType: "user",
        content: messageText,
        messageType: "text"
      });

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

          const systemPrompt = `You are ${aiAssistant?.name || "an AI assistant"} representing ${business?.companyName || "this business"}. You help customers with questions about our products and services.

COMPLETE KNOWLEDGE BASE:
${knowledgeBase}

CRITICAL INSTRUCTIONS:
1. ALWAYS search through the knowledge base first before responding
2. Quote specific information from the knowledge base when available
3. For pricing questions: Use exact prices from the "PRODUCTS/SERVICES" section
4. For product questions: Provide details from product descriptions
5. For FAQ questions: Use the detailed FAQ content provided
6. NEVER mention "Minechat AI" unless that's the actual business name
7. If someone asks about products, describe ALL available products with their prices
6. For business questions: Use information from "BUSINESS INFORMATION" section
7. Be specific and detailed - customers want real information, not generic responses
8. If knowledge base has the answer, use it completely rather than giving partial information
9. When mentioning prices, include currency and be specific about what's included

RESPONSE STYLE:
- Professional but friendly tone matching: ${aiAssistant?.guidelines || "Be helpful and professional"}
- Use your intro when greeting: ${aiAssistant?.introMessage || "Hello! How can I help you?"}
- Always end with an offer to help further
- Keep responses concise but informative

CONTACT INFORMATION:
${business?.email ? `Email: ${business.email}` : ""}
${business?.phoneNumber ? `Phone: ${business.phoneNumber}` : ""}

Remember: You represent ${business?.companyName || "this business"} and customers expect accurate, specific information from the knowledge base.`;

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
          console.log("Knowledge base content:", knowledgeBase);
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
        const businessName = business?.companyName || "Minechat AI";
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
