# Google OAuth "invalid_client" Error Fix

## Problem Identified ✅ SOLVED!
Google OAuth is returning `invalid_client` error due to **DUPLICATE CREDENTIALS** in Replit Secrets.

**Root Cause**: Multiple `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` entries causing authentication conflicts.

**Solution**: Remove duplicate entries from Replit Secrets - keep only one set of credentials.

## Current Configuration
- Client ID: `617083895783-1khpahfgl9uslt7ln119qlgmnghog7l2.apps.googleusercontent.com`
- Redirect URI: `https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback`

## Fix Steps

### Step 1: Remove Duplicate Credentials ✅ CRITICAL FIX
1. Go to your Replit Secrets (Tools → Secrets)
2. Delete the duplicate `GOOGLE_CLIENT_ID` entry
3. Delete the duplicate `GOOGLE_CLIENT_SECRET` entry
4. Keep only one set of credentials
5. Restart the application

### Step 2: Enable Required APIs ✅ COMPLETED
1. Go to: https://console.cloud.google.com/apis/library
2. Search for "Google+ API" and enable it ✅ DONE
3. Search for "People API" and enable it ✅ DONE
4. Make sure you're in the same project as your OAuth client ✅ DONE

### Step 3: Recreate OAuth Client (if needed)
1. If the OAuth client is missing:
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add redirect URI: `https://449a5e08-99f4-4100-9571-62eeba47fe54-00-3gozoz68wjgp4.spock.replit.dev/auth/callback`
   - Copy the new Client ID and Client Secret
   - Update the Replit Secrets with new credentials

### Step 3: Fix OAuth Consent Screen Configuration 🚨 CRITICAL
**Current Issue**: "Access blocked: Authorization Error" despite APIs being enabled

**Solution Options**:

**Option A: Publish OAuth Consent Screen (Recommended)**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "PUBLISH APP" button
3. This will allow any Google user to authenticate (removes test user restriction)
4. You may need to verify domain ownership

**Option B: Fix Test User Configuration**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "Edit App"
3. Go to "Test users" section
4. Ensure `tech@minechat.ai` is properly added
5. Make sure there are no typos in the email address
6. Save changes

**Option C: Check OAuth Consent Screen Settings**
1. Verify "User Type" is set to "External" (not "Internal")
2. Ensure all required fields are filled out
3. Add proper app domain and authorized domains
4. Verify scopes include `email` and `profile`

## Alternative Solution
Use the email authentication system which works perfectly while fixing Google OAuth.