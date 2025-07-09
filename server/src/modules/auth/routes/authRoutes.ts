import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAuthenticated } from "../../../../replitAuth";
import multer from "multer";
import path from "path";

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

export function setupAuthRoutes(app: Express): void {
  // Get current user info
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mock email authentication endpoint for testing
  app.post('/api/auth/email', async (req, res) => {
    try {
      const { email, password, mode = 'login' } = req.body;

      // Log the attempt
      console.log("Email authentication attempt:", { email, password: "***", mode });

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Try to get existing user first
      let existingUser = await storage.getUserByEmail(email);

      // Handle signup mode
      if (mode === 'signup') {
        if (existingUser) {
          return res.status(409).json({ message: "User already exists with this email" });
        }
        // Create new user for signup
        // Continue with user creation logic below
      } else {
        // Handle login mode
        if (!existingUser) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
      }

      // Create user data (either existing or new)
      const mockUser = existingUser || {
        id: "email-" + Date.now(),
        email: email,
        firstName: mode === 'signup' ? "New" : "Test",
        lastName: mode === 'signup' ? "User" : "User",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a mock session similar to Replit Auth
      const mockSession = {
        claims: {
          sub: mockUser.id,
          email: email,
          first_name: "Test",
          last_name: "User",
          profile_image_url: null,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        },
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };

      // Store user in database
      if (!existingUser) {
        await storage.upsertUser(mockUser);
        console.log(`${mode === 'signup' ? 'Created new account' : 'Created test account'} for:`, email);
      }

      // Set session
      (req as any).login(mockSession, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        res.json({ 
          success: true, 
          message: mode === 'signup' ? "Account created successfully" : "Authentication successful",
          user: mockUser
        });
      });

    } catch (error) {
      console.error("Email authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        // Clear all possible session cookies
        res.clearCookie('session');
        res.clearCookie('auth');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get('/api/auth/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        // Clear all possible session cookies
        res.clearCookie('session');
        res.clearCookie('auth');
        res.redirect('/');
      });
    });
  });

  // Profile picture upload endpoint
  app.post('/api/auth/profile-picture', isAuthenticated, imageUpload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the public URL for the uploaded image
      const profileImageUrl = `/uploads/images/${file.filename}`;

      // Update user with new profile picture URL
      console.log('Updating user profile picture for user:', userId, 'with URL:', profileImageUrl);
      await storage.updateUserProfilePicture(userId, profileImageUrl);
      console.log('Profile picture updated successfully');

      res.json({ 
        message: "Profile picture uploaded successfully",
        profileImageUrl: profileImageUrl
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });
}