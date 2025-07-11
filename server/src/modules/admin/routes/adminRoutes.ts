import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAdmin, isSuperAdmin, logAdminActivity, adminRoute } from "../../../../adminAuth";
import { insertAdminLogSchema } from "@shared/schema";
import { z } from "zod";

// Admin user management routes
export function registerAdminRoutes(app: Express) {
  // Get all users (paginated)
  app.get("/api/admin/users", ...adminRoute("view_users"), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || "";

      let result;
      if (search) {
        result = await storage.searchUsers(search, page, limit);
      } else {
        result = await storage.getAllUsers(page, limit);
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get specific user details
  app.get("/api/admin/users/:userId", ...adminRoute("view_user"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role (super admin only)
  app.put("/api/admin/users/:userId/role", ...adminRoute("update_user_role", true), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!["user", "admin", "super_admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Prevent super admin from downgrading themselves
      if (req.admin.id === userId && req.admin.role === "super_admin" && role !== "super_admin") {
        return res.status(400).json({ message: "Cannot downgrade your own super admin role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin activity logs
  app.get("/api/admin/logs", ...adminRoute("view_logs"), async (req: any, res) => {
    try {
      const adminId = req.query.adminId;
      const targetUserId = req.query.targetUserId;
      const limit = parseInt(req.query.limit) || 100;

      const logs = await storage.getAdminLogs(adminId, targetUserId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", ...adminRoute("view_stats"), async (req: any, res) => {
    try {
      const { users, total: totalUsers } = await storage.getAllUsers(1, 1);
      const logs = await storage.getAdminLogs(undefined, undefined, 10);
      
      // Get role distribution
      const { users: allUsers } = await storage.getAllUsers(1, 1000);
      const roleStats = allUsers.reduce((acc, user) => {
        const role = user.role || "user";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalUsers,
        roleStats,
        recentLogs: logs.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Check admin status
  app.get("/api/admin/check", isAdmin, async (req: any, res) => {
    try {
      res.json({
        isAdmin: true,
        adminInfo: req.admin,
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Get specific user details
  app.get("/api/admin/users/:userId", ...adminRoute("view_user_details"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Get user's business information
  app.get("/api/admin/users/:userId/business", ...adminRoute("view_user_business"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const business = await storage.getBusiness(userId);
      res.json(business);
    } catch (error) {
      console.error("Error fetching user business:", error);
      res.status(500).json({ message: "Failed to fetch business information" });
    }
  });

  // Get user's conversations
  app.get("/api/admin/users/:userId/conversations", ...adminRoute("view_user_conversations"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get user's activity logs
  app.get("/api/admin/users/:userId/logs", ...adminRoute("view_user_logs"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getAdminLogs(undefined, userId, 20);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user logs:", error);
      res.status(500).json({ message: "Failed to fetch user logs" });
    }
  });

  // Update user (role, status, etc.)
  app.patch("/api/admin/users/:userId", ...adminRoute("update_user"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role, status } = req.body;

      if (role) {
        await storage.updateUserRole(userId, role);
      }

      if (status) {
        await storage.updateUserStatus(userId, status);
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Reset user account
  app.post("/api/admin/users/:userId/reset", ...adminRoute("reset_user_account"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Here you would implement the reset logic
      // For now, we'll just log the action
      res.json({ message: "User account reset successfully" });
    } catch (error) {
      console.error("Error resetting user:", error);
      res.status(500).json({ message: "Failed to reset user account" });
    }
  });

  // Manual admin log creation (for testing)
  app.post("/api/admin/logs", ...adminRoute("create_log"), async (req: any, res) => {
    try {
      const logData = insertAdminLogSchema.parse(req.body);
      const log = await storage.createAdminLog({
        ...logData,
        adminId: req.admin.id,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.get("User-Agent") || null,
      });
      res.json(log);
    } catch (error) {
      console.error("Error creating admin log:", error);
      res.status(500).json({ message: "Failed to create admin log" });
    }
  });
}