import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Only configure Google OAuth if credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not configured, skipping Google auth setup");
    return;
  }

  console.log("✅ Google OAuth credentials found, setting up Google authentication");
  console.log(`🔑 Google Client ID: "${process.env.GOOGLE_CLIENT_ID!.trim()}"`);
  console.log(`🔑 Google Client Secret length: ${process.env.GOOGLE_CLIENT_SECRET!.length} characters`);
  
  // Use the current deployment URL for OAuth callback
  const deploymentDomain = process.env.REPLIT_DOMAINS?.split(',')[0] || '449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev';
  const callbackURL = `https://${deploymentDomain}/auth/callback`;
  
  console.log(`🚨 GOOGLE OAUTH TROUBLESHOOTING:`);
  console.log(`📍 Current callback URL: ${callbackURL}`);
  console.log(`🔗 OAuth client exists, APIs enabled, but "Access blocked: Authorization Error" persists`);
  console.log(`⚠️  CRITICAL: OAuth consent screen configuration issue`);
  console.log(`💡 Solution: Publish OAuth consent screen to production OR fix test user configuration`);
  console.log(`🔗 Go to: https://console.cloud.google.com/apis/credentials/consent`);
  
  console.log(`📍 Google OAuth callback URL: ${callbackURL}`);

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        callbackURL: callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const googleUser = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || "",
          };

          // Upsert user in database
          const user = await storage.upsertUser(googleUser);
          
          // Create session data
          const sessionUser = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              profile_image_url: user.profileImageUrl,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          };

          return done(null, sessionUser);
        } catch (error) {
          console.error("Google auth error:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Google auth routes with session clearing middleware
  app.get(
    "/api/auth/google",
    (req, res, next) => {
      // Clear any existing session before Google OAuth
      console.log("🔄 Clearing existing session before Google OAuth");
      req.logout(() => {
        req.session.destroy(() => {
          res.clearCookie('connect.sid');
          res.clearCookie('session');
          res.clearCookie('auth');
          console.log("✅ Session cleared, proceeding with Google OAuth");
          console.log(`🔗 Redirecting to Google OAuth with callback: ${callbackURL}`);
          next();
        });
      });
    },
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account consent", // Force account selection and consent every time
      accessType: "offline",
      approvalPrompt: "force", // Force approval prompt
      state: Date.now().toString(), // Add unique state parameter to prevent caching
    })
  );

  app.get(
    "/auth/callback",
    (req, res, next) => {
      console.log("📥 Google OAuth callback received");
      console.log("Query params:", req.query);
      console.log("Headers:", req.headers);
      
      // Check for error in callback
      if (req.query.error) {
        console.log("❌ Google OAuth callback error:", req.query.error);
        console.log("Error description:", req.query.error_description);
        console.log("Full error object:", JSON.stringify(req.query, null, 2));
        
        // Log specific error types
        if (req.query.error === 'access_denied') {
          console.log("🚫 User denied access - this is expected behavior");
        } else if (req.query.error === 'invalid_client') {
          console.log("🚨 Invalid client error - check Google Console credentials");
        } else if (req.query.error === 'unauthorized_client') {
          console.log("🚨 Unauthorized client - check OAuth consent screen settings");
        }
        
        return res.redirect("/login?error=google_oauth_error");
      }
      
      next();
    },
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      // Successful authentication - redirect to dashboard
      console.log("✅ Google OAuth successful, redirecting to dashboard");
      console.log(`👤 Authenticated user: ${req.user?.claims?.email}`);
      // Add a success parameter to help with debugging
      res.redirect("/?auth=success");
    }
  );

  // Google logout endpoint with proper session cleanup
  app.get("/api/auth/google/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        // Force logout from Google by redirecting to Google's logout URL
        const googleLogoutUrl = `https://accounts.google.com/logout?continue=https://appengine.google.com/_ah/logout?continue=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/')}`;
        res.redirect(googleLogoutUrl);
      });
    });
  });
}