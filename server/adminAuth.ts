import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";

// Admin authentication middleware
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user has admin role
    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Add admin info to request
    req.admin = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Super admin only middleware
export const isSuperAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    console.log("🔒 isSuperAdmin middleware - checking authentication");
    console.log("🍪 Session ID:", req.sessionID);
    console.log("🔍 Request authenticated:", req.isAuthenticated());
    console.log("👤 User object:", req.user);
    
    // Check if user is authenticated first
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      console.log("❌ User not authenticated or no claims");
      console.log("❌ req.isAuthenticated():", req.isAuthenticated());
      console.log("❌ req.user:", req.user);
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.claims.sub;
    console.log("👤 User ID:", userId);
    
    const user = await storage.getUser(userId);
    console.log("📝 User from database:", user);
    
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user has super admin role
    if (user.role !== "super_admin") {
      console.log("❌ User role is not super_admin:", user.role);
      return res.status(403).json({ message: "Super admin access required" });
    }

    console.log("✅ Super admin access granted");
    
    // Add admin info to request
    req.admin = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error("Super admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Admin activity logging middleware
export const logAdminActivity = (action: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      if (req.admin) {
        const details = {
          method: req.method,
          url: req.url,
          body: req.body,
          params: req.params,
          query: req.query,
        };

        await storage.createAdminLog({
          adminId: req.admin.id,
          action,
          targetUserId: req.params.userId || req.body.userId || null,
          details,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get("User-Agent") || null,
        });
      }
      next();
    } catch (error) {
      console.error("Admin logging error:", error);
      // Don't fail the request if logging fails
      next();
    }
  };
};

// Admin session management
export class AdminSessionManager {
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  static async createSession(adminId: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    await storage.createAdminSession({
      adminId,
      sessionToken,
      expiresAt,
      ipAddress,
      userAgent,
      isActive: true,
    });

    return sessionToken;
  }

  static async validateSession(sessionToken: string): Promise<{ adminId: string; role: string } | null> {
    const session = await storage.getAdminSession(sessionToken);
    
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    const admin = await storage.getUser(session.adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "super_admin")) {
      return null;
    }

    return { adminId: session.adminId, role: admin.role };
  }

  static async invalidateSession(sessionToken: string): Promise<void> {
    await storage.updateAdminSession(sessionToken, { isActive: false });
  }

  static async invalidateAllUserSessions(adminId: string): Promise<void> {
    await storage.invalidateAllAdminSessions(adminId);
  }
}

// Admin route protection helper
export const adminRoute = (action: string, requireSuperAdmin: boolean = false) => {
  return [
    requireSuperAdmin ? isSuperAdmin : isAdmin,
    logAdminActivity(action),
  ];
};