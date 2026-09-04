import rateLimit from 'express-rate-limit';

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2000, // Increased limit for local development & active exploration
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after a moment.'
  }
});

// Stricter rate limiter for sensitive authentication & OTP routes to prevent brute-forcing
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 60, // Limit each IP to 60 attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication or OTP attempts, please try again after 5 minutes.'
  }
});
