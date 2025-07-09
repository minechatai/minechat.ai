# Google OAuth "invalid_client" Error Fix

## Problem Identified
Google OAuth is returning `invalid_client` error: "The OAuth client was not found"

This means either:
1. The Client ID is incorrect
2. The OAuth client was deleted from Google Console
3. The OAuth client is in a different Google Cloud project

## Current Configuration
- Client ID: `617083895783-1khpahfgl9uslt7ln119qlgmnghog7l2.apps.googleusercontent.com`
- Redirect URI: `https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback`

## Fix Steps

### Step 1: Verify OAuth Client Exists
1. Go to: https://console.cloud.google.com/apis/credentials
2. Look for OAuth 2.0 Client ID with the ID: `617083895783-1khpahfgl9uslt7ln119qlgmnghog7l2.apps.googleusercontent.com`
3. If you don't see it, it may have been deleted or is in a different project

### Step 2: Check Google Cloud Project
1. Make sure you're in the correct Google Cloud project
2. The OAuth client must be in the same project as your OAuth consent screen

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