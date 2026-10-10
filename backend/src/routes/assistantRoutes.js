const express = require('express');
const router = express.Router();
const assistantService = require('../services/assistantService');
const { aiAssistantLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/assistant/chat
 * Send a message to the AI Travel Assistant with optional flight context
 */
router.post('/chat', aiAssistantLimiter, async (req, res, next) => {
  try {
    const { message, flightContext, language, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'The field "message" is required and cannot be empty.'
      });
    }

    const response = await assistantService.generateTravelGuidance({
      message: message.trim(),
      flightContext: flightContext || null,
      language: language || 'en',
      history: Array.isArray(history) ? history : []
    });

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
