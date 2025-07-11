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
  adminLogs,
  adminSessions,
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
  type AdminLog,
  type InsertAdminLog,
  type AdminSession,
  type InsertAdminSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfilePicture(userId: string, profileImageUrl: string): Promise<User>;

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
  updateFacebookConnection(userId: string, updates: Partial<InsertFacebookConnection>): Promise<void>;
  disconnectFacebook(userId: string): Promise<void>;
  getAllFacebookConnections(): Promise<FacebookConnection[]>;
  getConversationByFacebookSender(userId: string, facebookSenderId: string): Promise<Conversation | undefined>;

  // User profile operations
  getUserProfiles(businessOwnerId: string): Promise<UserProfile[]>;
  getUserProfile(profileId: string): Promise<UserProfile | undefined>;
  getActiveUserProfile(businessOwnerId: string): Promise<UserProfile | undefined>;
  createUserProfile(businessOwnerId: string, profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(profileId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  deleteUserProfile(profileId: string): Promise<void>;
  setActiveUserProfile(businessOwnerId: string, profileId: string): Promise<void>;

  // Notification operations
  getUnreadNotificationCount(userId: string): Promise<number>;
  markConversationAsRead(userId: string, conversationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Admin operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(adminId?: string, targetUserId?: string, limit?: number): Promise<AdminLog[]>;
  
  // Admin session operations
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(sessionToken: string): Promise<AdminSession | undefined>;
  updateAdminSession(sessionToken: string, updates: Partial<InsertAdminSession>): Promise<void>;
  invalidateAllAdminSessions(adminId: string): Promise<void>;
  
  // Admin user management
  getAllUsers(page?: number, limit?: number): Promise<{ users: User[]; total: number }>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserStatus(userId: string, status: string): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  searchUsers(query: string, page?: number, limit?: number): Promise<{ users: User[]; total: number }>;
  
  // Admin account management (same as user operations but with account terminology)
  getAllAccounts(page?: number, limit?: number): Promise<{ accounts: User[]; totalPages: number; currentPage: number; totalAccounts: number }>;
  searchAccounts(query: string, page?: number, limit?: number): Promise<{ accounts: User[]; totalPages: number; currentPage: number; totalAccounts: number }>;
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
    try {
      // Check if this is a co-founder email and set admin role
      const coFounderEmails = ['jayce@minechat.ai', 'justine@minechat.ai', 'tech@minechat.ai'];
      const userDataWithRole = {
        ...userData,
        role: coFounderEmails.includes(userData.email || '') ? 'admin' : (userData.role || 'user'),
      };

      const [user] = await db
        .insert(users)
        .values(userDataWithRole)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userDataWithRole.email,
            firstName: userDataWithRole.firstName,
            lastName: userDataWithRole.lastName,
            profileImageUrl: userDataWithRole.profileImageUrl,
            role: userDataWithRole.role,
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

  async updateUserProfilePicture(userId: string, profileImageUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        profileImageUrl,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
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

  async updateFacebookConnection(userId: string, updates: Partial<InsertFacebookConnection>): Promise<void> {
    await db
      .update(facebookConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(facebookConnections.userId, userId));
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

  async getActiveUserProfile(businessOwnerId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.businessOwnerId, businessOwnerId),
          eq(userProfiles.isActive, true)
        )
      )
      .limit(1);
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
            eq(messages.senderType, "customer"), // Only get customer messages
            // Exclude test conversations
            sql`${conversations.source} != 'test'`
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided (convert to Philippines timezone for accurate filtering)
      if (startDate && endDate) {
        // Convert Philippines date to UTC for database filtering
        const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        const startPH = new Date(startDate + 'T00:00:00.000');
        const endPH = new Date(endDate + 'T23:59:59.999');
        
        // Convert to UTC by subtracting 8 hours
        const startUTC = new Date(startPH.getTime() - philippinesOffset);
        const endUTC = new Date(endPH.getTime() - philippinesOffset);
        
        console.log(`🔍 FAQ Messages Date filtering: PH ${startDate} to ${endDate} -> UTC ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              eq(messages.senderType, "customer"),
              sql`${conversations.source} != 'test'`,
              sql`${messages.createdAt} >= ${startUTC}`,
              sql`${messages.createdAt} <= ${endUTC}`
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
        // Convert to Philippines timezone properly
        const startDatePH = new Date(startDate + 'T00:00:00+08:00');
        const endDatePH = new Date(endDate + 'T23:59:59+08:00');
        
        // Convert to UTC for database query
        const startUTC = startDatePH.toISOString();
        const endUTC = endDatePH.toISOString();
        
        console.log(`🔍 Time Saved Debug - Date filtering: PH ${startDate} to ${endDate} -> UTC ${startUTC} to ${endUTC}`);
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              eq(messages.senderType, "ai"),
              sql`${conversations.source} != 'test'`,
              // Count all AI messages regardless of current conversation mode
              sql`${messages.createdAt} >= ${startUTC}`,
              sql`${messages.createdAt} <= ${endUTC}`
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

      // Add date filtering if provided (convert to Philippines timezone for accurate filtering)
      if (startDate && endDate) {
        // Convert Philippines date to UTC for database filtering
        const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        const startPH = new Date(startDate + 'T00:00:00.000');
        const endPH = new Date(endDate + 'T23:59:59.999');
        
        // Convert to UTC by subtracting 8 hours
        const startUTC = new Date(startPH.getTime() - philippinesOffset);
        const endUTC = new Date(endPH.getTime() - philippinesOffset);
        
        console.log(`🔍 Outbound Messages Date filtering: PH ${startDate} to ${endDate} -> UTC ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
        
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
              sql`${messages.createdAt} >= ${startUTC}`,
              sql`${messages.createdAt} <= ${endUTC}`
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
            or(
              eq(messages.senderType, "customer"), // Traditional customer messages
              eq(messages.senderType, "user")      // Facebook/social media customer messages
            ),
            // Exclude test conversations
            sql`${conversations.source} != 'test'`
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add date filtering if provided (convert to Philippines timezone for accurate filtering)
      if (startDate && endDate) {
        // Convert Philippines date to UTC for database filtering
        const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        const startPH = new Date(startDate + 'T00:00:00.000');
        const endPH = new Date(endDate + 'T23:59:59.999');
        
        // Convert PH date to UTC by SUBTRACTING 8 hours from PH time
        // When it's July 11 00:00 in PH, it's July 10 16:00 in UTC
        const startUTC = new Date(startPH.getTime() - philippinesOffset);
        const endUTC = new Date(endPH.getTime() - philippinesOffset);
        
        console.log(`🔍 Date filtering: PH ${startDate} to ${endDate} -> UTC ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
        
        query = db
          .select()
          .from(messages)
          .innerJoin(conversations, eq(messages.conversationId, conversations.id))
          .where(
            and(
              eq(conversations.userId, userId),
              or(
                eq(messages.senderType, "customer"), // Traditional customer messages
                eq(messages.senderType, "user")      // Facebook/social media customer messages
              ),
              sql`${conversations.source} != 'test'`,
              sql`${messages.createdAt} >= ${startUTC}`,
              sql`${messages.createdAt} <= ${endUTC}`
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

  // Notification operations
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      // Count unread customer messages across all conversations
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            or(
              eq(messages.senderType, "customer"), // Traditional customer messages
              eq(messages.senderType, "user")      // Facebook/social media customer messages
            ),
            or(
              eq(messages.readByAdmin, false),
              sql`messages.read_by_admin IS NULL`
            )
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      // Return 0 if readByAdmin column doesn't exist yet
      return 0;
    }
  }

  async markConversationAsRead(userId: string, conversationId: number): Promise<void> {
    try {
      // Mark all customer messages in this conversation as read
      await db
        .update(messages)
        .set({ readByAdmin: true })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            or(
              eq(messages.senderType, "customer"), // Traditional customer messages
              eq(messages.senderType, "user")      // Facebook/social media customer messages
            )
          )
        );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      // Ignore error if readByAdmin column doesn't exist yet
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      // Mark all customer messages across all user's conversations as read
      const userConversations = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.userId, userId));
      
      const conversationIds = userConversations.map(c => c.id);
      
      if (conversationIds.length > 0) {
        await db
          .update(messages)
          .set({ readByAdmin: true })
          .where(
            and(
              sql`messages.conversation_id IN (${sql.join(conversationIds, sql`, `)})`,
              or(
                eq(messages.senderType, "customer"), // Traditional customer messages
                eq(messages.senderType, "user")      // Facebook/social media customer messages
              )
            )
          );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Ignore error if readByAdmin column doesn't exist yet
    }
  }

  // Admin operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
    return adminLog;
  }

  async getAdminLogs(adminId?: string, targetUserId?: string, limit: number = 100): Promise<AdminLog[]> {
    let conditions = [];

    if (adminId) {
      conditions.push(eq(adminLogs.adminId, adminId));
    }

    if (targetUserId) {
      conditions.push(eq(adminLogs.targetUserId, targetUserId));
    }

    const query = db
      .select()
      .from(adminLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);

    return await query;
  }

  // Admin session operations
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [adminSession] = await db
      .insert(adminSessions)
      .values(session)
      .returning();
    return adminSession;
  }

  async getAdminSession(sessionToken: string): Promise<AdminSession | undefined> {
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken));
    return session;
  }

  async updateAdminSession(sessionToken: string, updates: Partial<InsertAdminSession>): Promise<void> {
    await db
      .update(adminSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adminSessions.sessionToken, sessionToken));
  }

  async invalidateAllAdminSessions(adminId: string): Promise<void> {
    await db
      .update(adminSessions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(adminSessions.adminId, adminId));
  }

  // Admin user management
  async getAllUsers(page: number = 1, limit: number = 50): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const [usersResult, countResult] = await Promise.all([
      db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
    ]);

    return {
      users: usersResult,
      total: countResult[0]?.count || 0,
    };
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all related data first (cascading delete)
    await db.delete(businesses).where(eq(businesses.userId, userId));
    await db.delete(aiAssistants).where(eq(aiAssistants.userId, userId));
    await db.delete(products).where(eq(products.userId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.businessOwnerId, userId));
    await db.delete(conversations).where(eq(conversations.userId, userId));
    await db.delete(facebookConnections).where(eq(facebookConnections.userId, userId));
    await db.delete(analytics).where(eq(analytics.userId, userId));
    await db.delete(adminLogs).where(eq(adminLogs.targetUserId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async searchUsers(query: string, page: number = 1, limit: number = 50): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;
    
    const [usersResult, countResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(
          or(
            sql`${users.email} ILIKE ${searchPattern}`,
            sql`${users.firstName} ILIKE ${searchPattern}`,
            sql`${users.lastName} ILIKE ${searchPattern}`,
            sql`${users.id} ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          or(
            sql`${users.email} ILIKE ${searchPattern}`,
            sql`${users.firstName} ILIKE ${searchPattern}`,
            sql`${users.lastName} ILIKE ${searchPattern}`,
            sql`${users.id} ILIKE ${searchPattern}`
          )
        )
    ]);

    return {
      users: usersResult,
      total: countResult[0]?.count || 0,
    };
  }

  // Account operations (Admin perspective - same as user operations but with account terminology)
  async getAllAccounts(page: number = 1, limit: number = 50): Promise<{ accounts: User[]; totalPages: number; currentPage: number; totalAccounts: number }> {
    const offset = (page - 1) * limit;
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const accountResults = await db.select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    const totalAccounts = countResult.count;
    const totalPages = Math.ceil(totalAccounts / limit);

    return {
      accounts: accountResults,
      totalPages,
      currentPage: page,
      totalAccounts
    };
  }

  async searchAccounts(query: string, page: number = 1, limit: number = 50): Promise<{ accounts: User[]; totalPages: number; currentPage: number; totalAccounts: number }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;
    
    const [accountsResult, countResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(
          or(
            sql`${users.email} ILIKE ${searchPattern}`,
            sql`${users.firstName} ILIKE ${searchPattern}`,
            sql`${users.lastName} ILIKE ${searchPattern}`,
            sql`${users.id} ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          or(
            sql`${users.email} ILIKE ${searchPattern}`,
            sql`${users.firstName} ILIKE ${searchPattern}`,
            sql`${users.lastName} ILIKE ${searchPattern}`,
            sql`${users.id} ILIKE ${searchPattern}`
          )
        )
    ]);

    const totalAccounts = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalAccounts / limit);

    return {
      accounts: accountsResult,
      totalPages,
      currentPage: page,
      totalAccounts
    };
  }
}

export const storage = new DatabaseStorage();
