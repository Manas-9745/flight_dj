const express = require('express');
const router = express.Router();
const alertsService = require('../services/alertsService');

/**
 * GET /api/alerts
 * List all active and monitoring alerts with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, severity, region, status, search } = req.query;
    const data = await alertsService.getAllAlerts({ category, severity, region, status, search });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/alerts/status
 * Check data provider configuration, cache freshness, and setup instructions
 */
router.get('/status', (req, res) => {
  try {
    const status = alertsService.getProviderStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/alerts/impact
 * Analyze route and flight impact against active alerts
 */
router.post('/impact', async (req, res, next) => {
  try {
    const { flightNumber, origin, destination, connectingAirports, date } = req.body;

    if (!origin && !destination && !flightNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least a flightNumber or origin/destination pair to analyze impact.'
      });
    }

    const impact = await alertsService.analyzeFlightImpact({
      flightNumber,
      origin,
      destination,
      connectingAirports,
      date
    });

    res.json({
      success: true,
      impact
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/alerts/:id
 * Retrieve full details for a specific alert
 */
router.get('/:id', async (req, res, next) => {
  try {
    const alert = await alertsService.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/alerts/:id/ai-summary
 * Generate or fetch an AI-grounded traveler summary for a specific alert
 */
router.post('/:id/ai-summary', async (req, res, next) => {
  try {
    const alert = await alertsService.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const aiSummary = await alertsService.generateAiEventSummary(alert);
    res.json({
      success: true,
      alertId: alert.id,
      headline: alert.headline,
      aiSummary
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
