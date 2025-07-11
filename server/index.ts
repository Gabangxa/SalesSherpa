import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, DatabaseStorage } from "./storage";
import { 
  apiRateLimiter, 
  loginRateLimiter, 
  sanitizeRequestBody, 
  securityHeaders, 
  csrfProtection,
  csrfTokenMiddleware
} from "./security";
import session from 'express-session';
import { setupAuth } from "./auth";

// Initialize Express app
const app = express();

// Apply security headers to all requests
app.use(securityHeaders);

// Apply rate limiting to all API requests
app.use('/api', apiRateLimiter);

// Apply specific rate limit to authentication endpoints
app.use('/api/auth/login', loginRateLimiter);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sanitize all incoming request bodies
app.use(sanitizeRequestBody);

// Setup authentication BEFORE routes
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database with demo data
    if (storage instanceof DatabaseStorage) {
      log("Initializing database with demo data...");
      await storage.setupInitialData();
      log("Database initialization complete");
    }
  } catch (error) {
    log(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
