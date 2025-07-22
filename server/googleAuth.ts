import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
    return;
  }

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        // Update profile image if changed
        if (profile.photos && profile.photos[0] && user.profileImage !== profile.photos[0].value) {
          await storage.updateUser(user.id, {
            profileImage: profile.photos[0].value
          });
          user = await storage.getUser(user.id) || user;
        }
        return done(null, user);
      }

      // Check if user exists with same email
      user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (user) {
        // Link Google account to existing user
        await storage.updateUser(user.id, {
          googleId: profile.id,
          profileImage: profile.photos?.[0]?.value || user.profileImage,
          emailVerified: true // Google accounts are pre-verified
        });
        user = await storage.getUser(user.id) || user;
        return done(null, user);
      }

      // Create new user
      const newUser = await storage.createUser({
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || (profile.name?.givenName + ' ' + profile.name?.familyName) || 'Google User',
        role: 'Sales Professional', // Default role
        googleId: profile.id,
        profileImage: profile.photos?.[0]?.value,
        authProvider: 'google'
      });

      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error);
    }
  }));

  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/');
    }
  );
}