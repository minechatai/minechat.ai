// server/src/routes/business.ts

import { Express } from 'express';
import { storage } from '../models/storage';
import { isAuthenticated } from '../../replitAuth';
import { insertBusinessSchema } from '../../../shared/schema';

export function setupBusinessRoutes(app: Express) {
  // Get business information
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

  // Create or update business information
  app.post('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("📝 Business save request - userId:", userId);
      console.log("📝 Business save request - body:", req.body);
      console.log("📝 Business save request - FAQs specifically:", req.body.faqs);
      // Log emoji presence for debugging
      console.log("📝 Business save request - contains emoji:", req.body.faqs ? req.body.faqs.includes('📞') : false);

      const validatedData = insertBusinessSchema.parse(req.body);
      console.log("📝 Business save - validated data:", validatedData);
      console.log("📝 Business save - validated FAQs:", validatedData.faqs);
      console.log("📝 Business save - validated contains emoji:", validatedData.faqs ? validatedData.faqs.includes('📞') : false);

      const business = await storage.upsertBusiness(userId, { ...validatedData, userId });
      console.log("📝 Business save - result:", business);
      console.log("📝 Business save - result FAQs:", business.faqs);
      console.log("📝 Business save - result contains emoji:", business.faqs ? business.faqs.includes('📞') : false);
      res.json(business);
    } catch (error) {
      console.error("Error saving business:", error);
      res.status(500).json({ message: "Failed to save business" });
    }
  });

  // Delete business information
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
}