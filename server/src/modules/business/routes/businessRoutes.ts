import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAuthenticated } from "../../../../replitAuth";
import { insertBusinessSchema } from "@shared/schema";
import { imageUpload } from "../../../middleware/uploadMiddleware";

export function setupBusinessRoutes(app: Express): void {
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

  // Save business information
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

  // Business logo upload
  app.post('/api/business/upload-logo', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the public URL for the uploaded logo
      const logoUrl = `/uploads/images/${file.filename}`;

      // Update business with new logo URL
      console.log('Updating business logo for user:', userId, 'with URL:', logoUrl);
      await storage.upsertBusiness(userId, {
        userId,
        logoUrl: logoUrl,
      });
      console.log('Business logo updated successfully');

      res.json({ 
        message: "Company logo uploaded successfully",
        logoUrl: logoUrl
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });
}