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
  
  const callbackURL = process.env.NODE_ENV === 'development' 
    ? "http://localhost:5000/auth/callback"
    : `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : ''}/auth/callback`;
  
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

  // Google auth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/auth/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      successRedirect: "/",
    })
  );
}