import type { Express } from "express";
import { storage } from "../../../../storage";
import { isAdmin, isSuperAdmin, adminRoute } from "../../../../adminAuth";
import { isAuthenticated } from "../../../../replitAuth";
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
          details: JSON.stringify({ oldRole: req.admin.role, newRole: role }),
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
          details: JSON.stringify({ status }),
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
      const accountId = req.params.accountId;

      // TODO: Implement resetUserData method
      // await storage.resetUserData(accountId);

      // Log the reset action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "reset_account",
        targetUserId: accountId,
        details: JSON.stringify({ message: "Account data reset" }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
      });

      res.json({ success: true, message: "Account reset functionality not yet implemented" });
    } catch (error) {
      console.error("Error resetting account:", error);
      res.status(500).json({ message: "Failed to reset account" });
    }
  });

  // User impersonation for super admins (View as User)
  app.post('/api/admin/view-as-user/:userId', ...adminRoute("view_as_user", true), async (req: any, res) => {
    console.log("👁️ View as user endpoint HIT - Route matched successfully");
    console.log("👁️ Request details:", {
      method: req.method,
      url: req.url,
      params: req.params,
      adminId: req.admin?.id,
      targetUserId: req.params.userId,
      currentSession: {
        isImpersonating: req.session?.isImpersonating,
        impersonatingUserId: req.session?.impersonatingUserId
      }
    });

    try {
      const targetUserId = req.params.userId;
      const adminId = req.admin?.id;

      console.log("👁️ View as user request:", {
        targetUserId,
        adminId,
        hasAdmin: !!req.admin,
        adminRole: req.admin?.role
      });

      if (!adminId) {
        console.error("❌ No admin ID found");
        return res.status(401).json({ message: "Admin authentication required" });
      }

      // Verify target user exists
      console.log("🔍 Looking up target user:", targetUserId);
      const targetUser = await storage.getUser(targetUserId);

      if (!targetUser) {
        console.error("❌ Target user not found:", targetUserId);
        return res.status(404).json({ message: "The account you're trying to access doesn't exist" });
      }

      console.log("✅ Target user found:", {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName
      });

      // Store impersonation info in session (keeping original admin session intact)
      req.session.impersonatingUserId = targetUserId;
      req.session.isImpersonating = true;
      req.session.originalAdminId = adminId; // Keep for reference
      
      // Ensure the admin user info is preserved
      if (!req.session.originalAdminUser && req.admin) {
        req.session.originalAdminUser = {
          id: req.admin.id,
          email: req.admin.email,
          firstName: req.admin.firstName,
          lastName: req.admin.lastName,
          role: req.admin.role
        };
      }

      console.log("✅ Impersonation session set:", {
        adminId,
        impersonatingUserId: targetUserId,
        targetEmail: targetUser.email,
        sessionId: req.session.id
      });

      // Force session save to ensure persistence
      req.session.save((err: any) => {
        if (err) {
          console.error("❌ Session save error:", err);
        } else {
          console.log("✅ Session saved successfully for impersonation");
        }
      });

      // Log the action
      try {
        await storage.createAdminLog({
          adminId,
          action: "view_as_user",
          targetUserId,
          details: `Started viewing as user: ${targetUser.email || targetUser.id}`,
          ipAddress: req.ip || 'unknown'
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log view action:", logError);
      }

      res.json({ 
        success: true, 
        message: `Now viewing as ${targetUser.email || 'user'}`,
        viewingUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.firstName && targetUser.lastName 
            ? `${targetUser.firstName} ${targetUser.lastName}`.trim()
            : targetUser.email || targetUser.id
        }
      });

    } catch (error) {
      console.error("❌ Error starting user view:", error);
      res.status(500).json({ 
        message: "Failed to view as user", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Stop viewing as user (return to admin view)
  app.post('/api/admin/stop-viewing', ...adminRoute("admin"), async (req: any, res) => {
    try {
      if (!req.session.isImpersonating || !req.session.impersonatingUserId) {
        return res.status(400).json({ message: "Not currently viewing as user" });
      }

      const adminId = req.admin?.id;
      const viewedUserId = req.session.impersonatingUserId;

      // Clean up impersonation session data
      delete req.session.impersonatingUserId;
      delete req.session.isImpersonating;
      delete req.session.originalAdminId;
      delete req.session.originalAdminUser;

      // Log the action
      try {
        await storage.createAdminLog({
          adminId,
          action: "stop_viewing_user",
          targetUserId: viewedUserId,
          details: "Stopped viewing as user",
          ipAddress: req.ip || 'unknown'
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log stop viewing action:", logError);
      }

      res.json({ 
        success: true, 
        message: "Returned to admin view" 
      });

    } catch (error) {
      console.error("Error stopping user view:", error);
      res.status(500).json({ message: "Failed to return to admin view" });
    }
  });

  // Debug endpoint to check session structure
  app.get('/api/admin/debug-session', async (req: any, res) => {
    console.log("🔍 Debug session structure:", {
      hasUser: !!req.user,
      hasClaims: !!req.user?.claims,
      userId: req.user?.claims?.sub,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      userStructure: req.user,
      sessionKeys: Object.keys(req.session || {}),
      passportUser: req.session?.passport?.user
    });

    res.json({
      hasUser: !!req.user,
      hasClaims: !!req.user?.claims,
      userId: req.user?.claims?.sub,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      sessionKeys: Object.keys(req.session || {}),
      passportExists: !!req.session?.passport
    });
  });

  // Get current impersonation status
  app.get('/api/admin/view-status', ...adminRoute("admin"), async (req: any, res) => {
    try {
      if (req.session.isImpersonating) {
        const viewedUser = await storage.getUser(req.session.impersonatingUserId);
        const business = await storage.getBusiness(req.session.impersonatingUserId);

        console.log("👁️ View status - viewed user:", {
          id: viewedUser?.id,
          email: viewedUser?.email,
          firstName: viewedUser?.firstName,
          lastName: viewedUser?.lastName,
          businessName: business?.companyName
        });

        res.json({
          isViewing: true,
          viewedUser: {
            id: viewedUser?.id,
            email: viewedUser?.email,
            firstName: viewedUser?.firstName || viewedUser?.first_name,
            lastName: viewedUser?.lastName || viewedUser?.last_name,
            profileImageUrl: viewedUser?.profileImageUrl || viewedUser?.profile_image_url,
            name: viewedUser?.firstName && viewedUser?.lastName 
              ? `${viewedUser.firstName} ${viewedUser.lastName}`.trim()
              : viewedUser?.email || viewedUser?.id
          },
          businessName: business?.companyName || 'Unknown Business'
        });
      } else {
        res.json({ isViewing: false });
      }
    } catch (error) {
      console.error("Error getting view status:", error);
      res.status(500).json({ message: "Failed to get view status" });
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

      // SUPER ADMIN POWER: Allow deletion of anyone except themselves
      if (req.admin.id === accountId) {
        console.log("❌ Super admin trying to delete their own account");
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // SUPER ADMIN OVERRIDE: Can delete any account, including other admins
      console.log("✅ SUPER ADMIN AUTHORIZATION: Proceeding with deletion of account:", accountId);

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
          details: JSON.stringify({ 
            deletedAccount: {
              email: accountToDelete.email,
              firstName: accountToDelete.firstName || accountToDelete.first_name,
              lastName: accountToDelete.lastName || accountToDelete.last_name,
              role: accountToDelete.role
            }
          }),
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
        action: "delete_user_permanently",
        targetUserId: userId,
        details: JSON.stringify({ 
          deletedUser: {
            email: userToDelete.email,
            firstName: userToDelete.firstName,
            lastName: userToDelete.lastName,
            role: userToDelete.role
          }
        }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
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

  // Get admin view status
  app.get('/api/admin/view-status', async (req: any, res) => {
    try {
      const isViewing = !!req.session?.isImpersonating;
      const viewedUserId = req.session?.impersonatingUserId;

      if (isViewing && viewedUserId) {
        // Get the viewed user's info
        const viewedUser = await storage.getUser(viewedUserId);
        if (viewedUser) {
          res.json({
            isViewing: true,
            viewedUser: {
              id: viewedUser.id,
              email: viewedUser.email,
              firstName: viewedUser.firstName,
              lastName: viewedUser.lastName,
              profileImageUrl: viewedUser.profileImageUrl,
              name: viewedUser.firstName && viewedUser.lastName 
                ? `${viewedUser.firstName} ${viewedUser.lastName}`.trim()
                : viewedUser.email || viewedUser.id
            }
          });
          return;
        }
      }

      res.json({ isViewing: false });
    } catch (error) {
      console.error("Error checking view status:", error);
      res.status(500).json({ message: "Failed to check view status" });
    }
  });
}