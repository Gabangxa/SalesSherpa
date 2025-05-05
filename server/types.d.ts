declare module 'csurf';
declare module 'express-rate-limit';

// Extend Express Request to include CSRF
declare namespace Express {
  interface Request {
    csrfToken(): string;
  }
}