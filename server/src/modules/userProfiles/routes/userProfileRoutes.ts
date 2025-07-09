// server/src/modules/userProfiles/routes/userProfileRoutes.ts

import { Express } from "express";
import { isAuthenticated } from "../../../../replitAuth";
import { storage } from "../../../../storage";
import { imageUpload } from "../../../middleware/uploadMiddleware";

export function setupUserProfileRoutes(app: Express) {

  // User profile management endpoints

  // Get the active user profile (MUST be before other parameterized routes)
  app.get('/api/user-profiles/active', isAuthenticated, async (req: any, res) => {
    console.log("=== ACTIVE PROFILE ENDPOINT CALLED ===");
    try {
      const businessOwnerId = req.user.claims.sub;
      console.log(`Getting profiles for business owner: ${businessOwnerId}`);
      const profiles = await storage.getUserProfiles(businessOwnerId);
      console.log(`Retrieved ${profiles.length} profiles`);

      console.log(`Searching for active profile among:`, profiles.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isActive: p.isActive 
      })));

      // Find the active profile
      const activeProfile = profiles.find(profile => profile.isActive === true);

      console.log(`Active profile search result:`, activeProfile);
      console.log(`Profile isActive values:`, profiles.map(p => ({ name: p.name, isActive: p.isActive, type: typeof p.isActive })));

      if (!activeProfile) {
        console.log("No active profile found - this is the bug!");
        return res.status(404).json({ message: "No active user profile found" });
      }

      console.log(`Found active profile: ${activeProfile.name} (${activeProfile.id})`);
      res.json(activeProfile);

    } catch (error) {
      console.error("Error fetching active user profile:", error);
      res.status(500).json({ message: "Failed to fetch active user profile" });
    }
  });

  // Get all user profiles for the current business owner
  app.get('/api/user-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const businessOwnerId = req.user.claims.sub;
      const profiles = await storage.getUserProfiles(businessOwnerId);

      console.log(`User profiles for ${businessOwnerId}:`, profiles.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isActive: p.isActive 
      })));

      // If there are profiles but none are active, set the first one as active
      if (profiles.length > 0 && !profiles.some(p => p.isActive)) {
        console.log(`Setting first profile as active: ${profiles[0].id}`);
        await storage.setActiveUserProfile(businessOwnerId, profiles[0].id);
        // Refetch profiles to get the updated isActive status
        const updatedProfiles = await storage.getUserProfiles(businessOwnerId);
        console.log(`Updated profiles:`, updatedProfiles.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isActive: p.isActive 
        })));
        res.json(updatedProfiles);
      } else {
        res.json(profiles);
      }
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      res.status(500).json({ message: "Failed to fetch user profiles" });
    }
  });

  // Get a specific user profile
  app.get('/api/user-profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const profileId = req.params.id;
      const profile = await storage.getUserProfile(profileId);

      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Create a new user profile
  app.post('/api/users/create', isAuthenticated, imageUpload.single('profileImage'), async (req: any, res) => {
    try {
      const businessOwnerId = req.user.claims.sub;
      const { name, email, password, position } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      console.log(`Creating user profile for business owner ${businessOwnerId}:`, {
        name,
        email,
        position,
        hasProfileImage: !!req.file
      });

      // Handle profile image if uploaded
      let profileImageUrl = null;
      if (req.file) {
        profileImageUrl = `/uploads/images/${req.file.filename}`;
      }

      // Create user profile in database
      const newProfile = await storage.createUserProfile(businessOwnerId, {
        name,
        email,
        position: position || null,
        profileImageUrl,
        isActive: false, // New profiles start as inactive
      });

      res.json({
        message: "User profile created successfully",
        user: newProfile
      });

    } catch (error) {
      console.error("Error creating user profile:", error);
      res.status(500).json({ message: "Failed to create user profile" });
    }
  });

  // Update a user profile
  app.put('/api/user-profiles/:id', isAuthenticated, imageUpload.single('profileImage'), async (req: any, res) => {
    try {
      const profileId = req.params.id;
      const { name, email, position } = req.body;

      // Prepare updates object
      const updates: any = {
        name,
        email,
        position: position || null,
      };

      // Handle profile image if uploaded
      if (req.file) {
        updates.profileImageUrl = `/uploads/images/${req.file.filename}`;
      }

      const updatedProfile = await storage.updateUserProfile(profileId, updates);

      res.json({
        message: "User profile updated successfully",
        user: updatedProfile
      });

    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Delete a user profile
  app.delete('/api/user-profiles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const profileId = req.params.id;

      await storage.deleteUserProfile(profileId);

      res.json({
        message: "User profile deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting user profile:", error);
      res.status(500).json({ message: "Failed to delete user profile" });
    }
  });

  // Activate a user profile (switch to this user)
  app.post('/api/user-profiles/:id/activate', isAuthenticated, async (req: any, res) => {
    console.log(`=== ACTIVATE PROFILE ENDPOINT CALLED ===`);
    console.log(`Profile ID: ${req.params.id}`);
    console.log(`Business Owner: ${req.user?.claims?.sub}`);

    try {
      const businessOwnerId = req.user.claims.sub;
      const profileId = req.params.id;

      console.log(`Activating profile ${profileId} for business owner ${businessOwnerId}`);
      await storage.setActiveUserProfile(businessOwnerId, profileId);
      console.log(`Profile activation successful`);

      res.json({
        message: "User profile activated successfully"
      });

    } catch (error) {
      console.error("Error activating user profile:", error);
      res.status(500).json({ message: "Failed to activate user profile" });
    }
  });
}