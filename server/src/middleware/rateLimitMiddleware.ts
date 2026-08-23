import rateLimit from 'express-rate-limit';

// Dedicated Upload Rate Limiter (50 uploads per 15 minutes)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`[RateLimit] Blocked request on Upload endpoint`);
    console.error(`[RateLimit] endpoint: ${req.originalUrl}`);
    console.error(`[RateLimit] IP: ${req.ip}`);
    console.error(`[RateLimit] configured limit: 50`);
    console.error(`[RateLimit] window: 15 minutes`);
    console.error(`[RateLimit] blocked: true`);

    res.status(429).json({
      success: false,
      message: 'Too many meeting uploads from this IP. Please try again after 15 minutes.',
    });
  },
});

// General API & Status Polling Rate Limiter (1200 requests per 15 minutes to allow status polling every 2s)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`[RateLimit] Blocked request on General API endpoint`);
    console.error(`[RateLimit] endpoint: ${req.originalUrl}`);
    console.error(`[RateLimit] IP: ${req.ip}`);
    console.error(`[RateLimit] configured limit: 1200`);
    console.error(`[RateLimit] window: 15 minutes`);
    console.error(`[RateLimit] blocked: true`);

    res.status(429).json({
      success: false,
      message: 'Too many API requests from this IP. Please try again after 15 minutes.',
    });
  },
});
