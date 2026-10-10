const express = require('express');
const router = express.Router();
const path = require('path');

// Import AI assistant service module from ai-assistant directory
const assistantService = require(path.join(__dirname, '../../../ai-assistant/assistantService.js'));

/**
 * POST /api/assistant/chat
 * Body parameters:
 *  - message (string, required): User prompt / query
 *  - flightContext (object, optional): Current flight information
 *  - language (string, optional): Preferred response language ('en', 'hi', 'es', 'fr', etc.)
 *  - history (array, optional): Previous chat messages [{ role, content }]
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, flightContext, language = 'en', history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'The "message" parameter is required and must be a non-empty string.',
      });
    }

    const result = await assistantService.processAssistantChat({
      message: message.trim(),
      flightContext: flightContext || {},
      language: language.toLowerCase(),
      history,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('❌ Assistant Router Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message || 'An unexpected error occurred processing your request.',
    });
  }
});

module.exports = router;
