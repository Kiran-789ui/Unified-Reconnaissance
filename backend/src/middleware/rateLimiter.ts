import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 mins default
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const reconMaxRequests = parseInt(process.env.RECON_RATE_LIMIT_MAX_REQUESTS || '30', 10);

export const standardLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

export const reconLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: reconMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Scan lookup limit exceeded. Please wait a moment before launching new lookups.',
  },
});
