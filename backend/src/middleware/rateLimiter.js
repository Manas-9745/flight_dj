const rateLimit = require('express-rate-limit');

// General API rate limiter
const isDev = process.env.NODE_ENV === 'development';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again after a few moments.'
  }
});

// AI Assistant calls rate limiter
const aiAssistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
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
