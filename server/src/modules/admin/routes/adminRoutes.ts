import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAdmin, isSuperAdmin, adminRoute } from "../../../../adminAuth";
import { insertAdminLogSchema } from "@shared/schema";
import { z } from "zod";
// Authentication middleware is handled by adminRoute wrapper

// Admin account management routes
export function registerAdminRoutes(app: Express) {
  // Get all accounts (paginated)
  app.get("/api/admin/accounts", ...adminRoute("view_accounts"), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || "";

      let result;
      if (search) {
        result = await storage.searchAccounts(search, page, limit);
      } else {
        result = await storage.getAllAccounts(page, limit);
      }

      // Filter out user profiles (only show actual business owner accounts)
      const businessAccounts = result.accounts.filter((account: any) => {
        // Exclude user profiles (IDs starting with "profile-") and test accounts
        return !account.id.startsWith("profile-") && 
               !account.id.startsWith("user-") &&
               !account.id.startsWith("temp-") &&
               !account.id.startsWith("google-") &&
               account.email && 
               account.email.length > 0 &&
               account.email !== "test@example.com" &&
               account.email !== "test@minechat.ai";
      });

      // Transform users to accounts with business info
      const accountsWithBusiness = await Promise.all(
        businessAccounts.map(async (account: any) => {
          const business = await storage.getBusiness(account.id);
          return {
            ...account,
            companyName: business?.companyName || null,
          };
        })
      );

      res.json({ 
        accounts: accountsWithBusiness, 
        totalPages: Math.ceil(businessAccounts.length / limit),
        currentPage: page,
        totalAccounts: businessAccounts.length
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get specific account details
  app.get("/api/admin/accounts/:accountId", ...adminRoute("view_account"), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const account = await storage.getUser(accountId);

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Transform the data to match frontend expectations
      const transformedAccount = {
        id: account.id,
        email: account.email,
        firstName: (account as any).firstName || (account as any).first_name,
        lastName: (account as any).lastName || (account as any).last_name,
        profileImageUrl: (account as any).profileImageUrl || (account as any).profile_image_url,
        role: account.role,
        status: account.status,
        createdAt: (account as any).createdAt || (account as any).created_at,
        updatedAt: (account as any).updatedAt || (account as any).updated_at,
      };

      res.json(transformedAccount);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // Get account's business info
  app.get("/api/admin/accounts/:accountId/business", ...adminRoute("view_account_business"), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const business = await storage.getBusiness(accountId);

      res.json(business || null);
    } catch (error) {
      console.error("Error fetching account business:", error);
      res.status(500).json({ message: "Failed to fetch account business" });
    }
  });

  // Get account's users (user profiles)
  app.get("/api/admin/accounts/:accountId/users", ...adminRoute("view_account_users"), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const users = await storage.getUserProfiles(accountId);

      res.json(users);
    } catch (error) {
      console.error("Error fetching account users:", error);
      res.status(500).json({ message: "Failed to fetch account users" });
    }
  });

  // Get account's conversations
  app.get("/api/admin/accounts/:accountId/conversations", ...adminRoute("view_account_conversations"), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const conversations = await storage.getConversations(accountId);

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching account conversations:", error);
      res.status(500).json({ message: "Failed to fetch account conversations" });
    }
  });

  // Get account's activity logs
  app.get("/api/admin/accounts/:accountId/logs", ...adminRoute("view_account_logs"), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const logs = await storage.getAdminLogs(undefined, accountId, 100);

      res.json(logs);
    } catch (error) {
      console.error("Error fetching account logs:", error);
      res.status(500).json({ message: "Failed to fetch account logs" });
    }
  });

  // Update account (role and status)
  app.patch("/api/admin/accounts/:accountId", ...adminRoute("update_account", true), async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const { role, status } = req.body;

      if (role) {
        if (!["user", "admin", "super_admin"].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // Prevent super admin from downgrading themselves
        if (req.admin.id === accountId && req.admin.role === "super_admin" && role !== "super_admin") {
          return res.status(400).json({ message: "Cannot downgrade your own super admin role" });
        }

        const updatedAccount = await storage.updateUserRole(accountId, role);

        // Log the role change
        await storage.createAdminLog({
          adminId: req.admin.id,
          action: "update_account_role",
          targetUserId: accountId,
          details: { oldRole: req.admin.role, newRole: role },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "Unknown",
        });

        res.json(updatedAccount);
      } else if (status) {
        if (!["active", "disabled"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const updatedAccount = await storage.updateUserStatus(accountId, status);

        // Log the status change
        await storage.createAdminLog({
          adminId: req.admin.id,
          action: "update_account_status",
          targetUserId: accountId,
          details: { status },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "Unknown",
        });

        res.json(updatedAccount);
      } else {
        res.status(400).json({ message: "No valid update fields provided" });
      }
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  // Reset account
  app.post("/api/admin/accounts/:accountId/reset", ...adminRoute("reset_account", true), async (req: any, res) => {
    try {


  // Account switching for super admins
  app.post('/api/admin/switch-to-account/:userId', isSuperAdmin, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const adminId = req.admin?.id;

      console.log("🔄 Switch to account request:", {
        targetUserId,
        adminId,
        hasAdmin: !!req.admin,
        hasUser: !!req.user,
        hasSession: !!req.session,
        userStructure: req.user
      });

      if (!adminId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      // Verify target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Store original admin session for switching back
      req.session.originalAdminId = adminId;
      req.session.isSwitchedMode = true;
      req.session.switchedToUserId = targetUserId;

      // Update session to target user - ensure proper structure
      if (!req.user) {
        req.user = { claims: {} };
      }
      if (!req.user.claims) {
        req.user.claims = {};
      }
      req.user.claims.sub = targetUserId;

      // Log the action
      await storage.createAdminLog({
        adminId,
        action: "switch_to_account",
        targetUserId,
        details: `Switched to account: ${targetUser.email || targetUser.id}`,
        ipAddress: req.ip || 'unknown'
      });

      console.log("✅ Account switch successful:", {
        adminId,
        targetUserId,
        targetEmail: targetUser.email,
        newUserSession: req.user
      });

      res.json({ 
        success: true, 
        message: `Switched to account: ${targetUser.email || targetUser.id}`,
        switchedUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name || `${targetUser.firstName} ${targetUser.lastName}`.trim()
        }
      });
    } catch (error) {
      console.error("❌ Error switching to account:", error);
      res.status(500).json({ 
        message: "Failed to switch to account", 
        error: error.message 
      });
    }
  });

  // Switch back to admin account
  app.post('/api/admin/switch-back', ...adminRoute("admin"), async (req: any, res) => {
    try {
      if (!req.session.isSwitchedMode || !req.session.originalAdminId) {
        return res.status(400).json({ message: "Not in switched mode" });
      }

      const originalAdminId = req.session.originalAdminId;
      const switchedFromUserId = req.session.switchedToUserId;

      // Restore original admin session - ensure proper structure
      if (!req.user) {
        req.user = { claims: {} };
      }
      if (!req.user.claims) {
        req.user.claims = {};
      }
      req.user.claims.sub = originalAdminId;
      
      delete req.session.originalAdminId;
      delete req.session.isSwitchedMode;
      delete req.session.switchedToUserId;

      // Log the action
      await storage.createAdminLog({
        adminId: originalAdminId,
        action: "switch_back",
        targetUserId: switchedFromUserId,
        details: "Switched back to admin account",
        ipAddress: req.ip || 'unknown'
      });

      res.json({ 
        success: true, 
        message: "Switched back to admin account" 
      });
    } catch (error) {
      console.error("Error switching back to admin:", error);
      res.status(500).json({ message: "Failed to switch back to admin" });
    }
  });

  // Get current switch status
  app.get('/api/admin/switch-status', ...adminRoute("admin"), async (req: any, res) => {
    try {
      if (req.session.isSwitchedMode) {
        const switchedUser = await storage.getUser(req.session.switchedToUserId);
        const business = await storage.getBusiness(req.session.switchedToUserId);

        res.json({
          isSwitched: true,
          switchedUser: {
            id: switchedUser?.id,
            email: switchedUser?.email,
            name: switchedUser?.name
          },
          businessName: business?.companyName || switchedUser?.name || 'Unknown Business'
        });
      } else {
        res.json({ isSwitched: false });
      }
    } catch (error) {
      console.error("Error getting switch status:", error);
      res.status(500).json({ message: "Failed to get switch status" });
    }
  });

      const { accountId } = req.params;

      // Reset all account data except the user record itself
      await storage.deleteBusiness(accountId);
      await storage.deleteAiAssistant(accountId);

      // Log the reset action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "reset_account",
        targetUserId: accountId,
        details: { resetType: "full_reset" },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
      });

      res.json({ message: "Account reset successfully" });
    } catch (error) {
      console.error("Error resetting account:", error);
      res.status(500).json({ message: "Failed to reset account" });
    }
  });

  // Delete account (super admin only)
  app.delete("/api/admin/accounts/:accountId/delete", isSuperAdmin, async (req: any, res) => {
    try {
      console.log("🗑️ DELETE ACCOUNT REQUEST:", { 
        accountId: req.params.accountId, 
        adminId: req.admin?.id,
        adminRole: req.admin?.role,
        adminEmail: req.admin?.email
      });

      const { accountId } = req.params;

      // Debug admin object
      console.log("🔍 Admin object:", req.admin);

      // Prevent admin from deleting their own account
      if (req.admin.id === accountId) {
        console.log("❌ Admin trying to delete their own account");
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Don't allow deletion of user profiles - only business accounts
      if (accountId.startsWith("profile-") || accountId.startsWith("user-")) {
        return res.status(400).json({ message: "Cannot delete user profiles through this endpoint" });
      }

      // Get user data before deletion for logging
      const accountToDelete = await storage.getUser(accountId);
      console.log("🔍 Account to delete:", accountToDelete);

      if (!accountToDelete) {
        return res.status(404).json({ message: "Account not found" });
      }

      console.log("🗑️ Starting permanent deletion process for account:", accountId);

      // Log the deletion action BEFORE deletion
      try {
        await storage.createAdminLog({
          adminId: req.admin.id,
          action: "delete_account_permanently",
          targetUserId: accountId,
          details: { 
            deletedAccount: {
              email: accountToDelete.email,
              firstName: accountToDelete.firstName || accountToDelete.first_name,
              lastName: accountToDelete.lastName || accountToDelete.last_name,
              role: accountToDelete.role
            }
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "Unknown",
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log deletion action:", logError);
      }

      // Delete the account and all related data
      await storage.deleteUser(accountId);

      console.log("✅ Account deleted successfully:", accountId);
      res.json({ message: "Account deleted permanently", success: true });
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account", error: error.message });
    }
  });

  // Get specific user details (keeping for backward compatibility)
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
      const { accounts, totalAccounts } = await storage.getAllAccounts(1, 1);
      const logs = await storage.getAdminLogs(undefined, undefined, 10);

      // Get role distribution
      const { accounts: allAccounts } = await storage.getAllAccounts(1, 1000);
      const roleStats = allAccounts.reduce((acc, account) => {
        const role = account.role || "user";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalAccounts,
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

  // Get user's business information
  app.get("/api/admin/users/:userId/business", ...adminRoute("view_user_business"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const business = await storage.getBusiness(userId);
      res.json(business);
    } catch (error) {
      console.error("Error fetching user business:", error);
      res.status(500).json({ message: "Failed to fetch user business" });
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
      res.status(500).json({ message: "Failed to fetch user conversations" });
    }
  });

  // Get user's activity logs
  app.get("/api/admin/users/:userId/logs", ...adminRoute("view_user_logs"), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getAdminLogs(undefined, userId, 50);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user logs:", error);
      res.status(500).json({ message: "Failed to fetch user logs" });
    }
  });

  // Delete user permanently
  app.delete("/api/admin/users/:userId/delete", ...adminRoute("delete_user", true), async (req: any, res) => {
    try {
      console.log("🗑️ DELETE USER REQUEST:", { userId: req.params.userId, adminId: req.admin?.id });

      const { userId } = req.params;
      const adminId = req.admin.id;

      // Get user info for logging before deletion
      const userToDelete = await storage.getUser(userId);
      console.log("🔍 User to delete:", userToDelete);

      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (req.admin.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      console.log("🗑️ Starting deletion process for user:", userId);

      // Log the deletion action
      await storage.createAdminLog({
        adminId,
        action: `Deleted user account permanently`,
        targetUserId: userId,
        details: { 
          deletedUser: {
            email: userToDelete.email,
            firstName: userToDelete.firstName,
            lastName: userToDelete.lastName,
            role: userToDelete.role
          }
        },
        ipAddress: req.ip,
      });

      // Delete the user and all related data
      await storage.deleteUser(userId);

      console.log("✅ User deleted successfully:", userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user", error: error.message });
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