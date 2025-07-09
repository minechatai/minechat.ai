# Google OAuth Setup Guide

## Current Issue
Your OAuth consent screen is in "Testing" mode, which means only users explicitly added as test users can authenticate.

## Solution Options

### Option 1: Add Test Users (Quick Fix)
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "ADD USERS" in the Test users section
3. Add your email address (and any other emails you want to test with)
4. Save the changes
5. Test Google OAuth again

### Option 2: Publish to Production (Recommended)
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "PUBLISH APP" button
3. This will make your app available to all Google users
4. Note: Google may require verification for sensitive scopes

### Option 3: Use Email Authentication (Alternative)
Use the "Continue with Email" option while setting up Google OAuth properly.

## Current Configuration
- App Status: Testing
- Redirect URI: https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback
- Scopes: email, profile

## Testing Steps After Fix
1. Clear browser cache and cookies
2. Try Google OAuth login
3. Should see Google account selection screen
4. After selection, should redirect to dashboard

## Alternative: Email Login Works
The email authentication system is fully functional and can be used instead of Google OAuth.