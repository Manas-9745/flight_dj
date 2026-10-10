const rateLimit = require('express-rate-limit');

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again after 15 minutes.'
  }
});

// Stricter rate limiter for AI Assistant calls (20 requests per 5 minutes)
const aiAssistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI Rate Limit Exceeded',
    message: 'Too many queries sent to AI assistant. Please wait a few moments before trying again.'
  }
});

module.exports = {
  apiLimiter,
  aiAssistantLimiter
};
