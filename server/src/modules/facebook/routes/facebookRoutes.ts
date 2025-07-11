// server/src/modules/facebook/routes/facebookRoutes.ts

import { Express } from "express";
import { isAuthenticated } from "../../../../replitAuth";
import { storage } from "../../../../storage";


export function setupFacebookRoutes(app: Express) {

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

  // Helper function to get Facebook user profile
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

  // Helper function to handle Facebook messages
  async function handleFacebookMessage(webhookEvent: any) {
    try {
      const senderId = String(webhookEvent.sender.id);
      const recipientId = String(webhookEvent.recipient.id); // This is the page ID
      const messageText = webhookEvent.message.text;

      console.log(`Received Facebook message from ${senderId} to page ${recipientId}: ${messageText}`);

      // Find the Facebook connection for this page
      const facebookConnections = await storage.getAllFacebookConnections();
      const connection = facebookConnections.find(conn => conn.facebookPageId === recipientId);

      console.log("🔍 Debug senderId:", senderId, typeof senderId, senderId.length);
      console.log("🔍 Debug recipientId:", recipientId, typeof recipientId);  
      console.log("🔍 Debug connection.userId:", connection?.userId, typeof connection?.userId);
      console.log("🔍 About to call getConversationByFacebookSender with:", connection?.userId, senderId);

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

      // Get conversation history for context
      const messages = await storage.getMessages(conversation.id);

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: senderId,
        senderType: "customer",
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

      // Generate AI response using the same logic as the chat endpoint
      let aiMessage = "";
      console.log("🔥 Starting AI response generation...");
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
                    // Preserve emojis by not truncating short answers, increase limit for longer ones
                    const truncatedAnswer = answer.length > 500 ? answer.substring(0, 500) + '...' : answer;
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

          const systemPrompt = `You are ${aiAssistant?.name || "an AI assistant"}${business?.companyName ? ` working for ${business.companyName}` : ""}. 

ABSOLUTE RULE: You are a knowledge-base driven AI assistant. You must ONLY use information explicitly provided in the knowledge base below. 

NEVER invent, assume, create, or make up ANY business names, company information, products, services, or business details whatsoever. If the knowledge base is empty or lacks specific information, you MUST respond with: "I don't have that information available. Please contact the business owner to get accurate details."

FORBIDDEN: Do not describe yourself as a "family-owned bakery", "cafe", "restaurant", "store", or any other type of business unless explicitly stated in the knowledge base. Do not describe products, services, locations, or business details that are not provided.

CRITICAL INSTRUCTIONS:
1. You have access to complete business information below - USE IT to answer questions
2. NEVER say "I'll be happy to answer questions related to our business" unless the question is completely unrelated to business (like asking about weather, sports, etc.)
3. Always search through the knowledge base first before responding
4. Give specific, detailed answers using the exact information provided
5. Remember conversation history and build on previous interactions
6. PRODUCT NAME MATCHING: When a user mentions ANY product name from the knowledge base (like "JJ", "Messenger", etc.), you MUST provide information about that specific product from the knowledge base
7. NEVER say "I don't have that information" if the product exists in the PRODUCTS/SERVICES section of the knowledge base

COMPLETE KNOWLEDGE BASE:
${knowledgeBase}

RESPONSE RULES:
- For FAQ questions: Use the FAQ answers VERBATIM - copy the exact text including all emojis, punctuation, and formatting
- For contact questions: Use exact email (${business?.email}), phone (${business?.phoneNumber}), address (${business?.address})
- For company questions: Use company story and business information
- For product questions: Provide detailed product info including prices from the knowledge base
- For specific product requests (like "picture of [product name]" or "tell me about [product name]"): Search the knowledge base for that exact product name and provide its details
- For greeting: Use the intro message if available
- When a question matches any FAQ: Respond with the exact FAQ answer, don't paraphrase or rewrite it
- PRODUCT EXAMPLES: If someone asks about "JJ" and you see "Name: JJ" in the PRODUCTS/SERVICES section, provide that product's information
- IMPORTANT: When asked about specific products by name, always check if that product exists in the knowledge base before saying you don't have information
- Only give generic responses for truly irrelevant questions (weather, sports, unrelated topics)

CONVERSATION CONTEXT:
- Remember what we've discussed previously
- Build on previous questions and answers
- Reference earlier parts of our conversation when relevant

You represent ${business?.companyName || "our business"} and customers expect accurate, specific information from our knowledge base.`;

          console.log("🔥 About to call OpenAI API...");
          console.log("=== FACEBOOK AI DEBUG ===");
          // Build conversation history for context
          const conversationMessages = [];
          conversationMessages.push({ role: "system", content: systemPrompt });

          // Skip conversation history when no business data exists to ensure fresh start
          if (business?.companyName) {
            // Add recent conversation history (last 10 messages)
            const recentMessages = messages.slice(-10);
            recentMessages.forEach(msg => {
              if (msg.senderType === "customer") {
                conversationMessages.push({ role: "user", content: msg.content });
              } else if (msg.senderType === "ai") {
                conversationMessages.push({ role: "assistant", content: msg.content });
              }
            });
          }

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

          console.log("🔥 OpenAI API call completed, response:", response.ok);

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

      // Check if we should send product photos and which specific products
      const lowerMessage = messageText.toLowerCase();

      // Check for specific product requests
      const requestedProducts: any[] = [];
      let sendAllProducts = false;

      // Check if asking for specific product by name
      for (const product of products) {
        if (product.name && lowerMessage.includes(product.name.toLowerCase())) {
          requestedProducts.push(product);
        }
      }

      // Check for general product inquiries (send all products)
      if (requestedProducts.length === 0 && (
        lowerMessage.includes('what do you sell') ||
        lowerMessage.includes('what are your products') ||
        lowerMessage.includes('show me your products') ||
        (lowerMessage.includes('products') && (lowerMessage.includes('all') || lowerMessage.includes('everything')))
      )) {
        sendAllProducts = true;
      }

      // Send text response first
      await sendFacebookMessage(connection.accessToken, senderId, aiMessage);

      // Then send product photos based on context
      const productsToSendImages = sendAllProducts ? products : requestedProducts;

      if (productsToSendImages.length > 0) {
        const productsWithImages = productsToSendImages.filter(p => 
          (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) || p.imageUrl
        );

        if (productsWithImages.length > 0) {
          // Get the domain from environment variables
          const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
          const protocol = domain.includes('localhost') ? 'http' : 'https';

          let imageCount = 0;

          // Send images for requested products only
          for (const product of productsWithImages) {
            // Use imageUrls array if available, otherwise fall back to single imageUrl
            const imagesToSend = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
              ? product.imageUrls 
              : product.imageUrl ? [product.imageUrl] : [];

            for (const imageUrl of imagesToSend) {
              if (!imageUrl) continue;

              const fullImageUrl = imageUrl.startsWith('http') 
                ? imageUrl 
                : `${protocol}://${domain}${imageUrl}`;

              console.log(`Attempting to send image ${imageCount + 1} for ${product.name}: ${fullImageUrl}`);

              // Add a small delay between images to avoid rate limiting
              if (imageCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              // Send image without caption since AI response already contains product details
              await sendFacebookImage(connection.accessToken, senderId, fullImageUrl);

              imageCount++;
            }
          }
        }
      }

      console.log(`Sent AI response to Facebook user ${senderId}: ${aiMessage}`);

    } catch (error) {
      console.error("Error handling Facebook message:", error);
    }
  }

  // Facebook integration routes
  app.get('/api/facebook-connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.effectiveUserId || req.user.claims.sub;
      const connection = await storage.getFacebookConnection(userId);
      res.json(connection || { isConnected: false });
    } catch (error) {
      console.error("Error fetching Facebook connection:", error);
      res.status(500).json({ message: "Failed to fetch Facebook connection" });
    }
  });

  // Start Facebook OAuth flow
  app.get('/api/facebook/oauth/start', isAuthenticated, async (req: any, res) => {
    try {
      const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
      
      if (!FACEBOOK_APP_ID) {
        console.error("Facebook integration not available - App ID not configured");
        return res.status(500).json({ message: "Facebook integration temporarily unavailable" });
      }

      // Use the current Replit domain for redirect URI
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : `${req.protocol}://${req.get('host')}`;
      
      const FACEBOOK_REDIRECT_URI = `${baseUrl}/api/facebook/oauth/callback`;
      
      console.log("Facebook OAuth Config:", {
        appId: FACEBOOK_APP_ID?.substring(0, 8) + "...", // Only show first 8 chars for security
        redirectUri: FACEBOOK_REDIRECT_URI,
        baseUrl: baseUrl
      });

      const scope = 'pages_manage_metadata,pages_messaging,pages_read_engagement';
      const state = req.user.claims.sub; // Use user ID as state for security
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${FACEBOOK_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&` +
        `scope=${scope}&` +
        `state=${state}&` +
        `response_type=code`;

      console.log("Generated Facebook Auth URL:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error starting Facebook OAuth:", error);
      res.status(500).json({ message: "Failed to start Facebook authentication" });
    }
  });

  // Handle Facebook OAuth callback
  app.get('/api/facebook/oauth/callback', async (req: any, res) => {
    try {
      const { code, state, error } = req.query;
      
      console.log("Facebook OAuth callback received:", { code: !!code, state, error });
      
      if (error) {
        console.error("Facebook OAuth error:", error);
        return res.redirect(`/setup/channels?error=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        console.error("Missing code or state in callback");
        return res.redirect('/setup/channels?error=invalid_callback');
      }

      const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
      const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
      
      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        console.error("Facebook app credentials not configured");
        return res.redirect('/setup/channels?error=service_unavailable');
      }

      // Use the same domain logic as the start endpoint
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : `${req.protocol}://${req.get('host')}`;
      
      const FACEBOOK_REDIRECT_URI = `${baseUrl}/api/facebook/oauth/callback`;

      console.log("Exchanging code for access token with redirect URI:", FACEBOOK_REDIRECT_URI);

      // Exchange code for access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}&` +
        `client_secret=${FACEBOOK_APP_SECRET}&` +
        `redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&` +
        `code=${code}`);

      const tokenData = await tokenResponse.json();
      
      console.log("Token exchange response:", tokenData.error ? { error: tokenData.error } : { success: true });
      
      if (tokenData.error) {
        console.error("Token exchange failed:", tokenData.error);
        return res.redirect(`/setup/channels?error=${encodeURIComponent(tokenData.error.message)}`);
      }

      // Get user's Facebook pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?` +
        `access_token=${tokenData.access_token}&` +
        `fields=id,name,access_token,picture`);

      const pagesData = await pagesResponse.json();
      
      console.log("Pages fetch response:", pagesData.error ? { error: pagesData.error } : { pagesCount: pagesData.data?.length });
      
      if (pagesData.error) {
        console.error("Failed to fetch pages:", pagesData.error);
        return res.redirect(`/setup/channels?error=${encodeURIComponent(pagesData.error.message)}`);
      }

      // Store pages data in session for selection
      req.session.facebookPages = pagesData.data;
      req.session.userId = state;

      console.log("Facebook OAuth successful, redirecting to page selection");
      // Redirect to page selection
      res.redirect('/setup/channels?step=select_page');
    } catch (error) {
      console.error("Error in Facebook OAuth callback:", error);
      res.redirect('/setup/channels?error=callback_failed');
    }
  });

  // Get available Facebook pages from session
  app.get('/api/facebook/pages', isAuthenticated, async (req: any, res) => {
    try {
      const pages = req.session.facebookPages || [];
      res.json({ pages });
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      res.status(500).json({ message: "Failed to fetch Facebook pages" });
    }
  });

  // Connect to a specific Facebook page
  app.post('/api/facebook/connect-page', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.effectiveUserId || req.user.claims.sub;
      const { pageId } = req.body;
      
      if (!pageId) {
        return res.status(400).json({ message: "Page ID is required" });
      }

      const pages = req.session.facebookPages || [];
      const selectedPage = pages.find((page: any) => page.id === pageId);
      
      if (!selectedPage) {
        return res.status(404).json({ message: "Selected page not found" });
      }

      // Save Facebook connection to database
      await storage.upsertFacebookConnection(userId, {
        facebookPageId: selectedPage.id,
        facebookPageName: selectedPage.name,
        facebookPagePictureUrl: selectedPage.picture?.data?.url || null,
        accessToken: selectedPage.access_token,
        isConnected: true,
      });

      // Set up webhook subscription for the page
      try {
        const webhookResponse = await fetch(`https://graph.facebook.com/v18.0/${selectedPage.id}/subscribed_apps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscribed_fields: 'messages',
            access_token: selectedPage.access_token
          })
        });

        const webhookData = await webhookResponse.json();
        console.log('Webhook subscription result:', webhookData);
      } catch (webhookError) {
        console.error('Error setting up webhook:', webhookError);
        // Don't fail the connection if webhook setup fails
      }

      // Clear session data
      delete req.session.facebookPages;
      delete req.session.userId;

      res.json({ 
        message: "Facebook page connected successfully",
        page: {
          id: selectedPage.id,
          name: selectedPage.name,
          picture: selectedPage.picture?.data?.url
        }
      });
    } catch (error) {
      console.error("Error connecting Facebook page:", error);
      res.status(500).json({ message: "Failed to connect Facebook page" });
    }
  });

  // Disconnect Facebook page
  app.post('/api/facebook/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.effectiveUserId || req.user.claims.sub;
      await storage.disconnectFacebook(userId);
      res.json({ message: "Facebook page disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      res.status(500).json({ message: "Failed to disconnect Facebook page" });
    }
  });

  // Legacy connect endpoint for backwards compatibility
  app.post('/api/facebook/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.effectiveUserId || req.user.claims.sub;

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
      const userId = req.effectiveUserId || req.user.claims.sub;
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
      const userId = req.effectiveUserId || req.user.claims.sub;
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

  app.delete('/api/facebook/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.effectiveUserId || req.user.claims.sub;
      await storage.disconnectFacebook(userId);
      res.json({ message: "Facebook Messenger disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      res.status(500).json({ message: "Failed to disconnect Facebook" });
    }
  });

  // Test endpoint for webhook debugging
  app.get("/api/facebook/webhook/test", (req, res) => {
    res.json({ 
      message: "Facebook webhook is accessible",
      timestamp: new Date().toISOString(),
      status: "active"
    });
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
}