// server/src/routes/products.ts

import { Express } from 'express';
import { storage } from '../models/storage';
import { isAuthenticated } from '../../replitAuth';
import { insertProductSchema } from '../../../shared/schema';
import { imageUpload } from '../middleware/uploadMiddleware';

export function setupProductRoutes(app: Express) {
  // Get all products for user
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProducts(userId);

      // Debug log to see what we're getting from the database
      console.log("Products from database:", JSON.stringify(products, null, 2));

      // Ensure proper field mapping for frontend
      const mappedProducts = products.map(product => ({
        ...product,
        // Ensure all fields are properly mapped (Drizzle handles camelCase conversion)
        paymentDetails: product.paymentDetails || "",
        additionalNotes: product.additionalNotes || "",
        thankYouMessage: product.thankYouMessage || "",
        imageUrl: product.imageUrl || "",
        faqs: product.faqs || "",
        discounts: product.discounts || "",
        policy: product.policy || ""
      }));

      console.log("Mapped products for frontend:", JSON.stringify(mappedProducts, null, 2));
      res.json(mappedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create new product
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

  // Update existing product
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

  // Upload product image
  app.post('/api/products/upload-image', isAuthenticated, (req, res, next) => {
    console.log("=== Image upload request received ===");
    console.log("User authenticated:", req.user ? 'Yes' : 'No');
    console.log("User ID:", (req.user as any)?.id);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Session:", req.session ? 'Present' : 'Missing');

    imageUpload.single('image')(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ message: err.message });
      }

      try {
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);

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
        console.error("Error processing upload:", error);
        res.status(500).json({ message: "Failed to upload image" });
      }
    });
  });
}