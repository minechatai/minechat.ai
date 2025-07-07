import type { Express } from "express";
import { storage } from "../../../storage";
import { isAuthenticated } from "../../../replitAuth";
import { insertAiAssistantSchema } from "@shared/schema";

export function setupAiRoutes(app: Express): void {
  // Get AI Assistant configuration
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

  // Save AI Assistant configuration
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

  // Delete AI Assistant configuration
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

  // Main AI Chat endpoint
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

      // Get AI assistant configuration and business data
      const aiAssistant = await storage.getAiAssistant(userId);
      const business = await storage.getBusiness(userId);
      const products = await storage.getProducts(userId);
      const documents = await storage.getDocuments(userId);

      // Build comprehensive knowledge base
      const knowledgeBase = buildKnowledgeBase(business, aiAssistant, products, documents);

      // Build system prompt
      const systemPrompt = buildSystemPrompt(aiAssistant, business, knowledgeBase);

      // Get conversation history for context
      const conversationMessages = await storage.getMessages(conversation.id);

      // Build messages for OpenAI
      const messages = [{ role: 'system', content: systemPrompt }];

      // Add conversation history if business data exists
      if (business?.companyName) {
        const recentMessages = conversationMessages.slice(-10);
        recentMessages.forEach(msg => {
          if (msg.senderType === "user") {
            messages.push({ role: 'user', content: msg.content });
          } else if (msg.senderType === "ai") {
            messages.push({ role: 'assistant', content: msg.content });
          }
        });
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Generate AI response
      const aiMessage = await generateAiResponse(messages, aiAssistant, business, products);

      // Save AI message
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: "ai",
        senderType: "ai",
        content: aiMessage,
        messageType: "text"
      });

      // Update analytics
      await updateAnalytics(userId);

      // Check if message mentions products and include relevant images
      const images = getRelevantProductImages(message, aiMessage, products);

      res.json({
        message: aiMessage,
        conversationId: conversation.id,
        images: images
      });

    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // AI Chat Testing endpoint (doesn't save to database)
  app.post('/api/chat/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get AI assistant configuration (but don't save anything to database)
      const aiAssistant = await storage.getAiAssistant(userId);
      const business = await storage.getBusiness(userId);
      const products = await storage.getProducts(userId);
      const documents = await storage.getDocuments(userId);

      // Build comprehensive knowledge base
      const knowledgeBase = buildKnowledgeBase(business, aiAssistant, products, documents);

      // Build system prompt
      const systemPrompt = buildSystemPrompt(aiAssistant, business, knowledgeBase);

      // Build messages for OpenAI (no conversation history for testing)
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Generate AI response
      const aiMessage = await generateAiResponse(messages, aiAssistant, business, products);

      // Check if AI response mentions products and include images
      const images = getRelevantProductImages(message, aiMessage, products);

      // Return response without saving to database
      res.json({
        message: aiMessage,
        images: images
      });

    } catch (error) {
      console.error("Error in chat testing:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
}

// Helper function to build comprehensive knowledge base
function buildKnowledgeBase(business: any, aiAssistant: any, products: any[], documents: any[]): string {
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
      const faqSections = business.faqs.split('### ').filter((section: string) => section.trim());
      if (faqSections.length > 0) {
        knowledgeBase += `Frequently Asked Questions:\n`;
        faqSections.forEach((section: string) => {
          const [question, ...answerParts] = section.split('\n\n');
          if (question && answerParts.length > 0) {
            const answer = answerParts.join('\n\n').trim();
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
    products.forEach((product: any, index: number) => {
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
    documents.forEach((doc: any) => {
      knowledgeBase += `- ${doc.originalName}\n`;
    });
    knowledgeBase += `\n`;
  }

  return knowledgeBase;
}

// Helper function to build system prompt
function buildSystemPrompt(aiAssistant: any, business: any, knowledgeBase: string): string {
  return `You are ${aiAssistant?.name || "an AI assistant"}${business?.companyName ? ` working for ${business.companyName}` : ""}. 

ABSOLUTE RULE: You are a knowledge-base driven AI assistant. You must ONLY use information explicitly provided in the knowledge base below. 

NEVER invent, assume, create, or make up ANY business names, company information, products, services, or business details whatsoever. If the knowledge base is empty or lacks specific information, you MUST respond with: "I don't have that information available. Please contact the business owner to get accurate details."

FORBIDDEN: Do not describe yourself as a "family-owned bakery", "cafe", "restaurant", "store", or any other type of business unless explicitly stated in the knowledge base. Do not describe products, services, locations, or business details that are not provided.

CRITICAL INSTRUCTIONS:
1. You have access to complete business information below - USE IT to answer questions
2. NEVER say "I'll be happy to answer questions related to our business" unless the question is completely unrelated to business (like asking about weather, sports, etc.)
3. Always search through the knowledge base first before responding
4. Give specific, detailed answers using the exact information provided
5. Remember conversation history and build on previous interactions

COMPLETE KNOWLEDGE BASE:
${knowledgeBase}

RESPONSE RULES:
- For FAQ questions: Use the FAQ answers VERBATIM - copy the exact text including all emojis, punctuation, and formatting
- For contact questions: Use exact email (${business?.email}), phone (${business?.phoneNumber}), address (${business?.address})
- For company questions: Use company story and business information
- For product questions: Provide detailed product info including prices
- For name questions (e.g., "What's your name?", "Who are you?"): Respond with your assistant name from the knowledge base: "${aiAssistant?.name || "I'm an AI assistant"}"
- For general greetings (e.g., "Hello", "Hi"): Use the intro message if available
- When a question matches any FAQ: Respond with the exact FAQ answer, don't paraphrase or rewrite it
- Only give generic responses for truly irrelevant questions (weather, sports, unrelated topics)

CONVERSATION CONTEXT:
- Remember what we've discussed previously
- Build on previous questions and answers
- Reference earlier parts of our conversation when relevant

You represent ${business?.companyName || "our business"} and customers expect accurate, specific information from our knowledge base.`;
}

// Helper function to generate AI response
async function generateAiResponse(messages: any[], aiAssistant: any, business: any, products: any[]): Promise<string> {
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
      return aiResponse.choices[0]?.message?.content || "";
    } else {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
  } catch (error) {
    console.log("OpenAI API not available, using intelligent fallback");
    return generateFallbackResponse(messages[messages.length - 1].content, aiAssistant, business, products);
  }
}

// Helper function for fallback responses
function generateFallbackResponse(message: string, aiAssistant: any, business: any, products: any[]): string {
  const businessName = business?.companyName || "our business";
  const introMsg = aiAssistant?.introMessage || `Hello! I'm ${aiAssistant?.name || "an AI assistant"} for ${businessName}.`;

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `${introMsg} How can I help you today?`;
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    if (products.length > 0) {
      let pricingResponse = `Here's our pricing information:\n\n`;
      products.forEach((product: any, index: number) => {
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
      return pricingResponse;
    } else {
      return `I'd be happy to help with pricing information. Please contact us at ${business?.email || 'our sales team'} for detailed pricing.`;
    }
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
    return `You can reach us at:\n${business?.email ? `Email: ${business.email}\n` : ''}${business?.phoneNumber ? `Phone: ${business.phoneNumber}\n` : ''}${business?.address ? `Address: ${business.address}` : ''}`;
  } else {
    return `Thank you for your message! I'm here to help with any questions about ${businessName}. How can I assist you?`;
  }
}

// Helper function to get relevant product images
function getRelevantProductImages(message: string, aiMessage: string, products: any[]): string[] {
  const images: string[] = [];
  const messageWords = message.toLowerCase().split(' ');

  for (const product of products) {
    if (product.name && product.imageUrls) {
      const productNameWords = product.name.toLowerCase().split(' ');
      const mentionsProduct = productNameWords.some((word: string) => 
        messageWords.includes(word) || aiMessage.toLowerCase().includes(word)
      );

      if (mentionsProduct) {
        images.push(...product.imageUrls);
      }
    }
  }

  return images;
}

// Helper function to update analytics
async function updateAnalytics(userId: string): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAnalytics = await storage.getAnalytics(userId);
    const analyticsData = {
      userId,
      date: today,
      unreadMessages: (existingAnalytics?.unreadMessages || 0) + 1,
      messagesHuman: (existingAnalytics?.messagesHuman || 0) + 1,
      messagesAi: (existingAnalytics?.messagesAi || 0) + 1,
      moneySaved: existingAnalytics?.moneySaved || "25.00",
      leads: existingAnalytics?.leads || 0,
      opportunities: existingAnalytics?.opportunities || 0,
      followUps: existingAnalytics?.followUps || 0,
      hourlyData: existingAnalytics?.hourlyData || {}
    };

    await storage.upsertAnalytics(userId, analyticsData);
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
}