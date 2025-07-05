import {
  users,
  businesses,
  aiAssistants,
  products,
  documents,
  conversations,
  messages,
  analytics,
  channels,
  facebookConnections,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type AiAssistant,
  type InsertAiAssistant,
  type Product,
  type InsertProduct,
  type Document,
  type InsertDocument,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Analytics,
  type InsertAnalytics,
  type Channel,
  type InsertChannel,
  type FacebookConnection,
  type InsertFacebookConnection,
  type ConversationWithLastMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Business operations
  getBusiness(userId: string): Promise<Business | undefined>;
  upsertBusiness(userId: string, business: InsertBusiness): Promise<Business>;
  deleteBusiness(userId: string): Promise<void>;

  // AI Assistant operations
  getAiAssistant(userId: string): Promise<AiAssistant | undefined>;
  upsertAiAssistant(userId: string, assistant: InsertAiAssistant): Promise<AiAssistant>;
  deleteAiAssistant(userId: string): Promise<void>;

  // Product operations
  getProducts(userId: string): Promise<Product[]>;
  createProduct(userId: string, product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Document operations
  getDocuments(userId: string): Promise<Document[]>;
  createDocument(userId: string, document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Conversation operations
  getConversations(userId: string): Promise<ConversationWithLastMessage[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(conversationId: number): Promise<void>;
  updateConversationMode(conversationId: number, mode: string): Promise<void>;

  // Message operations
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Analytics operations
  getAnalytics(userId: string): Promise<Analytics | undefined>;
  upsertAnalytics(userId: string, analytics: InsertAnalytics): Promise<Analytics>;

  // Channel operations
  getChannel(userId: string): Promise<Channel | undefined>;
  upsertChannel(userId: string, channel: InsertChannel): Promise<Channel>;

  // Facebook connection operations
  getFacebookConnection(userId: string): Promise<FacebookConnection | undefined>;
  upsertFacebookConnection(userId: string, connection: InsertFacebookConnection): Promise<FacebookConnection>;
  disconnectFacebook(userId: string): Promise<void>;
  getAllFacebookConnections(): Promise<FacebookConnection[]>;
  getConversationByFacebookSender(userId: string, facebookSenderId: string): Promise<Conversation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Business operations
  async getBusiness(userId: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, userId));
    return business;
  }

  async upsertBusiness(userId: string, businessData: InsertBusiness): Promise<Business> {
    const existing = await this.getBusiness(userId);
    
    if (existing) {
      const [business] = await db
        .update(businesses)
        .set({ ...businessData, updatedAt: new Date() })
        .where(eq(businesses.id, existing.id))
        .returning();
      return business;
    } else {
      const [business] = await db
        .insert(businesses)
        .values({ ...businessData, userId })
        .returning();
      return business;
    }
  }

  async deleteBusiness(userId: string): Promise<void> {
    await db
      .delete(businesses)
      .where(eq(businesses.userId, userId));
  }

  // AI Assistant operations
  async getAiAssistant(userId: string): Promise<AiAssistant | undefined> {
    const [assistant] = await db
      .select()
      .from(aiAssistants)
      .where(eq(aiAssistants.userId, userId));
    return assistant;
  }

  async upsertAiAssistant(userId: string, assistantData: InsertAiAssistant): Promise<AiAssistant> {
    const existing = await this.getAiAssistant(userId);
    
    if (existing) {
      const [assistant] = await db
        .update(aiAssistants)
        .set({ ...assistantData, updatedAt: new Date() })
        .where(eq(aiAssistants.id, existing.id))
        .returning();
      return assistant;
    } else {
      const [assistant] = await db
        .insert(aiAssistants)
        .values({ ...assistantData, userId })
        .returning();
      return assistant;
    }
  }

  async deleteAiAssistant(userId: string): Promise<void> {
    await db
      .delete(aiAssistants)
      .where(eq(aiAssistants.userId, userId));
  }

  // Product operations
  async getProducts(userId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(userId: string, productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({ ...productData, userId })
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Document operations
  async getDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(userId: string, documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({ ...documentData, userId })
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Conversation operations
  async getConversations(userId: string): Promise<ConversationWithLastMessage[]> {
    // First get all conversations for the user
    const allConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));
    
    // Then get the last message for each conversation
    const conversationsWithMessages = await Promise.all(
      allConversations.map(async (conversation) => {
        const [lastMessage] = await db
          .select({ content: messages.content })
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);
        
        return {
          ...conversation,
          lastMessage: lastMessage?.content || null
        };
      })
    );
    
    return conversationsWithMessages;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(userId: string, conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({ ...conversationData, userId })
      .returning();
    return conversation;
  }

  async updateConversationLastMessage(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async updateConversationMode(conversationId: number, mode: string): Promise<void> {
    await db
      .update(conversations)
      .set({ mode: mode })
      .where(eq(conversations.id, conversationId));
  }

  // Message operations
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    
    // Update conversation's lastMessageAt timestamp
    if (messageData.conversationId) {
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, messageData.conversationId));
    }
    
    return message;
  }

  // Analytics operations
  async getAnalytics(userId: string): Promise<Analytics | undefined> {
    const [analyticsRecord] = await db
      .select()
      .from(analytics)
      .where(eq(analytics.userId, userId))
      .orderBy(desc(analytics.date))
      .limit(1);
    return analyticsRecord;
  }

  async upsertAnalytics(userId: string, analyticsData: InsertAnalytics): Promise<Analytics> {
    const [analyticsRecord] = await db
      .insert(analytics)
      .values({ ...analyticsData, userId })
      .returning();
    return analyticsRecord;
  }

  // Channel operations
  async getChannel(userId: string): Promise<Channel | undefined> {
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, userId));
    return channel;
  }

  async upsertChannel(userId: string, channelData: InsertChannel): Promise<Channel> {
    const existing = await this.getChannel(userId);
    
    if (existing) {
      const [channel] = await db
        .update(channels)
        .set({ ...channelData, updatedAt: new Date() })
        .where(eq(channels.id, existing.id))
        .returning();
      return channel;
    } else {
      const [channel] = await db
        .insert(channels)
        .values({ ...channelData, userId })
        .returning();
      return channel;
    }
  }

  // Facebook connection operations
  async getFacebookConnection(userId: string): Promise<FacebookConnection | undefined> {
    const [connection] = await db
      .select()
      .from(facebookConnections)
      .where(eq(facebookConnections.userId, userId));
    return connection || undefined;
  }

  async upsertFacebookConnection(userId: string, connectionData: InsertFacebookConnection): Promise<FacebookConnection> {
    const existing = await this.getFacebookConnection(userId);
    
    if (existing) {
      const [connection] = await db
        .update(facebookConnections)
        .set({ ...connectionData, updatedAt: new Date() })
        .where(eq(facebookConnections.id, existing.id))
        .returning();
      return connection;
    } else {
      const [connection] = await db
        .insert(facebookConnections)
        .values({ ...connectionData, userId })
        .returning();
      return connection;
    }
  }

  async disconnectFacebook(userId: string): Promise<void> {
    await db
      .update(facebookConnections)
      .set({ isConnected: false, updatedAt: new Date() })
      .where(eq(facebookConnections.userId, userId));
  }

  async getAllFacebookConnections(): Promise<FacebookConnection[]> {
    return await db.select().from(facebookConnections).where(eq(facebookConnections.isConnected, true));
  }

  async getConversationByFacebookSender(userId: string, facebookSenderId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          eq(conversations.facebookSenderId, facebookSenderId)
        )
      );
    return conversation;
  }
}

export const storage = new DatabaseStorage();
