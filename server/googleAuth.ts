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
  
  // Use the current deployment URL for OAuth callback
  const deploymentDomain = process.env.REPLIT_DOMAINS?.split(',')[0] || '449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev';
  const callbackURL = `https://${deploymentDomain}/auth/callback`;
  
  console.log(`📍 Google OAuth callback URL: ${callbackURL}`);

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
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
    passport.authenticate("google", {
      failureRedirect: "/login",
      successRedirect: "/",
    })
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