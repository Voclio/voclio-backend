import { OAuth2Client } from 'google-auth-library';
import config from './index.js';
// Google OAuth Client for Flutter
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Verify Google ID Token from Flutter
 * @param {string} idToken - ID token from Google Sign In
 * @returns {Object} User info from Google
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
      oauth_id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

/**
 * Verify Facebook token from Flutter
 * @param {string} accessToken - Access token from Facebook Login
 * @returns {Object} User info from Facebook
 */
async function verifyFacebookToken(accessToken) {
  try {
    // Verify token with Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Invalid Facebook token');
    }
    
    const data = await response.json();
    
    if (!data.email) {
      throw new Error('Email permission required');
    }
    
    return {
      oauth_id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
      email_verified: true
    };
  } catch (error) {
    throw new Error('Invalid Facebook token');
  }
}

export { verifyGoogleToken, verifyFacebookToken };
