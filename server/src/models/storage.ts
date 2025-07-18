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
  userProfiles,
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
  type UserProfile,
  type InsertUserProfile,
  type ConversationWithLastMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

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

  // FAQ Analysis operations
  getMessagesForFaqAnalysis(userId: string, startDate?: string, endDate?: string): Promise<Message[]>;
  getCustomerAiMessages(userId: string, startDate?: string, endDate?: string): Promise<Message[]>;
  getOutboundMessages(userId: string, startDate?: string, endDate?: string): Promise<{ai: Message[], human: Message[]}>;
  getInboundCustomerMessages(userId: string, startDate?: string, endDate?: string): Promise<Message[]>;

  // Channel operations
  getChannel(userId: string): Promise<Channel | undefined>;
  upsertChannel(userId: string, channel: InsertChannel): Promise<Channel>;

  // Facebook connection operations
  getFacebookConnection(userId: string): Promise<FacebookConnection | undefined>;
  upsertFacebookConnection(userId: string, connection: InsertFacebookConnection): Promise<FacebookConnection>;
  disconnectFacebook(userId: string): Promise<void>;
  getAllFacebookConnections(): Promise<FacebookConnection[]>;
  getConversationByFacebookSender(userId: string, facebookSenderId: string): Promise<Conversation | undefined>;

  // User profile operations
  getUserProfiles(businessOwnerId: string): Promise<UserProfile[]>;
  getUserProfile(profileId: string): Promise<UserProfile | undefined>;
  createUserProfile(businessOwnerId: string, profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(profileId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  deleteUserProfile(profileId: string): Promise<void>;
  setActiveUserProfile(businessOwnerId: string, profileId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log("🔍 getUserByEmail called with:", email);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    console.log("🔍 getUserByEmail result:", user ? {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    } : "NO USER FOUND");
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      // If there's still a conflict on ID, try to find the existing user by email
      console.log("Error upserting user:", error);
      const existingUser = await this.getUserByEmail(userData.email!);
      if (existingUser) {
        return existingUser;
      }
      throw error;
    }
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

  // User profile operations
  async getUserProfiles(businessOwnerId: string): Promise<UserProfile[]> {
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.businessOwnerId, businessOwnerId))
      .orderBy(userProfiles.createdAt);
    return profiles;
  }

  async getUserProfile(profileId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, profileId));
    return profile;
  }

  async createUserProfile(businessOwnerId: string, profileData: InsertUserProfile): Promise<UserProfile> {
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [profile] = await db
      .insert(userProfiles)
      .values({
        ...profileData,
        id: profileId,
        businessOwnerId,
      })
      .returning();
    return profile;
  }

  async updateUserProfile(profileId: string, profileData: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [profile] = await db
      .update(userProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, profileId))
      .returning();
    return profile;
  }

  async deleteUserProfile(profileId: string): Promise<void> {
    await db
      .delete(userProfiles)
      .where(eq(userProfiles.id, profileId));
  }

  async setActiveUserProfile(businessOwnerId: string, profileId: string): Promise<void> {
    // First, deactivate all profiles for this business owner
    await db
      .update(userProfiles)
      .set({ isActive: false })
      .where(eq(userProfiles.businessOwnerId, businessOwnerId));

    // Then activate the selected profile
    await db
      .update(userProfiles)
      .set({ isActive: true })
      .where(eq(userProfiles.id, profileId));
  }

  // FAQ Analysis operations
  async getMessagesForFaqAnalysis(userId: string, startDate?: string, endDate?: string): Promise<Message[]> {
    try {
      console.log("Database connection established");
      
      let query = db
        .select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            eq(messages.senderType, "user") // Only get user/customer messages
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end date
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              eq(messages.senderType, "user"),
              sql`${messages.createdAt} >= ${start}`,
              sql`${messages.createdAt} <= ${end}`
            )
          )
          .orderBy(desc(messages.createdAt));
      }

      const result = await query;
      return result.map(row => row.messages);
    } catch (error) {
      console.error("Error fetching messages for FAQ analysis:", error);
      throw error;
    }
  }

  async getCustomerAiMessages(userId: string, startDate?: string, endDate?: string): Promise<Message[]> {
    try {
      console.log("Database connection established");
      
      let query = db
        .select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            eq(messages.senderType, "ai"), // Only get AI messages
            // Exclude test conversations by filtering conversation IDs from legitimate sources
            sql`${conversations.source} != 'test'`
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end date
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              eq(messages.senderType, "ai"),
              sql`${conversations.source} != 'test'`,
              sql`${conversations.mode} = 'ai'`, // Only count AI mode conversations
              sql`${messages.createdAt} >= ${start}`,
              sql`${messages.createdAt} <= ${end}`
            )
          )
          .orderBy(desc(messages.createdAt));
      }

      const result = await query;
      return result.map(row => row.messages);
    } catch (error) {
      console.error("Error fetching customer AI messages:", error);
      throw error;
    }
  }

  async getOutboundMessages(userId: string, startDate?: string, endDate?: string): Promise<{ai: Message[], human: Message[]}> {
    try {
      console.log("Database connection established");
      
      let baseQuery = db
        .select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            // Only outbound messages (AI or human responses to customers)
            or(
              eq(messages.senderType, "ai"),
              eq(messages.senderType, "human")
            ),
            // Exclude test conversations
            sql`${conversations.source} != 'test'`
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end date
        
        baseQuery = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              or(
                eq(messages.senderType, "ai"),
                eq(messages.senderType, "human")
              ),
              sql`${conversations.source} != 'test'`,
              sql`${messages.createdAt} >= ${start}`,
              sql`${messages.createdAt} <= ${end}`
            )
          )
          .orderBy(desc(messages.createdAt));
      }

      const result = await baseQuery;
      const allMessages = result.map(row => row.messages);
      
      // Separate AI and human messages
      const aiMessages = allMessages.filter(msg => msg.senderType === "ai");
      const humanMessages = allMessages.filter(msg => msg.senderType === "human");
      
      return {
        ai: aiMessages,
        human: humanMessages
      };
    } catch (error) {
      console.error("Error fetching outbound messages:", error);
      throw error;
    }
  }

  async getInboundCustomerMessages(userId: string, startDate?: string, endDate?: string): Promise<Message[]> {
    try {
      console.log("Database connection established");
      
      let query = db
        .select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            eq(messages.senderType, "user"), // Only inbound customer messages
            // Exclude test conversations
            sql`${conversations.source} != 'test'`
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end date
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              eq(messages.senderType, "user"), // Only inbound customer messages
              sql`${conversations.source} != 'test'`,
              sql`${messages.createdAt} >= ${start}`,
              sql`${messages.createdAt} <= ${end}`
            )
          )
          .orderBy(desc(messages.createdAt));
      }

      const result = await query;
      return result.map(row => row.messages);
    } catch (error) {
      console.error("Error fetching inbound customer messages:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
