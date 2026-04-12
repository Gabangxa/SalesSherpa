import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { sendEmail, generateVerificationToken, generateVerificationEmail } from "./emailService";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { setupGoogleAuth } from "./googleAuth";

const PostgresSessionStore = connectPg(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored) {
    return false;
  }
  
  // Handle plain text passwords (development mode)
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // Handle hashed passwords (production mode)
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax'
    },
    rolling: true, // Reset expiration on each request
    name: 'connect.sid' // Explicit session name
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Google authentication
  setupGoogleAuth(app);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }

        // Check if this is a Google-only user
        if (user.authProvider === 'google' && !user.password) {
          return done(null, false, { message: "Please use Google Sign In for this account" });
        }

        if (!user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User not found for ID: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.log(`Error deserializing user ${id}:`, err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing username
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate required fields
      if (!req.body.username || req.body.username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      
      if (!req.body.password || req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      if (!req.body.name || req.body.name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      if (!req.body.role || req.body.role.trim().length === 0) {
        return res.status(400).json({ message: "Role is required" });
      }

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });

      // Send verification email
      const baseUrl = process.env.BASE_URL ||
        (process.env.NODE_ENV === 'production'
          ? `https://${req.get('host')}`
          : `http://${req.get('host')}`);
      
      const emailContent = generateVerificationEmail(req.body.name, verificationToken, baseUrl);
      emailContent.to = req.body.email;
      
      const emailSent = await sendEmail(emailContent);
      
      if (!emailSent) {
        console.error('Failed to send verification email');
      }

      // Return success message without logging user in
      return res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account.",
        emailSent: emailSent,
        userId: user.id
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(401).json({ 
          message: "Please verify your email address before logging in. Check your email for the verification link.",
          emailNotVerified: true
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired verification token" });
      }

      // Check if token has expired
      if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Verify the user
      await storage.updateUserVerification(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });

      res.json({ message: "Email verified successfully! You can now log in." });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await storage.updateUserVerification(user.id, {
        verificationToken,
        verificationTokenExpiry
      });

      // Send verification email
      const baseUrl = process.env.BASE_URL ||
        (process.env.NODE_ENV === 'production'
          ? `https://${req.get('host')}`
          : `http://${req.get('host')}`);
      
      const emailContent = generateVerificationEmail(user.name, verificationToken, baseUrl);
      emailContent.to = email;
      
      const emailSent = await sendEmail(emailContent);
      
      res.json({ 
        message: "Verification email sent! Please check your email.",
        emailSent: emailSent
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
}