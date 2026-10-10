const express = require('express');
const router = express.Router();
const quickHelpService = require('../services/quickHelpService');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/quick-help/commands
 * Returns all supported quick-dial command definitions (101-108)
 */
router.get('/commands', (req, res) => {
  try {
    const commands = quickHelpService.getAllCommands();
    res.status(200).json({
      success: true,
      data: commands,
      title: 'Quick Help',
      tagline: 'One code. Immediate action.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quick dial commands'
    });
  }
});

/**
 * POST /api/quick-help/resolve
 * Validates and resolves a code with passenger context
 */
router.post('/resolve', apiLimiter, async (req, res, next) => {
  try {
    const { code, flightNumber, origin, destination, connectingAirport, question } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a Quick Help code.'
      });
    }

    const resolution = await quickHelpService.resolveCommand(code, {
      flightNumber,
      origin,
      destination,
      connectingAirport,
      question
    });

    if (!resolution.valid) {
      return res.status(200).json({
        success: false,
        code,
        message: resolution.message || 'Code not recognized. Please try a listed Quick Help code.',
        data: resolution,
        availableCodes: resolution.availableCodes
      });
    }

    res.status(200).json({
      success: true,
      data: resolution
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/quick-help/logs
 * Returns live recorded Quick Help submissions
 */
router.get('/logs', (req, res) => {
  try {
    const logs = quickHelpService.getExecutionLogs();
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quick dial activity logs'
    });
  }
});

/**
 * POST /api/quick-help/log
 * Explicitly logs any dial attempt into the database/activity log
 */
router.post('/log', (req, res) => {
  try {
    const entry = quickHelpService.logExecution(req.body);
    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to log command execution'
    });
  }
});

module.exports = router;

