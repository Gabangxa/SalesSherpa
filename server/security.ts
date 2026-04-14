import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { log } from './vite';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Rate limiter for login endpoints to prevent brute force attacks
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log(`Rate limit exceeded by IP: ${req.ip}`, 'security');
    res.status(429).json({
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60), // minutes
    });
  }
});

/**
 * General API rate limiter for all endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // max 100 requests per windowMs
  standardHeaders: true, 
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log(`API rate limit exceeded by IP: ${req.ip}`, 'security');
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(5 * 60 / 60), // minutes
    });
  }
});

/**
 * Sanitize user input
 * 
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
}

/**
 * Sanitize user input but allow some basic HTML formatting
 * 
 * @param input String to sanitize with some HTML allowed
 * @returns Sanitized string with allowed HTML
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Never sanitize password fields — DOMPurify strips characters like < > & which
// would silently alter passwords and cause login failures.
const SANITIZE_SKIP_KEYS = new Set(['password', 'confirmPassword', 'currentPassword', 'newPassword']);

/**
 * Middleware to sanitize request bodies
 */
export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string' && !SANITIZE_SKIP_KEYS.has(key)) {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}