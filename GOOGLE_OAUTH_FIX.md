# Google OAuth "invalid_client" Error Fix

## Problem Identified
Google OAuth is returning `invalid_client` error despite OAuth client existing in Google Console.

**Status**: OAuth client exists with correct Client ID, but authentication still fails.

**Most likely causes**:
1. Client Secret mismatch (needs regeneration)
2. Google OAuth API not enabled in project
3. Project/API permissions issue

## Current Configuration
- Client ID: `617083895783-1khpahfgl9uslt7ln119qlgmnghog7l2.apps.googleusercontent.com`
- Redirect URI: `https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback`

## Fix Steps

### Step 1: Regenerate Client Secret (Most Likely Fix)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID: `617083895783-1khpahfgl9uslt7ln119qlgmnghog7l2.apps.googleusercontent.com`
3. Click the edit (pencil) icon
4. Delete the existing client secret
5. Click "Add Secret" to generate a new one
6. Copy the new Client Secret
7. Update GOOGLE_CLIENT_SECRET in Replit Secrets

### Step 2: Enable Required APIs
1. Go to: https://console.cloud.google.com/apis/library
2. Search for "Google+ API" and enable it
3. Search for "OAuth 2.0 API" and enable it
4. Make sure you're in the same project as your OAuth client

### Step 3: Recreate OAuth Client (if needed)
1. If the OAuth client is missing:
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add redirect URI: `https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback`
   - Copy the new Client ID and Client Secret
   - Update the Replit Secrets with new credentials

### Step 4: Verify OAuth Consent Screen
1. Make sure OAuth consent screen is configured
2. Add `tech@minechat.ai` to test users
3. Verify scopes include `email` and `profile`

## Alternative Solution
Use the email authentication system which works perfectly while fixing Google OAuth.