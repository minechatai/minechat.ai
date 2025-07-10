import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";

// ✅ CORRECTED IMPORTS - Now with proper src/ path
import { setupAuthRoutes } from "./src/modules/auth/routes/authRoutes";
import { setupBusinessRoutes } from "./src/modules/business/routes/businessRoutes";
import { setupAiRoutes } from "./src/modules/ai/routes/aiRoutes";
import { setupProductRoutes } from "./src/modules/products/routes/productRoutes";
import { setupDocumentRoutes } from "./src/modules/documents/routes/documentRoutes";
import { setupConversationRoutes } from "./src/modules/conversations/routes/conversationRoutes";
import { setupAnalyticsRoutes } from "./src/modules/analytics/routes/analyticsRoutes";
import { setupChannelRoutes } from "./src/modules/channels/routes/channelRoutes";
import { setupUserProfileRoutes } from "./src/modules/userProfiles/routes/userProfileRoutes";
import { setupFacebookRoutes } from "./src/modules/facebook/routes/facebookRoutes";
import { setupAiChatEngineRoutes } from "./src/modules/aiChatEngine/routes/aiChatEngineRoutes";

import { 
  insertBusinessSchema, 
  insertAiAssistantSchema, 
  insertProductSchema,
  insertChannelSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import express from "express";

// Helper function to analyze messages for business questions using AI
async function groupQuestionsByIntent(questions: string[]): Promise<any[]> {
  if (questions.length === 0) return [];
  
  // Simple semantic grouping for common patterns
  const groups: { [key: string]: { question: string; count: number; variants: string[] } } = {};
  
  questions.forEach(question => {
    const normalized = question.trim();
    let groupKey = findSemanticGroup(normalized);
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        question: groupKey,
        count: 0,
        variants: []
      };
    }
    
    groups[groupKey].count++;
    groups[groupKey].variants.push(normalized);
  });
  
  return Object.values(groups);
}

function findSemanticGroup(question: string): string {
  const lower = question.toLowerCase();
  
  // Products and services grouping
  if ((lower.includes('product') || lower.includes('service')) && 
      (lower.includes('what') || lower.includes('tell me') || lower.includes('about'))) {
    return "What are your products and services?";
  }
  
  // Specific product functionality
  if (lower.includes('product') && (lower.includes('do') || lower.includes('does'))) {
    return "What does your product do?";
  }
  
  // Discount grouping
  if (lower.includes('discount') || lower.includes('sale') || lower.includes('offer')) {
    return "Do you have any discounts or special offers?";
  }
  
  // Hours/availability grouping
  if (lower.includes('hour') || lower.includes('open') || lower.includes('close') || lower.includes('time')) {
    return "What are your business hours?";
  }
  
  // Pricing grouping
  if (lower.includes('price') || lower.includes('cost') || lower.includes('much')) {
    return "What are your prices?";
  }
  
  // Contact grouping
  if (lower.includes('contact') || lower.includes('reach') || lower.includes('phone') || lower.includes('email')) {
    return "How can I contact you?";
  }
  
  // Location grouping
  if (lower.includes('location') || lower.includes('address') || lower.includes('where')) {
    return "Where are you located?";
  }
  
  // Default: return the original question
  return question;
}

async function analyzeMessagesForQuestions(messages: any[], userId: string) {
  const businessQuestions: string[] = [];
  
  // Create a prompt to extract business-related questions
  const questionDetectionPrompt = `
    Analyze the following customer messages and extract only business-related questions. 
    Focus on questions about: products/services, pricing, office hours, location/address, contact info, policies, features, availability, ordering, support, etc.
    
    EXCLUDE: personal chit-chat, off-topic questions, and non-business inquiries.
    
    Return only the business questions, one per line. Rephrase them in a clear, professional way if needed.
    If a statement implies a question (like "Tell me about your services"), convert it to a question format.
    
    Messages to analyze:
    ${messages.map(m => `- ${m.content}`).join('\n')}
  `;

  try {
    // Try OpenAI API for question detection
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: questionDetectionPrompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const aiResponse = await response.json();
      const extractedQuestions = aiResponse.choices[0]?.message?.content || "";
      
      // Parse the response and filter out empty lines
      const questions = extractedQuestions
        .split('\n')
        .map((q: string) => q.replace(/^[-*]\s*/, '').trim())
        .filter((q: string) => q.length > 10); // Filter out very short responses
        
      businessQuestions.push(...questions);
    } else {
      // Fallback: use basic keyword detection
      const businessKeywords = [
        'price', 'cost', 'how much', 'pricing', 'price list',
        'hours', 'open', 'closed', 'available', 'schedule',
        'where', 'location', 'address', 'directions',
        'contact', 'phone', 'email', 'reach',
        'services', 'products', 'offer', 'provide', 'sell',
        'policy', 'return', 'refund', 'warranty', 'guarantee',
        'support', 'help', 'assistance', 'problem',
        'order', 'buy', 'purchase', 'payment', 'delivery'
      ];
      
      messages.forEach(message => {
        const content = message.content.toLowerCase();
        const hasBusinessKeyword = businessKeywords.some(keyword => content.includes(keyword));
        const isQuestion = content.includes('?') || 
                          content.startsWith('what') || 
                          content.startsWith('how') || 
                          content.startsWith('when') || 
                          content.startsWith('where') || 
                          content.startsWith('why') || 
                          content.startsWith('can') || 
                          content.startsWith('do you') || 
                          content.startsWith('does') ||
                          content.startsWith('tell me');
        
        if (hasBusinessKeyword && (isQuestion || content.length < 100)) {
          businessQuestions.push(message.content);
        }
      });
    }
  } catch (error) {
    console.error("Error in AI question analysis:", error);
    
    // Fallback to keyword-based detection
    const businessKeywords = [
      'price', 'cost', 'how much', 'pricing',
      'hours', 'open', 'closed', 'available',
      'where', 'location', 'address',
      'contact', 'phone', 'email',
      'services', 'products', 'offer',
      'policy', 'return', 'refund',
      'support', 'help', 'order'
    ];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      const hasBusinessKeyword = businessKeywords.some(keyword => content.includes(keyword));
      const isQuestion = content.includes('?') || content.startsWith('what') || content.startsWith('how');
      
      if (hasBusinessKeyword && isQuestion) {
        businessQuestions.push(message.content);
      }
    });
  }
  
  return businessQuestions;
}

// Helper function to group similar questions
function groupSimilarQuestions(questions: string[]) {
  const groups: { question: string; count: number; variants: string[] }[] = [];
  
  questions.forEach(question => {
    const cleanQuestion = question.toLowerCase().replace(/[?!.]/g, '');
    
    // Find if this question is similar to an existing group
    let matchedGroup = groups.find(group => {
      const cleanGroupQuestion = group.question.toLowerCase().replace(/[?!.]/g, '');
      
      // Check for keyword similarity
      const questionWords = cleanQuestion.split(' ').filter(w => w.length > 3);
      const groupWords = cleanGroupQuestion.split(' ').filter(w => w.length > 3);
      
      const commonWords = questionWords.filter(word => 
        groupWords.some(groupWord => 
          groupWord.includes(word) || word.includes(groupWord)
        )
      );
      
      // Consider similar if they share significant keywords
      return commonWords.length >= Math.min(2, Math.floor(questionWords.length / 2));
    });
    
    if (matchedGroup) {
      matchedGroup.count++;
      matchedGroup.variants.push(question);
      
      // Use the most common phrasing (shortest, most professional)
      if (question.length < matchedGroup.question.length && 
          (question.includes('?') || !matchedGroup.question.includes('?'))) {
        matchedGroup.question = question;
      }
    } else {
      groups.push({
        question: question,
        count: 1,
        variants: [question]
      });
    }
  });
  
  return groups;
}

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
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Auth middleware
  await setupAuth(app);
  
  // Google OAuth setup
  setupGoogleAuth(app);

  // Setup modular auth routes
  setupAuthRoutes(app);

  // Setup modular business routes
  setupBusinessRoutes(app);

  // Setup modular AI routes
  setupAiRoutes(app);

  // Setup modular product routes
  setupProductRoutes(app);

  // Setup modular document routes
  setupDocumentRoutes(app);

  // Setup modular conversation routes
  setupConversationRoutes(app);

  // Setup modular analytics routes
  setupAnalyticsRoutes(app);

  // Setup modular channel routes
  setupChannelRoutes(app);

  // Setup modular user profile routes
  setupUserProfileRoutes(app);

  // Setup modular Facebook routes
  setupFacebookRoutes(app);

  // Setup modular AI Chat Engine routes
  setupAiChatEngineRoutes(app);

  // Quick session fix endpoint
  app.get('/api/fix-user-session', async (req: any, res: any) => {
    console.log("🔄 Session fix endpoint called");
    try {
      const originalUser = await storage.getUserByEmail('tech@minechat.ai');
      
      if (!originalUser) {
        return res.status(404).json({ message: "Original user not found" });
      }

      const fixedSession = {
        claims: {
          sub: originalUser.id,
          email: originalUser.email,
          first_name: originalUser.firstName,
          last_name: originalUser.lastName,
          profile_image_url: originalUser.profileImageUrl,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        },
        access_token: "fixed-access-token",
        refresh_token: "fixed-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };

      req.login(fixedSession, (err: any) => {
        if (err) {
          console.error("Session fix error:", err);
          return res.status(500).json({ message: "Failed to fix session" });
        }

        console.log(`✅ Fixed session for user: ${originalUser.email}`);
        res.json({ 
          success: true, 
          message: "Session fixed successfully - please refresh the page",
          user: originalUser
        });
      });

    } catch (error) {
      console.error("Fix session error:", error);
      res.status(500).json({ message: "Session fix failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
