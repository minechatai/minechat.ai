import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business information table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: varchar("company_name"),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  email: varchar("email"),
  companyStory: text("company_story"),
  logoUrl: varchar("logo_url"), // Company logo image URL
  faqs: text("faqs"),
  paymentDetails: text("payment_details"),
  discounts: text("discounts"),
  policy: text("policy"),
  additionalNotes: text("additional_notes"),
  thankYouMessage: text("thank_you_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Assistant configuration
export const aiAssistants = pgTable("ai_assistants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  introMessage: text("intro_message"),
  description: text("description"),
  guidelines: text("guidelines"),
  responseLength: varchar("response_length").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products and services
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name"),
  description: text("description"),
  price: varchar("price"),
  faqs: text("faqs"),
  paymentDetails: text("payment_details"),
  discounts: text("discounts"),
  policy: text("policy"),
  additionalNotes: text("additional_notes"),
  thankYouMessage: text("thank_you_message"),
  imageUrl: varchar("image_url"), // Legacy field for backward compatibility
  imageUrls: text("image_urls").array(), // New field for multiple images
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uploaded documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadStatus: varchar("upload_status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  customerName: varchar("customer_name"),
  customerEmail: varchar("customer_email"),
  customerProfilePicture: varchar("customer_profile_picture"), // For storing Facebook profile pictures
  status: varchar("status").default("active"),
  source: varchar("source").default("web"), // web, facebook, etc.
  facebookSenderId: varchar("facebook_sender_id"), // For Facebook Messenger integration
  mode: varchar("mode").default("ai"), // "ai" or "human" - controls whether AI responds automatically
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id"),
  senderType: varchar("sender_type").notNull(), // 'customer', 'ai', 'human'
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // 'text', 'image', 'file'
  metadata: jsonb("metadata"),
  // Human sender profile information (for message attribution)
  humanSenderProfileId: varchar("human_sender_profile_id"),
  humanSenderName: varchar("human_sender_name"),
  humanSenderProfileImageUrl: varchar("human_sender_profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics data
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  unreadMessages: integer("unread_messages").default(0),
  moneySaved: decimal("money_saved", { precision: 10, scale: 2 }).default("0"),
  leads: integer("leads").default(0),
  opportunities: integer("opportunities").default(0),
  followUps: integer("follow_ups").default(0),
  messagesHuman: integer("messages_human").default(0),
  messagesAi: integer("messages_ai").default(0),
  hourlyData: jsonb("hourly_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Website channels configuration
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  websiteName: varchar("website_name"),
  websiteUrl: varchar("website_url"),
  primaryColor: varchar("primary_color").default("#A53860"),
  embedCode: text("embed_code"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook Messenger connections
export const facebookConnections = pgTable("facebook_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  facebookPageId: varchar("facebook_page_id").notNull(),
  facebookPageName: varchar("facebook_page_name"),
  accessToken: text("access_token").notNull(),
  isConnected: boolean("is_connected").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles for team management
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey(),
  businessOwnerId: varchar("business_owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  position: varchar("position"),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  aiAssistants: many(aiAssistants),
  products: many(products),
  documents: many(documents),
  conversations: many(conversations),
  analytics: many(analytics),
  channels: many(channels),
  facebookConnections: many(facebookConnections),
  userProfiles: many(userProfiles),
}));

export const businessesRelations = relations(businesses, ({ one }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
}));

export const aiAssistantsRelations = relations(aiAssistants, ({ one }) => ({
  user: one(users, {
    fields: [aiAssistants.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, {
    fields: [analytics.userId],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
}));

export const facebookConnectionsRelations = relations(facebookConnections, ({ one }) => ({
  user: one(users, {
    fields: [facebookConnections.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  businessOwner: one(users, {
    fields: [userProfiles.businessOwnerId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertBusiness = typeof businesses.$inferInsert;
export type Business = typeof businesses.$inferSelect;

export type InsertAiAssistant = typeof aiAssistants.$inferInsert;
export type AiAssistant = typeof aiAssistants.$inferSelect;

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertConversation = typeof conversations.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;

// Extended conversation type with last message
export type ConversationWithLastMessage = Conversation & {
  lastMessage?: string | null;
};

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertAnalytics = typeof analytics.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;

export type InsertChannel = typeof channels.$inferInsert;
export type Channel = typeof channels.$inferSelect;

// Zod schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAssistantSchema = createInsertSchema(aiAssistants).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFacebookConnection = typeof facebookConnections.$inferInsert;
export type FacebookConnection = typeof facebookConnections.$inferSelect;

export const insertFacebookConnectionSchema = createInsertSchema(facebookConnections).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  businessOwnerId: true,
  createdAt: true,
  updatedAt: true,
});
