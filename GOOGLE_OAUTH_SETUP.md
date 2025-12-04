# Google OAuth Setup Guide

This guide will help you set up Google authentication for the Chai Tapri application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required information (App name, User support email, Developer contact)
     - Add scopes: `email`, `profile`, `openid`
     - Add test users if in testing mode
   - Application type: "Web application"
   - Name: "Chai Tapri Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production frontend URL (e.g., `https://your-app.vercel.app`)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production frontend URL
   - Click "Create"
   - Copy the **Client ID** (you'll need this)

## Step 2: Configure Backend

1. Add the Google Client ID to your backend `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

2. The backend will use this to verify Google ID tokens.

## Step 3: Configure Frontend

1. Add the Google Client ID to your frontend `.env` file:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

2. Restart your frontend development server for the changes to take effect.

## Step 4: Test Google Authentication

1. Start both backend and frontend servers
2. Navigate to the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be automatically logged in and redirected to the chat

## How It Works

1. **User clicks "Continue with Google"**: Frontend opens Google OAuth popup
2. **User signs in with Google**: Google returns an ID token
3. **Frontend sends ID token to backend**: POST request to `/api/auth/google`
4. **Backend verifies token**: Uses Google's OAuth2Client to verify the token
5. **Backend creates/updates user**:
   - Extracts name, email from Google profile
   - Uses name as username (sanitized)
   - Detects gender from name
   - Assigns random avatar based on gender:
     - Male: avatar_1.jpg to avatar_12.jpg (12 options)
     - Female: avatar_13.jpg to avatar_18.jpg (6 options)
6. **Backend returns JWT token**: Frontend stores token and user data
7. **User is logged in**: Redirected to chat interface

## Features

- **Automatic username generation**: Uses Google name as username
- **Gender-based avatar assignment**: Automatically assigns appropriate avatar
- **Seamless login**: No password required for Google users
- **Account linking**: If user exists with same email, links Google account

## Troubleshooting

### Google sign-in button not showing
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart your frontend server after adding the environment variable

### "Invalid Google token" error
- Verify `GOOGLE_CLIENT_ID` in backend `.env` matches the Client ID from Google Console
- Ensure the OAuth consent screen is properly configured
- Check that the authorized origins include your frontend URL

### "Email not provided by Google" error
- Make sure you've requested the `email` scope in OAuth consent screen
- User must grant email permission during Google sign-in

## Security Notes

- Never commit `.env` files with credentials to version control
- Use different Client IDs for development and production
- Regularly rotate OAuth credentials if compromised
- Keep Google Cloud Console access secure
